"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAllowedSkinImageUrl } from "@/lib/skin-blob-url";
import {
  analyzeSkinPortraitAngles,
  compareSkinProgressAngles,
  GeminiAnalysisError,
} from "@/lib/gemini";
import type { SkinDiaryAnalysisJson } from "@/types/skin-diary";

export type CreateSkinEntryResult =
  | { ok: true; id: string }
  | { ok: false; error: string; code?: string };

export async function createSkinDiaryEntryAction(input: {
  imageUrlFront: string;
  imageUrlLeft?: string | null;
  imageUrlRight?: string | null;
  userNote?: string | null;
}): Promise<CreateSkinEntryResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Vui lòng đăng nhập để lưu nhật ký da." };
  }
  const userId = session.user.id;

  const left = input.imageUrlLeft?.trim() || null;
  const right = input.imageUrlRight?.trim() || null;

  try {
    assertAllowedSkinImageUrl(input.imageUrlFront);
    if (left) assertAllowedSkinImageUrl(left);
    if (right) assertAllowedSkinImageUrl(right);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "URL ảnh không hợp lệ." };
  }

  let analysis: SkinDiaryAnalysisJson;
  let comparedWithEntryId: string | undefined;

  try {
    const priorCount = await prisma.skinEntry.count({ where: { userId } });
    const previous =
      priorCount > 0
        ? await prisma.skinEntry.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              imageUrlFront: true,
              imageUrlLeft: true,
              imageUrlRight: true,
            },
          })
        : null;

    if (previous) {
      comparedWithEntryId = previous.id;
      analysis = await compareSkinProgressAngles(
        {
          front: previous.imageUrlFront,
          left: previous.imageUrlLeft,
          right: previous.imageUrlRight,
        },
        { front: input.imageUrlFront, left, right },
      );
      analysis.comparedWithEntryId = comparedWithEntryId;
    } else {
      analysis = await analyzeSkinPortraitAngles(input.imageUrlFront, left, right);
      delete (analysis as { comparedWithEntryId?: string }).comparedWithEntryId;
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
      imageUrlFront: input.imageUrlFront,
      imageUrlLeft: left,
      imageUrlRight: right,
      userNote: input.userNote?.trim() || null,
      analysisResult: analysis as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  revalidatePath("/nhat-ky-da");
  revalidatePath(`/nhat-ky-da/${row.id}`);

  return { ok: true, id: row.id };
}
