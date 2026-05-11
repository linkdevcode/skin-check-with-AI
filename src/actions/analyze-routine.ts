"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzeTextAction } from "@/lib/ai-provider";
import { userMessageFromAiPayload } from "@/lib/ai/messages";
import { isAiStructuredActionError, type AiStructuredActionError } from "@/lib/ai/structured-errors";
import { GeminiAnalysisError } from "@/lib/gemini";
import type { AcneSafety, ConflictItem, SkinTypeInput } from "@/types/routine-analysis";
import { Prisma, SkinType } from "@prisma/client";
import { revalidatePath } from "next/cache";

const SKIN_SET = new Set<SkinTypeInput>(["OILY", "DRY", "COMBINATION", "SENSITIVE"]);

export type AnalyzeRoutineSuccess = {
  ok: true;
  score: number;
  conflicts: ConflictItem[];
  recommendations: string;
  acneSafety: AcneSafety;
  analysisId: string | null;
  saved: boolean;
};

export type AnalyzeRoutineFailure =
  | { ok: false; error: string; code?: string }
  | AiStructuredActionError;

export type AnalyzeRoutineResult = AnalyzeRoutineSuccess | AnalyzeRoutineFailure;

function mapConflicts(
  rows: Array<{ pair: string; level: string; hint?: string | null }>,
): ConflictItem[] {
  const levels = new Set(["high", "medium", "low"]);
  return rows.map((r) => {
    let level = String(r.level).toLowerCase();
    if (!levels.has(level)) level = "medium";
    const item: ConflictItem = {
      pair: String(r.pair).trim() || "Không rõ",
      level: level as ConflictItem["level"],
    };
    const h = r.hint?.trim();
    if (h) item.hint = h;
    return item;
  });
}

function toAcneSafety(raw: {
  summary: string;
  riskLevel: string;
  poreCloggingConcerns: string[];
}): AcneSafety {
  const risks = new Set<AcneSafety["riskLevel"]>(["low", "moderate", "high"]);
  let level = raw.riskLevel as AcneSafety["riskLevel"];
  if (!risks.has(level)) level = "moderate";
  return {
    summary: raw.summary.trim(),
    riskLevel: level,
    poreCloggingConcerns: raw.poreCloggingConcerns ?? [],
  };
}

async function persistAnalysis(input: {
  userId: string;
  routineSnippet: string;
  skinType: SkinType;
  score: number;
  conflicts: ConflictItem[];
  recommendations: string;
}): Promise<{ analysisId: string } | null> {
  const snippet = input.routineSnippet.trim().slice(0, 200);
  const routineName =
    snippet.length > 0
      ? `Routine — ${snippet.replace(/\s+/g, " ")}${input.routineSnippet.length > 200 ? "…" : ""}`
      : "Routine từ SkinCheck AI";

  const conflictsJson = input.conflicts as unknown as Prisma.InputJsonValue;

  const row = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: { skinType: input.skinType },
    });

    const routine = await tx.skincareRoutine.create({
      data: {
        userId: input.userId,
        routineName: routineName.slice(0, 120),
        isActive: true,
      },
    });

    const analysis = await tx.analysisHistory.create({
      data: {
        routineId: routine.id,
        overallScore: input.score,
        conflicts: conflictsJson,
        aiRecommendations: input.recommendations,
      },
    });

    return analysis;
  });

  return { analysisId: row.id };
}

/**
 * Phân tích routine: Groq (văn bản) + fallback Gemini; chỉ lưu DB khi đã đăng nhập.
 */
export async function analyzeRoutine(
  routineText: string,
  skinType: SkinTypeInput,
): Promise<AnalyzeRoutineResult> {
  if (!SKIN_SET.has(skinType)) {
    return { ok: false, error: "Loại da không hợp lệ.", code: "INPUT" };
  }

  try {
    const result = await analyzeTextAction(routineText, skinType);
    if (isAiStructuredActionError(result)) {
      return result;
    }
    if ("error" in result) {
      return {
        ok: false,
        error: userMessageFromAiPayload(result.error, "Văn bản"),
        code: "AI_GATEWAY",
      };
    }
    const conflicts = mapConflicts(result.conflicts);
    const acneSafety = toAcneSafety(result.acneSafety);

    let analysisId: string | null = null;
    let saved = false;

    const session = await auth();

    if (session?.user?.id) {
      try {
        if (!process.env.DATABASE_URL?.trim()) {
          throw new Error("DATABASE_URL is not set");
        }
        const persisted = await persistAnalysis({
          userId: session.user.id,
          routineSnippet: routineText,
          skinType: skinType as SkinType,
          score: result.score,
          conflicts,
          recommendations: result.recommendations,
        });
        analysisId = persisted?.analysisId ?? null;
        saved = Boolean(analysisId);
        if (saved) {
          revalidatePath("/");
          revalidatePath("/lich-su");
        }
      } catch (dbErr) {
        console.error("[analyzeRoutine] Lưu DB thất bại:", dbErr);
      }
    }

    return {
      ok: true,
      score: result.score,
      conflicts,
      recommendations: result.recommendations,
      acneSafety,
      analysisId,
      saved,
    };
  } catch (e) {
    if (e instanceof GeminiAnalysisError) {
      return { ok: false, error: e.message, code: e.code };
    }
    const msg =
      e instanceof Error ? e.message : "Đã xảy ra lỗi không mong muốn. Thử lại sau.";
    return { ok: false, error: msg, code: "INTERNAL" };
  }
}
