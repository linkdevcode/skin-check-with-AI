import { withTransientAiRetries } from "@/lib/ai-retry";
import { analyzeFaceForRoutineBudgetTriple, GeminiAnalysisError } from "@/lib/gemini";
import type { FaceRoutineAnalysis } from "@/types/face-routine-budget";
import { AI_VISION_BUSY_ERROR, type AiStructuredActionError } from "@/lib/ai/structured-errors";
import type { AiGatewayErrorPayload } from "@/lib/ai/messages";

export type AnalyzeImageActionSuccess = { ok: true; data: FaceRoutineAnalysis };

export type AnalyzeImageActionResult =
  | AnalyzeImageActionSuccess
  | AiStructuredActionError
  | AiGatewayErrorPayload;

/**
 * Chỉ Gemini 2.5 Flash — phân tích Vision 3 góc mặt (routine & ngân sách).
 * Không gọi Groq trong tác vụ này.
 */
export async function analyzeImageAction(input: {
  kind: "face_routine_triple";
  imageUrlFront: string;
  imageUrlLeft: string;
  imageUrlRight: string;
}): Promise<AnalyzeImageActionResult> {
  if (input.kind !== "face_routine_triple") {
    return { error: "Unsupported vision kind." };
  }
  try {
    const data = await withTransientAiRetries(() =>
      analyzeFaceForRoutineBudgetTriple(input.imageUrlFront, input.imageUrlLeft, input.imageUrlRight),
    );
    return { ok: true, data };
  } catch (e) {
    if (e instanceof GeminiAnalysisError) {
      if (e.code === "RATE_LIMIT" || e.code === "UNAVAILABLE") {
        return AI_VISION_BUSY_ERROR;
      }
      return {
        ok: false,
        status: "error",
        code: 500,
        message: e.message,
      };
    }
    return {
      ok: false,
      status: "error",
      code: 500,
      message: e instanceof Error ? e.message : "Phân tích ảnh thất bại.",
    };
  }
}
