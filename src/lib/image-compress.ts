import sharp from "sharp";

const DEFAULT_MAX_BYTES = 1_000_000; // < 1MB cho payload Gemini Vision

/**
 * Nén ảnh phía server (resize + JPEG) xuống dưới ngưỡng byte — tương đương pipeline "resize trên canvas" nhưng tối ưu cho Node.
 */
export async function compressImageBufferForGemini(
  input: Buffer,
  maxBytes = DEFAULT_MAX_BYTES,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (input.length <= maxBytes) {
    const meta = await sharp(input).metadata();
    const fmt = meta.format;
    if (fmt === "jpeg" || fmt === "jpg") {
      return { buffer: input, mimeType: "image/jpeg" };
    }
  }

  let quality = 86;
  let maxSide = 2048;
  let last: Buffer = input;

  for (let round = 0; round < 18; round++) {
    const pipeline = sharp(input).rotate().resize(maxSide, maxSide, {
      fit: "inside",
      withoutEnlargement: true,
    });

    const out = await pipeline.jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:2:0" }).toBuffer();
    last = out;
    if (out.length <= maxBytes) {
      return { buffer: out, mimeType: "image/jpeg" };
    }
    quality = Math.max(48, quality - 6);
    if (quality <= 62) maxSide = Math.max(640, Math.floor(maxSide * 0.88));
  }

  return { buffer: last, mimeType: "image/jpeg" };
}
