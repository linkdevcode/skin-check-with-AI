"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertAllowedSkinImageUrl } from "@/lib/skin-blob-url";
import {
  analyzeFaceForRoutineBudget,
  generateRoutineForBudget,
  generateRoutineThreeTiers,
  GeminiAnalysisError,
} from "@/lib/gemini";
import type { FaceRoutineAnalysis, SavedRoutineGenResult } from "@/types/face-routine-budget";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type AnalyzeFaceRoutineResult =
  | { ok: true; data: FaceRoutineAnalysis }
  | { ok: false; error: string; code?: string };

export async function analyzeFaceRoutineAction(imageUrl: string): Promise<AnalyzeFaceRoutineResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Vui lòng đăng nhập." };
  }
  try {
    assertAllowedSkinImageUrl(imageUrl);
    const data = await analyzeFaceForRoutineBudget(imageUrl);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof GeminiAnalysisError) {
      return { ok: false, error: e.message, code: e.code };
    }
    if (e instanceof Error) {
      return { ok: false, error: e.message };
    }
    return { ok: false, error: "Phân tích thất bại." };
  }
}

export type GenerateRoutineSaveInput = {
  imageUrl: string;
  faceAnalysis: FaceRoutineAnalysis;
  mode: "BUDGET" | "AUTO";
  budgetVnd?: number | null;
};

export type GenerateRoutineSaveResult =
  | { ok: true; id: string; routine: SavedRoutineGenResult }
  | { ok: false; error: string; code?: string };

const MIN_BUDGET = 200_000;
const MAX_BUDGET = 35_000_000;

export async function generateAndSaveRoutineAction(
  input: GenerateRoutineSaveInput,
): Promise<GenerateRoutineSaveResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Vui lòng đăng nhập." };
  }
  try {
    assertAllowedSkinImageUrl(input.imageUrl);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "URL ảnh không hợp lệ." };
  }

  let routine: SavedRoutineGenResult;
  try {
    if (input.mode === "BUDGET") {
      const b = input.budgetVnd;
      if (b == null || !Number.isFinite(b)) {
        return { ok: false, error: "Vui lòng nhập ngân sách (VND)." };
      }
      const budget = Math.round(b);
      if (budget < MIN_BUDGET || budget > MAX_BUDGET) {
        return {
          ok: false,
          error: `Ngân sách nên từ ${MIN_BUDGET.toLocaleString("vi-VN")}đ đến ${MAX_BUDGET.toLocaleString("vi-VN")}đ.`,
        };
      }
      const pkg = await generateRoutineForBudget(input.faceAnalysis, budget);
      routine = { kind: "BUDGET", package: pkg };
    } else {
      const tiers = await generateRoutineThreeTiers(input.faceAnalysis);
      routine = { kind: "AUTO", tiers };
    }
  } catch (e) {
    if (e instanceof GeminiAnalysisError) {
      return { ok: false, error: e.message, code: e.code };
    }
    if (e instanceof Error) {
      return { ok: false, error: e.message };
    }
    return { ok: false, error: "Tạo gợi ý thất bại." };
  }

  const row = await prisma.recommendedRoutine.create({
    data: {
      userId: session.user.id,
      imageUrl: input.imageUrl,
      faceAnalysis: input.faceAnalysis as unknown as Prisma.InputJsonValue,
      routineResult: routine as unknown as Prisma.InputJsonValue,
      mode: input.mode,
      budgetVnd: input.mode === "BUDGET" ? Math.round(input.budgetVnd ?? 0) : null,
    },
  });

  revalidatePath("/routine-ngan-sach/lich-su");
  revalidatePath(`/routine-ngan-sach/${row.id}`);

  return { ok: true, id: row.id, routine };
}
