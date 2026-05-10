const FALLBACK_SITE_URL = "http://localhost:3000";

/** URL gốc cho metadata / OG. Đặt NEXT_PUBLIC_APP_URL trên Vercel. */
export function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  try {
    if (raw) return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
  } catch {
    /* ignore */
  }
  return new URL(FALLBACK_SITE_URL);
}
