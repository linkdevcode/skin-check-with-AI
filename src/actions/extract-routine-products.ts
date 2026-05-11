"use server";

import { extractRoutineTextAction } from "@/lib/ai-provider";
import { GeminiAnalysisError } from "@/lib/gemini";
import { userMessageFromAiPayload } from "@/lib/ai/messages";
import { isAiStructuredActionError, type AiStructuredActionError } from "@/lib/ai/structured-errors";

export type ExtractProductsResult =
  | { ok: true; morning: string[]; evening: string[] }
  | { ok: false; error: string; code?: string }
  | AiStructuredActionError;

export async function extractRoutineProductsAction(
  morningText: string,
  eveningText: string,
): Promise<ExtractProductsResult> {
  try {
    const data = await extractRoutineTextAction(morningText, eveningText);
    if (isAiStructuredActionError(data)) {
      return data;
    }
    if ("error" in data) {
      return {
        ok: false,
        error: userMessageFromAiPayload(data.error, "Văn bản"),
        code: "AI_GATEWAY",
      };
    }
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
