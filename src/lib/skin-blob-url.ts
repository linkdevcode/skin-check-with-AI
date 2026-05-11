/**
 * Hostname Vercel Blob: `{storeId}.public|private.blob.vercel-storage.com`
 * (tránh SSRF khi fetch gửi Gemini — chỉ *.blob.vercel-storage.com của Vercel).
 */
export function assertAllowedSkinImageUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL ảnh không hợp lệ.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Chỉ chấp nhận URL https.");
  }
  if (!isVercelBlobStorageHost(parsed.hostname)) {
    throw new Error(
      "URL ảnh phải là Blob Vercel (*.public.blob.vercel-storage.com hoặc *.private.blob.vercel-storage.com).",
    );
  }
}

export function isVercelBlobStorageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host.endsWith(".public.blob.vercel-storage.com") ||
    host === "public.blob.vercel-storage.com" ||
    host.endsWith(".private.blob.vercel-storage.com") ||
    host === "private.blob.vercel-storage.com"
  );
}

/** URL blob private cần Bearer (SDK `get`) — không mở được trong <img> trực tiếp. */
export function isVercelBlobPrivateUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return host.endsWith(".private.blob.vercel-storage.com") || host === "private.blob.vercel-storage.com";
}
