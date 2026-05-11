/** JSON shape for hybrid AI failures surfaced to the client (toast + optional inline). */

export type AiStructuredActionError = {
  ok: false;
  status: "error";
  code: number;
  message: string;
};

export const AI_VISION_BUSY_ERROR: AiStructuredActionError = {
  ok: false,
  status: "error",
  code: 429,
  message: "AI Vision is currently busy. Please try again after 2 minutes.",
};

export const AI_GROQ_TEXT_BUSY_ERROR: AiStructuredActionError = {
  ok: false,
  status: "error",
  code: 429,
  message: "Groq is busy. We are falling back to Gemini for text analysis.",
};

export function isAiStructuredActionError(v: unknown): v is AiStructuredActionError {
  return (
    typeof v === "object" &&
    v != null &&
    "ok" in v &&
    (v as { ok: unknown }).ok === false &&
    "status" in v &&
    (v as { status: unknown }).status === "error" &&
    "code" in v &&
    typeof (v as { code: unknown }).code === "number" &&
    "message" in v &&
    typeof (v as { message: unknown }).message === "string"
  );
}
