/** Lần chờ giữa các lần thử lại khi API quá tải / 429 (theo spec dự án). */
export const AI_RETRY_DELAYS_MS = [2000, 4000, 8000] as const;

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Lỗi tạm thời (429, quá tải, mạng) — dùng chung Groq / Gemini. */
export function isTransientAiFailure(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = String((err as { code: unknown }).code);
    if (code === "RATE_LIMIT" || code === "UNAVAILABLE" || code === "NETWORK") return true;
  }
  const msg =
    err instanceof Error ? `${err.message} ${err.stack ?? ""}` : String(err ?? "");
  return /429|503|rate limit|quota|resource exhausted|overloaded|unavailable|econnreset|fetch failed/i.test(
    msg,
  );
}

/**
 * Tối đa 4 lần gọi (1 lần đầu + 3 lần sau backoff 2s / 4s / 8s).
 */
export async function withTransientAiRetries<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= AI_RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt < AI_RETRY_DELAYS_MS.length && isTransientAiFailure(e)) {
        await sleep(AI_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw e;
    }
  }
  throw last;
}
