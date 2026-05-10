"use server";

import { extractRoutineProducts, GeminiAnalysisError } from "@/lib/gemini";

export type ExtractProductsResult =
  | { ok: true; morning: string[]; evening: string[] }
  | { ok: false; error: string; code?: string };

export async function extractRoutineProductsAction(
  morningText: string,
  eveningText: string,
): Promise<ExtractProductsResult> {
  try {
    const data = await extractRoutineProducts(morningText, eveningText);
    return { ok: true, morning: data.morning, evening: data.evening };
  } catch (e) {
    if (e instanceof GeminiAnalysisError) {
      return { ok: false, error: e.message, code: e.code };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Không tách được danh sách. Thử lại.",
      code: "INTERNAL",
    };
  }
}
