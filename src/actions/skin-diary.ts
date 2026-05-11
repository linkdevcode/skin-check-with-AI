"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertAllowedSkinImageUrl } from "@/lib/skin-blob-url";
import { analyzeSkinPortrait, compareSkinProgress, GeminiAnalysisError } from "@/lib/gemini";
import type { SkinDiaryAnalysisJson } from "@/types/skin-diary";

export type CreateSkinEntryResult =
  | { ok: true; id: string }
  | { ok: false; error: string; code?: string };

export async function createSkinDiaryEntryAction(input: {
  imageUrl: string;
  userNote?: string | null;
}): Promise<CreateSkinEntryResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Vui lòng đăng nhập." };
  }

  try {
    assertAllowedSkinImageUrl(input.imageUrl);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "URL ảnh không hợp lệ." };
  }

  const userId = session.user.id;

  let analysis: SkinDiaryAnalysisJson;
  let comparedWithEntryId: string | undefined;

  try {
    const previous = await prisma.skinEntry.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, imageUrl: true },
    });

    if (previous) {
      comparedWithEntryId = previous.id;
      analysis = await compareSkinProgress(previous.imageUrl, input.imageUrl);
      analysis.comparedWithEntryId = comparedWithEntryId;
    } else {
      analysis = await analyzeSkinPortrait(input.imageUrl);
    }
  } catch (e) {
    if (e instanceof GeminiAnalysisError) {
      return { ok: false, error: e.message, code: e.code };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Phân tích ảnh thất bại." };
  }

  const row = await prisma.skinEntry.create({
    data: {
      userId,
      imageUrl: input.imageUrl,
      userNote: input.userNote?.trim() || null,
      analysisResult: analysis as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return { ok: true, id: row.id };
}
