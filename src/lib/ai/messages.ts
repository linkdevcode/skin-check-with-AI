/** Payload cố định khi Groq/Gemini trả 429 hoặc quá tải — frontend map sang tiếng Việt. */
export const AI_GATE_RATE_LIMIT_PAYLOAD = "Rate limit exceeded" as const;

export type AiGatewayErrorPayload = { error: typeof AI_GATE_RATE_LIMIT_PAYLOAD | string };

export function isAiGatewayError(v: unknown): v is AiGatewayErrorPayload {
  return typeof v === "object" && v !== null && "error" in v && typeof (v as { error: unknown }).error === "string";
}

/** Thông báo hiển thị cho người dùng (ảnh vs văn bản). */
export function aiGatewayBusyMessageVi(mode: "Ảnh" | "Văn bản"): string {
  return `Cổng AI phân tích ${mode} đang bận (hoặc hết lượt), vui lòng thử lại sau 2 phút.`;
}

/** Chuẩn hoá thông báo khi server trả payload lỗi AI. */
export function userMessageFromAiPayload(err: string, mode: "Ảnh" | "Văn bản"): string {
  if (err === AI_GATE_RATE_LIMIT_PAYLOAD || /rate limit|429|quota|exhausted/i.test(err)) {
    return aiGatewayBusyMessageVi(mode);
  }
  return err;
}
