import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";
import type { SkinTypeInput } from "@/types/routine-analysis";
import { assertAllowedSkinImageUrl, isVercelBlobPrivateUrl } from "@/lib/skin-blob-url";
import { get } from "@vercel/blob";
import type { SkinDiaryAnalysisJson } from "@/types/skin-diary";
import type {
  BudgetRoutinePackage,
  FaceRoutineAnalysis,
  RoutineProductPhase,
  RoutineProductSuggestion,
  SkinTypeFromVision,
  ThreeTierRoutineResult,
  TierRoutinePackage,
} from "@/types/face-routine-budget";

const MODEL_ID = "gemini-2.5-flash";

const SKIN_LABEL_VI: Record<SkinTypeInput, string> = {
  OILY: "Da dầu",
  DRY: "Da khô",
  COMBINATION: "Da hỗn hợp",
  SENSITIVE: "Da nhạy cảm",
};

const ROUTINE_ANALYSIS_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  description:
    "Kết quả phân tích routine: điểm, xung đột, Markdown khuyến nghị, đánh giá da mụn/bít tắc.",
  properties: {
    score: {
      type: SchemaType.NUMBER,
      description: "Điểm tổng thể routine từ 0 đến 100.",
    },
    conflicts: {
      type: SchemaType.ARRAY,
      description:
        "Các cặp hoặc nhóm hoạt chất có nguy cơ xung đột hoặc cần tách buổi / giãn cách.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          pair: {
            type: SchemaType.STRING,
            description: 'Mô tắt xung đột, ví dụ "Retinol + BHA (cùng buổi)".',
          },
          level: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["high", "medium", "low"],
            description:
              "high: nguy cơ cao; medium: vừa; low: thấp / chỉ lưu ý khi da nhạy cảm.",
          },
          hint: {
            type: SchemaType.STRING,
            description: "Lời khuyên ngắn bằng tiếng Việt (một câu).",
            nullable: true,
          },
        },
        required: ["pair", "level"],
      },
    },
    recommendations: {
      type: SchemaType.STRING,
      description:
        "Markdown tiếng Việt (##, bullet). Khớp loại da; gồm thứ tự bôi thoa, cân nhắc barrier / SPF.",
    },
    acneSafety: {
      type: SchemaType.OBJECT,
      description:
        "Safe for acne: đánh giá bít tắc tiềm ẩn từ mô tả (ester nặng, dầu khoáng dày, bơ/coconut, isopropyl myristate, lanolin, silicone occlusive dày…). Giáo dục, không chẩn đoán.",
      properties: {
        summary: {
          type: SchemaType.STRING,
          description: "2–4 câu tiếng Việt về mức độ an toàn da mụn / bít tắc.",
        },
        riskLevel: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ["low", "moderate", "high"],
          description:
            "low: ít cờ đỏ; moderate: vài điểm cần xem lại; high: nhiều yếu tố bít tắc hoặc layering đặc.",
        },
        poreCloggingConcerns: {
          type: SchemaType.ARRAY,
          description: "Thành phần / nhóm từ text user cần lưu ý về bít tắc.",
          items: { type: SchemaType.STRING },
        },
      },
      required: ["summary", "riskLevel", "poreCloggingConcerns"],
    },
  },
  required: ["score", "conflicts", "recommendations", "acneSafety"],
};

const SYSTEM_INSTRUCTION = `Bạn là bác sĩ da liễu có kinh nghiệm lâm sàng và kiến thức dược mỹ phẩm (cosmeceuticals). Bạn đang hỗ trợ ứng dụng phân tích routine chăm sóc da dành cho người dùng Việt Nam.

Nhiệm vụ:
1. Đọc văn bản routine và **loại da** mà người dùng đã chọn. Điều chỉnh lời khuyên: da dầu (bài tiết bã, mụn viêm) — làm rõ bước không làm khô quá mức; da khô — ưu tiên barrier, tránh stack quá nhiều exfoliant; da hỗn hợp — tách vùng T / má khi gợi ý; da nhạy cảm — giảm tần suất và layer hoạt chất mạnh.
2. Nhận diện hoạt chất / nhóm thành phần: Retinol/retinoids, BHA, AHA, azelaic, benzoyl peroxide, vitamin C, niacinamide, adapalene, PHA, v.v.
3. Xung đột: kết hợp gây kích ứng đồng thời, nhiều exfoliant cùng đêm, v.v. Phân biệt "tránh cùng bước" vs "giãn cách / khác buổi".
4. SPF buổi sáng khi có retinoids, AHA/BHA, và nhiều hoạt chất làm nhạy nắng.
5. **Da mụn & bít tắc (Safe for acne / comedogenic awareness):** Trường \`acneSafety\` bắt buộc. Dựa trên tên sản phẩm hoặc INCI nếu user ghi — soi các nhóm thường **dễ bít tắc hơn khi da mụn hoặc khi xếp chồng quá dày**, ví dụ (không giới hạn): ester dầu nặng (ethylhexyl palmitate, isopropyl myristate…), dầu khoáng dày lớp, bơ hạt mỡ/coconut oil trong kem dưỡng đặc, lanolin, film-forming silicone rất dày, mỹ phẩm leave-on có nhiều oil đậm. Giải thích rằng thang comedogenic chỉ mang tính tham chiếu, phụ thuộc nồng độ và công thức tổng thể. Không chẩn đoán mụn trứng cá hay kê đơn thuốc.
6. Giọng điệu chuyên nghiệp, thân thiện, tiếng Việt.

Chỉ trả về JSON đúng schema (gồm \`acneSafety\`). \`recommendations\` là Markdown hợp lệ và phải nhất quán với loại da đã cho.`;

function getApiKey(): string {
  const key =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_API_KEY;
  if (!key?.trim()) {
    throw new GeminiAnalysisError(
      "MISSING_KEY",
      "Chưa cấu hình GEMINI_API_KEY (hoặc GOOGLE_GENERATIVE_AI_API_KEY).",
    );
  }
  return key.trim();
}

export class GeminiAnalysisError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiAnalysisError";
  }
}

export type RoutineAnalysisJson = {
  score: number;
  conflicts: Array<{
    pair: string;
    level: "high" | "medium" | "low";
    hint?: string | null;
  }>;
  recommendations: string;
  acneSafety: {
    summary: string;
    riskLevel: "low" | "moderate" | "high";
    poreCloggingConcerns: string[];
  };
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mapGeminiError(err: unknown): GeminiAnalysisError {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Lỗi không xác định từ Gemini.";

  const lower = message.toLowerCase();
  const stack = err instanceof Error ? err.stack ?? "" : "";
  const combined = `${lower} ${stack.toLowerCase()}`;

  if (
    combined.includes("api key") ||
    combined.includes("api_key") ||
    combined.includes("invalid api") ||
    combined.includes("permission_denied")
  ) {
    return new GeminiAnalysisError(
      "AUTH",
      "API key không hợp lệ hoặc hết hạn. Kiểm tra GEMINI_API_KEY trên Vercel / .env.local.",
      err,
    );
  }

  if (
    combined.includes("429") ||
    combined.includes("quota") ||
    combined.includes("resource exhausted") ||
    combined.includes("rate limit")
  ) {
    return new GeminiAnalysisError(
      "RATE_LIMIT",
      "Đã vượt giới hạn gọi API Gemini. Thử lại sau vài phút.",
      err,
    );
  }

  if (
    combined.includes("503") ||
    combined.includes("unavailable") ||
    combined.includes("overloaded") ||
    combined.includes("econnreset")
  ) {
    return new GeminiAnalysisError(
      "UNAVAILABLE",
      "Dịch vụ Gemini tạm thời quá tải. Vui lòng thử lại sau.",
      err,
    );
  }

  if (combined.includes("fetch") || combined.includes("network")) {
    return new GeminiAnalysisError(
      "NETWORK",
      "Không kết nối được tới Google AI. Kiểm tra mạng và thử lại.",
      err,
    );
  }

  return new GeminiAnalysisError("UNKNOWN", message || "Phân tích thất bại.", err);
}

function parseJsonResponse(raw: string): RoutineAnalysisJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiAnalysisError(
      "PARSE",
      "Phản hồi AI không phải JSON hợp lệ. Thử lại.",
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new GeminiAnalysisError("PARSE", "Định dạng phân tích không hợp lệ.");
  }

  const o = parsed as Record<string, unknown>;
  const score = Number(o.score);
  if (!Number.isFinite(score)) {
    throw new GeminiAnalysisError("PARSE", "Thiếu hoặc sai trường score.");
  }

  const clamped = Math.max(0, Math.min(100, score));

  if (!Array.isArray(o.conflicts)) {
    throw new GeminiAnalysisError("PARSE", "Trường conflicts phải là mảng.");
  }

  const levels = new Set(["high", "medium", "low"]);
  const conflicts = o.conflicts.map((c, i) => {
    if (!c || typeof c !== "object") {
      throw new GeminiAnalysisError("PARSE", `conflicts[${i}] không hợp lệ.`);
    }
    const item = c as Record<string, unknown>;
    const pair = String(item.pair ?? "").trim() || "Không rõ";
    let level = String(item.level ?? "low").toLowerCase();
    if (!levels.has(level)) level = "medium";
    const hint =
      item.hint == null || item.hint === ""
        ? undefined
        : String(item.hint).trim();
    return {
      pair,
      level: level as "high" | "medium" | "low",
      ...(hint ? { hint } : {}),
    };
  });

  const recommendations =
    typeof o.recommendations === "string" ? o.recommendations.trim() : "";
  if (!recommendations) {
    throw new GeminiAnalysisError("PARSE", "Thiếu lời khuyên (recommendations).");
  }

  const acneRaw = o.acneSafety;
  if (!acneRaw || typeof acneRaw !== "object") {
    throw new GeminiAnalysisError("PARSE", "Thiếu khối acneSafety.");
  }
  const a = acneRaw as Record<string, unknown>;
  const summary = typeof a.summary === "string" ? a.summary.trim() : "";
  if (!summary) {
    throw new GeminiAnalysisError("PARSE", "Thiếu acneSafety.summary.");
  }
  const riskLevels = new Set(["low", "moderate", "high"]);
  let riskLevel = String(a.riskLevel ?? "moderate").toLowerCase();
  if (!riskLevels.has(riskLevel)) riskLevel = "moderate";

  let poreCloggingConcerns: string[] = [];
  if (Array.isArray(a.poreCloggingConcerns)) {
    poreCloggingConcerns = a.poreCloggingConcerns
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);
  }

  return {
    score: clamped,
    conflicts,
    recommendations,
    acneSafety: {
      summary,
      riskLevel: riskLevel as RoutineAnalysisJson["acneSafety"]["riskLevel"],
      poreCloggingConcerns,
    },
  };
}

const SKIN_TYPE_SET = new Set<SkinTypeInput>(["OILY", "DRY", "COMBINATION", "SENSITIVE"]);

/**
 * Gọi Gemini với response MIME JSON theo schema; có retry backoff cho lỗi tạm thời.
 */
export async function analyzeWithGemini(
  routineText: string,
  skinType: SkinTypeInput,
): Promise<RoutineAnalysisJson> {
  const trimmed = routineText.trim();
  if (!trimmed) {
    throw new GeminiAnalysisError("INPUT", "Routine không được để trống.");
  }

  if (!SKIN_TYPE_SET.has(skinType)) {
    throw new GeminiAnalysisError("INPUT", "Loại da không hợp lệ.");
  }

  if (trimmed.length > 16_000) {
    throw new GeminiAnalysisError("INPUT", "Routine quá dài (tối đa 16.000 ký tự).");
  }

  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.35,
      topP: 0.9,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: ROUTINE_ANALYSIS_SCHEMA,
    },
  });

  const skinLabel = SKIN_LABEL_VI[skinType];

  const userText = `Người dùng chọn loại da: **${skinLabel}** (mã: ${skinType}).

Phân tích routine sau và trả về JSON đúng schema (một object duy nhất, không bọc markdown):

---
${trimmed}
---`;

  const maxAttempts = 4;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(userText);
      const raw = result.response.text();
      return parseJsonResponse(raw);
    } catch (e) {
      lastErr = e;
      const mapped = mapGeminiError(e);
      const retryable =
        mapped.code === "RATE_LIMIT" ||
        mapped.code === "UNAVAILABLE" ||
        mapped.code === "NETWORK" ||
        (e instanceof Error && /429|503|fetch/i.test(e.message));

      if (retryable && attempt < maxAttempts - 1) {
        const delay = Math.min(8000, 600 * 2 ** attempt) + Math.random() * 300;
        await sleep(delay);
        continue;
      }
      throw mapped;
    }
  }

  throw mapGeminiError(lastErr);
}

// --- Bóc tách sản phẩm (Review / Hybrid) ---

const EXTRACT_PRODUCTS_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  description:
    "Danh sách sản phẩm / bước tách từ routine sáng và tối, thứ tự từ đầu đến cuối routine.",
  properties: {
    morning: {
      type: SchemaType.ARRAY,
      description: "Các bước hoặc sản phẩm buổi sáng (theo thứ tự bôi thoa).",
      items: { type: SchemaType.STRING },
    },
    evening: {
      type: SchemaType.ARRAY,
      description: "Các bước hoặc sản phẩm buổi tối (theo thứ tự bôi thoa).",
      items: { type: SchemaType.STRING },
    },
  },
  required: ["morning", "evening"],
};

const EXTRACT_PRODUCTS_INSTRUCTION = `Bạn trích xuất thông tin routine skincare. Nhận hai khối văn bản: buổi sáng và buổi tối (có thể một bên trống).

Nhiệm vụ:
- Tách thành **danh sách các sản phẩm hoặc bước** theo đúng thứ tự người dùng mô tả (từ sữa rửa → serum → kem dưỡng → SPF…).
- Mỗi phần tử là **một chuỗi ngắn gọn**: tên sản phẩm hoặc hoạt chất + loại (ví dụ "CeraVe Foaming Cleanser", "Vitamin C serum", "Kem chống nắng SPF50").
- Bỏ các từ nối như "sau đó", "tiếp theo", dấu →; gộp nếu một dòng chỉ là hoạt chất đơn (vd "BHA 2%").
- Nếu một buổi không có nội dung hoặc không có bước cụ thể, trả về mảng rỗng [].
- Giữ tiếng Việt hoặc tên gốc sản phẩm như người dùng viết.

Chỉ trả về JSON đúng schema hai mảng morning và evening.`;

export type RoutineProductsExtract = {
  morning: string[];
  evening: string[];
};

function parseExtractProductsJson(raw: string): RoutineProductsExtract {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiAnalysisError("PARSE", "Không đọc được danh sách sản phẩm từ AI.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new GeminiAnalysisError("PARSE", "Dữ liệu tách routine không hợp lệ.");
  }
  const o = parsed as Record<string, unknown>;
  const norm = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);
  };
  return {
    morning: norm(o.morning),
    evening: norm(o.evening),
  };
}

/**
 * AI tách sản phẩm từ text sáng / tối (bước Review).
 */
export async function extractRoutineProducts(
  morningText: string,
  eveningText: string,
): Promise<RoutineProductsExtract> {
  const am = morningText.trim();
  const pm = eveningText.trim();
  if (!am && !pm) {
    throw new GeminiAnalysisError("INPUT", "Nhập ít nhất nội dung buổi sáng hoặc buổi tối.");
  }
  if (am.length + pm.length > 16_000) {
    throw new GeminiAnalysisError("INPUT", "Nội dung quá dài (tối đa ~16.000 ký tự).");
  }

  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: EXTRACT_PRODUCTS_INSTRUCTION,
    generationConfig: {
      temperature: 0.2,
      topP: 0.85,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: EXTRACT_PRODUCTS_SCHEMA,
    },
  });

  const userBlock = `### Buổi sáng (AM)\n${am || "(trống)"}\n\n### Buổi tối (PM)\n${pm || "(trống)"}\n\nTrả về JSON với morning và evening là mảng chuỗi.`;

  const maxAttempts = 3;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(userBlock);
      const raw = result.response.text();
      return parseExtractProductsJson(raw);
    } catch (e) {
      lastErr = e;
      const mapped = mapGeminiError(e);
      const retryable =
        mapped.code === "RATE_LIMIT" ||
        mapped.code === "UNAVAILABLE" ||
        mapped.code === "NETWORK" ||
        (e instanceof Error && /429|503|fetch/i.test(e.message));

      if (retryable && attempt < maxAttempts - 1) {
        const delay = Math.min(6000, 500 * 2 ** attempt) + Math.random() * 200;
        await sleep(delay);
        continue;
      }
      throw mapped;
    }
  }

  throw mapGeminiError(lastErr);
}

// --- Nhật ký da / Vision (Gemini 2.5 Flash) ---

async function readableStreamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value?.byteLength) chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

async function fetchImageInlinePart(
  imageUrl: string,
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  assertAllowedSkinImageUrl(imageUrl);
  const signal = AbortSignal.timeout(30_000);
  let buf: Buffer;
  let rawMime: string;

  if (isVercelBlobPrivateUrl(imageUrl)) {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) {
      throw new GeminiAnalysisError(
        "INPUT",
        "Ảnh Blob private cần BLOB_READ_WRITE_TOKEN để tải phía server.",
      );
    }
    const got = await get(imageUrl, { access: "private", token, abortSignal: signal });
    if (!got?.stream) {
      throw new GeminiAnalysisError("NETWORK", "Không tải được ảnh Blob (404 hoặc hết quyền).");
    }
    buf = await readableStreamToBuffer(got.stream);
    rawMime = got.blob.contentType?.split(";")[0]?.trim() || "image/jpeg";
  } else {
    const res = await fetch(imageUrl, { signal });
    if (!res.ok) {
      throw new GeminiAnalysisError("NETWORK", `Không tải được ảnh (${res.status}).`);
    }
    buf = Buffer.from(await res.arrayBuffer());
    rawMime = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
  }

  if (buf.length > 8 * 1024 * 1024) {
    throw new GeminiAnalysisError("INPUT", "Ảnh quá lớn (tối đa 8MB).");
  }
  const mime = /^image\/(jpeg|jpg|png|webp)$/i.test(rawMime)
    ? rawMime.replace(/jpg/i, "jpeg")
    : "image/jpeg";
  return { inlineData: { data: buf.toString("base64"), mimeType: mime } };
}

const SKIN_PORTRAIT_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  description: "Ước lượng từ một ảnh selfie da — giáo dục, không chẩn đoán.",
  properties: {
    acneCount: {
      type: SchemaType.NUMBER,
      description: "Ước lượng số lượng tổn thương giống mụn (viêm/nốt) trong khung hình, 0–50.",
    },
    rednessScore: {
      type: SchemaType.NUMBER,
      description: "Mức đỏ da 0–1 (0 = ít đỏ, 1 = đỏ rõ).",
    },
    darkSpotAreaPercent: {
      type: SchemaType.NUMBER,
      description: "Ước lượng mức độ thâm / sắc tố tương đối trong ảnh, 0–100.",
    },
    nextAdvice: {
      type: SchemaType.STRING,
      description: "Lời khuyên chăm sóc tiếp theo, 2–4 câu tiếng Việt.",
    },
  },
  required: ["acneCount", "rednessScore", "darkSpotAreaPercent", "nextAdvice"],
};

const SKIN_COMPARE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  description: "So sánh hai ảnh da: chỉ số định lượng và lời khuyên.",
  properties: {
    acneCount: {
      type: SchemaType.NUMBER,
      description: "Ước lượng số mụn / tổn thương trên ảnh MỚI (sau).",
    },
    rednessScore: {
      type: SchemaType.NUMBER,
      description: "Mức đỏ da 0–1 trên ảnh MỚI.",
    },
    darkSpotAreaPercent: {
      type: SchemaType.NUMBER,
      description: "Mức thâm / sắc tố tương đối 0–100 trên ảnh MỚI.",
    },
    acneImprovementPercent: {
      type: SchemaType.NUMBER,
      description: "% cải thiện số lượng mụn (dương = ít mụn hơn so ảnh cũ).",
    },
    rednessImprovementPercent: {
      type: SchemaType.NUMBER,
      description: "% cải thiện độ đỏ (dương = ít đỏ hơn).",
    },
    darkSpotImprovementPercent: {
      type: SchemaType.NUMBER,
      description: "% cải thiện diện tích / mức thâm (dương = tốt hơn).",
    },
    compositeImprovementPercent: {
      type: SchemaType.NUMBER,
      description: "Trung bình ba chỉ số trên (một con số tổng hợp).",
    },
    nextAdvice: {
      type: SchemaType.STRING,
      description: "Lời khuyên tiếp theo, tiếng Việt.",
    },
  },
  required: [
    "acneCount",
    "rednessScore",
    "darkSpotAreaPercent",
    "acneImprovementPercent",
    "rednessImprovementPercent",
    "darkSpotImprovementPercent",
    "compositeImprovementPercent",
    "nextAdvice",
  ],
};

const SKIN_VISION_SYSTEM = `Bạn là chuyên gia phân tích da liễu qua hình ảnh (giáo dục). Chỉ quan sát ảnh, không chẩn đoán bệnh hay kê đơn. Trả về đúng JSON schema.`;

function parseSkinPortraitJson(raw: string): SkinDiaryAnalysisJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiAnalysisError("PARSE", "Không đọc được JSON phân tích da.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new GeminiAnalysisError("PARSE", "Dữ liệu phân tích da không hợp lệ.");
  }
  const o = parsed as Record<string, unknown>;
  return {
    acneCount: Number(o.acneCount),
    rednessScore: Number(o.rednessScore),
    darkSpotAreaPercent: Number(o.darkSpotAreaPercent),
    nextAdvice: String(o.nextAdvice ?? ""),
    acneImprovementPercent: null,
    rednessImprovementPercent: null,
    darkSpotImprovementPercent: null,
    compositeImprovementPercent: null,
  };
}

function parseSkinCompareJson(raw: string): SkinDiaryAnalysisJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiAnalysisError("PARSE", "Không đọc được JSON so sánh da.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new GeminiAnalysisError("PARSE", "Dữ liệu so sánh da không hợp lệ.");
  }
  const o = parsed as Record<string, unknown>;
  return {
    acneCount: Number(o.acneCount),
    rednessScore: Number(o.rednessScore),
    darkSpotAreaPercent: Number(o.darkSpotAreaPercent),
    acneImprovementPercent: Number(o.acneImprovementPercent),
    rednessImprovementPercent: Number(o.rednessImprovementPercent),
    darkSpotImprovementPercent: Number(o.darkSpotImprovementPercent),
    compositeImprovementPercent: Number(o.compositeImprovementPercent),
    nextAdvice: String(o.nextAdvice ?? ""),
  };
}

async function runVisionJson(
  parts: Array<string | { inlineData: { data: string; mimeType: string } }>,
  schema: ResponseSchema,
  temperature: number,
): Promise<string> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: SKIN_VISION_SYSTEM,
    generationConfig: {
      temperature,
      topP: 0.9,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (e) {
      lastErr = e;
      const mapped = mapGeminiError(e);
      const retryable =
        mapped.code === "RATE_LIMIT" ||
        mapped.code === "UNAVAILABLE" ||
        mapped.code === "NETWORK" ||
        (e instanceof Error && /429|503|fetch/i.test(e.message));
      if (retryable && attempt < maxAttempts - 1) {
        const delay = Math.min(6000, 500 * 2 ** attempt) + Math.random() * 200;
        await sleep(delay);
        continue;
      }
      throw mapped;
    }
  }
  throw mapGeminiError(lastErr);
}

/**
 * Phân tích một ảnh da (mục nhật ký đầu tiên hoặc không so sánh).
 */
export async function analyzeSkinPortrait(imageUrl: string): Promise<SkinDiaryAnalysisJson> {
  const part = await fetchImageInlinePart(imageUrl);
  const prompt = `Phân tích ảnh selfie vùng da mặt. Ước lượng: số tổn thương giống mụn, mức đỏ da, mức thâm/sắc tố tương đối. Trả về JSON đúng schema.`;
  const raw = await runVisionJson([prompt, part], SKIN_PORTRAIT_SCHEMA, 0.25);
  return parseSkinPortraitJson(raw);
}

/**
 * So sánh hai ảnh (cũ → mới): chỉ số định lượng % cải thiện và lời khuyên.
 */
export async function compareSkinProgress(
  oldImageUrl: string,
  newImageUrl: string,
): Promise<SkinDiaryAnalysisJson> {
  const oldPart = await fetchImageInlinePart(oldImageUrl);
  const newPart = await fetchImageInlinePart(newImageUrl);
  const prompt = `Bạn là chuyên gia phân tích da liễu qua hình ảnh. Hãy so sánh hai bức ảnh này (ảnh đầu = TRƯỚC, ảnh sau = SAU) và chỉ ra sự thay đổi cụ thể về: Số lượng mụn, diện tích vết thâm, và độ đỏ của da. Trả về định dạng JSON gồm các chỉ số định lượng (phần trăm cải thiện: số dương nếu tình trạng tốt hơn ảnh trước) và lời khuyên tiếp theo.

Quy ước: Ảnh thứ nhất bạn nhận là TRƯỚC, ảnh thứ hai là SAU. Ghi nhận các chỉ số tuyệt đối trên ảnh SAU và % cải thiện so TRƯỚC.`;
  const raw = await runVisionJson([prompt, oldPart, newPart], SKIN_COMPARE_SCHEMA, 0.2);
  return parseSkinCompareJson(raw);
}

// --- Phân tích da + gợi ý routine theo ngân sách ---

const ROUTINE_PRODUCT_ITEM_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    productName: {
      type: SchemaType.STRING,
      description: "Tên sản phẩm gợi ý (thị trường VN).",
    },
    brandName: {
      type: SchemaType.STRING,
      description: "Thương hiệu.",
    },
    estimatedPriceVnd: {
      type: SchemaType.NUMBER,
      description: "Giá ước lượng VND (số nguyên, giá lẻ tham khảo).",
    },
    reason: {
      type: SchemaType.STRING,
      description: "1–2 câu tiếng Việt vì sao phù hợp với tình trạng da đã phân tích.",
    },
    routinePhase: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["cleanser", "treatment", "moisturizer", "sunscreen", "other"],
      description: "Vai trò trong routine.",
    },
  },
  required: ["productName", "brandName", "estimatedPriceVnd", "reason", "routinePhase"],
};

const FACE_ROUTINE_VISION_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  description: "Phân tích ảnh mặt cho routine — giáo dục, không chẩn đoán bệnh.",
  properties: {
    skinType: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["OILY", "DRY", "COMBINATION", "SENSITIVE"],
      description: "Loại da ước lượng từ ảnh.",
    },
    acneLevelSummaryVi: {
      type: SchemaType.STRING,
      description: "Mô tả mức độ mụn / tổn thương viêm (1–2 câu tiếng Việt).",
    },
    poreSummaryVi: {
      type: SchemaType.STRING,
      description: "Mô tả lỗ chân lông / kết cấu da (1–2 câu tiếng Việt).",
    },
    acneScore: {
      type: SchemaType.NUMBER,
      description: "Điểm mức độ mụn 0–10 (0 = gần như không, 10 = rất nhiều / viêm rõ).",
    },
    poreVisibilityScore: {
      type: SchemaType.NUMBER,
      description: "Độ rõ / to lỗ chân lông 0–10.",
    },
    hydrationScore: {
      type: SchemaType.NUMBER,
      description: "Ước lượng độ ẩm bề mặt / mượt 0–10 (10 = trông đủ ẩm).",
    },
    disclaimerShortVi: {
      type: SchemaType.STRING,
      description: "Một câu: chỉ quan sát ảnh, không thay thế bác sĩ da liễu.",
    },
  },
  required: [
    "skinType",
    "acneLevelSummaryVi",
    "poreSummaryVi",
    "acneScore",
    "poreVisibilityScore",
    "hydrationScore",
    "disclaimerShortVi",
  ],
};

const BUDGET_ROUTINE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summaryVi: {
      type: SchemaType.STRING,
      description: "Tóm tắt routine + lưu ý layering / SPF (tiếng Việt).",
    },
    totalEstimatedVnd: {
      type: SchemaType.NUMBER,
      description: "Tổng giá ước tính các sản phẩm (VND).",
    },
    products: {
      type: SchemaType.ARRAY,
      items: ROUTINE_PRODUCT_ITEM_SCHEMA,
      description: "4–8 sản phẩm: tẩy trang/srm, điều trị, ẩm, SPF sáng nếu cần.",
    },
  },
  required: ["summaryVi", "totalEstimatedVnd", "products"],
};

function tierPackageSchema(): ResponseSchema {
  return {
    type: SchemaType.OBJECT,
    properties: {
      taglineVi: {
        type: SchemaType.STRING,
        description: "Một dòng giới thiệu gói (tiếng Việt).",
      },
      totalEstimatedVnd: {
        type: SchemaType.NUMBER,
        description: "Tổng giá ước tính gói (VND).",
      },
      products: {
        type: SchemaType.ARRAY,
        items: ROUTINE_PRODUCT_ITEM_SCHEMA,
        description: "Danh sách sản phẩm gợi ý trong gói.",
      },
    },
    required: ["taglineVi", "totalEstimatedVnd", "products"],
  };
}

const THREE_TIER_ROUTINE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    tietKiem: tierPackageSchema(),
    hieuQua: tierPackageSchema(),
    caoCap: tierPackageSchema(),
  },
  required: ["tietKiem", "hieuQua", "caoCap"],
};

const FACE_ROUTINE_VISION_PROMPT = `Bạn là chuyên gia chăm sóc da (mỹ phẩm, giáo dục). Chỉ quan sát ảnh khuôn mặt / vùng da, không chẩn đoán bệnh hay kê đơn thuốc.
Nhiệm vụ:
- Ước lượng loại da (OILY/DRY/COMBINATION/SENSITIVE).
- Mô tả mức độ mụn / tổn thương viêm và lỗ chân lông bằng tiếng Việt ngắn gọn.
- Cho 3 điểm số 0–10: acneScore (mụn), poreVisibilityScore (lỗ chân lông), hydrationScore (độ ẩm / mượt bề mặt).
Trả về JSON đúng schema.`;

const ROUTINE_BUDGET_SYSTEM = `Bạn là chuyên gia routine skincare tại Việt Nam (drugstore + high street). Gợi ý sản phẩm có bán phổ biến, giá ước lượng VND thực tế.
Quy tắc:
- Tránh xung đột mạnh: không gộp Retinol và BHA/AHA cùng một buổi tối trong cùng routine gợi ý; nếu có, giải thích trong summaryVi.
- Ưu tiên hoạt chất phù hợp loại da và mức mụn đã cho (ví dụ: Niacinamide, BHA nhẹ, ceramide, SPF).
- Mỗi sản phẩm phải có lý do chọn rõ ràng (reason).`;

function clamp10(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n)));
}

const SKIN_TYPES = new Set<SkinTypeFromVision>(["OILY", "DRY", "COMBINATION", "SENSITIVE"]);

function parseFaceRoutineVisionJson(raw: string): FaceRoutineAnalysis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiAnalysisError("PARSE", "Không đọc được JSON phân tích da.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new GeminiAnalysisError("PARSE", "Dữ liệu phân tích da không hợp lệ.");
  }
  const o = parsed as Record<string, unknown>;
  let skinType = String(o.skinType ?? "COMBINATION").toUpperCase() as SkinTypeFromVision;
  if (!SKIN_TYPES.has(skinType)) skinType = "COMBINATION";
  return {
    skinType,
    acneLevelSummaryVi: String(o.acneLevelSummaryVi ?? "").trim() || "Không mô tả.",
    poreSummaryVi: String(o.poreSummaryVi ?? "").trim() || "Không mô tả.",
    acneScore: clamp10(Number(o.acneScore)),
    poreVisibilityScore: clamp10(Number(o.poreVisibilityScore)),
    hydrationScore: clamp10(Number(o.hydrationScore)),
    disclaimerShortVi: String(o.disclaimerShortVi ?? "").trim() || "Kết quả chỉ mang tính tham khảo.",
  };
}

function normRoutinePhase(s: string): RoutineProductPhase {
  const x = String(s).toLowerCase();
  const ok = new Set<RoutineProductPhase>([
    "cleanser",
    "treatment",
    "moisturizer",
    "sunscreen",
    "other",
  ]);
  if (ok.has(x as RoutineProductPhase)) return x as RoutineProductPhase;
  return "other";
}

function parseProductRow(r: Record<string, unknown>): RoutineProductSuggestion {
  return {
    productName: String(r.productName ?? "").trim() || "Sản phẩm",
    brandName: String(r.brandName ?? "").trim() || "—",
    estimatedPriceVnd: Math.max(0, Math.round(Number(r.estimatedPriceVnd) || 0)),
    reason: String(r.reason ?? "").trim() || "—",
    routinePhase: normRoutinePhase(String(r.routinePhase ?? "other")),
  };
}

function parseBudgetRoutineJson(raw: string): BudgetRoutinePackage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiAnalysisError("PARSE", "Không đọc được JSON gói routine.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new GeminiAnalysisError("PARSE", "Dữ liệu gói routine không hợp lệ.");
  }
  const o = parsed as Record<string, unknown>;
  const productsRaw = Array.isArray(o.products) ? o.products : [];
  const products = productsRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => parseProductRow(x));
  return {
    summaryVi: String(o.summaryVi ?? "").trim() || "",
    totalEstimatedVnd: Math.max(0, Math.round(Number(o.totalEstimatedVnd) || 0)),
    products,
  };
}

function parseTier(o: unknown): TierRoutinePackage {
  if (!o || typeof o !== "object") {
    return { taglineVi: "", totalEstimatedVnd: 0, products: [] };
  }
  const t = o as Record<string, unknown>;
  const productsRaw = Array.isArray(t.products) ? t.products : [];
  const products = productsRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => parseProductRow(x));
  return {
    taglineVi: String(t.taglineVi ?? "").trim() || "",
    totalEstimatedVnd: Math.max(0, Math.round(Number(t.totalEstimatedVnd) || 0)),
    products,
  };
}

function parseThreeTierRoutineJson(raw: string): ThreeTierRoutineResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiAnalysisError("PARSE", "Không đọc được JSON 3 gói routine.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new GeminiAnalysisError("PARSE", "Dữ liệu 3 gói không hợp lệ.");
  }
  const o = parsed as Record<string, unknown>;
  return {
    tietKiem: parseTier(o.tietKiem),
    hieuQua: parseTier(o.hieuQua),
    caoCap: parseTier(o.caoCap),
  };
}

async function runTextJsonGemini(
  systemInstruction: string,
  userContent: string,
  schema: ResponseSchema,
  temperature: number,
  maxOutputTokens: number,
): Promise<string> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction,
    generationConfig: {
      temperature,
      topP: 0.9,
      maxOutputTokens,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(userContent);
      return result.response.text();
    } catch (e) {
      lastErr = e;
      const mapped = mapGeminiError(e);
      const retryable =
        mapped.code === "RATE_LIMIT" ||
        mapped.code === "UNAVAILABLE" ||
        mapped.code === "NETWORK" ||
        (e instanceof Error && /429|503|fetch/i.test(e.message));
      if (retryable && attempt < maxAttempts - 1) {
        const delay = Math.min(6000, 500 * 2 ** attempt) + Math.random() * 200;
        await sleep(delay);
        continue;
      }
      throw mapped;
    }
  }
  throw mapGeminiError(lastErr);
}

/**
 * Bước Vision: loại da, mụn, lỗ chân lông + điểm 0–10 (ẩm / mụn / lỗ chân lông).
 */
export async function analyzeFaceForRoutineBudget(imageUrl: string): Promise<FaceRoutineAnalysis> {
  const part = await fetchImageInlinePart(imageUrl);
  const raw = await runVisionJson(
    [FACE_ROUTINE_VISION_PROMPT, part],
    FACE_ROUTINE_VISION_SCHEMA,
    0.25,
  );
  return parseFaceRoutineVisionJson(raw);
}

/**
 * Gợi ý routine khớp ngân sách (VND).
 */
export async function generateRoutineForBudget(
  face: FaceRoutineAnalysis,
  budgetVnd: number,
): Promise<BudgetRoutinePackage> {
  const ctx = JSON.stringify(face, null, 0);
  const user = `Dữ liệu phân tích da (JSON):\n${ctx}\n\nNgân sách người dùng: ${budgetVnd} VND (số nguyên).
Hãy đề xuất một routine tối thiểu 4 sản phẩm (tối đa 8), tổng estimatedPriceVnd các món nên nằm trong khoảng ±15% ngân sách (ưu tiên gần ngân sách nhất có thể).
Mỗi sản phẩm: tên, hãng, giá VND ước lượng, lý do chọn, routinePhase.
Trả về JSON đúng schema.`;
  const raw = await runTextJsonGemini(ROUTINE_BUDGET_SYSTEM, user, BUDGET_ROUTINE_SCHEMA, 0.35, 8192);
  return parseBudgetRoutineJson(raw);
}

/**
 * Ba gói: Tiết kiệm — Hiệu quả — Cao cấp (mức giá khác nhau).
 */
export async function generateRoutineThreeTiers(face: FaceRoutineAnalysis): Promise<ThreeTierRoutineResult> {
  const ctx = JSON.stringify(face, null, 0);
  const user = `Dữ liệu phân tích da (JSON):\n${ctx}

Tạo đúng 3 gói sản phẩm (mỗi gói 4–7 món), tiếng Việt:
- tietKiem: tổng giá ước tính khoảng 400.000–1.200.000 VND (drugstore, tối giản).
- hieuQua: tổng khoảng 1.200.000–2.800.000 VND (cân bằng hiệu quả / giá).
- caoCap: tổng khoảng 3.000.000–8.000.000 VND (dòng cao cấp hơn, có thể serum đặc thù).

Mỗi gói có taglineVi ngắn, totalEstimatedVnd, products đầy đủ.
Trả về JSON đúng schema (tietKiem, hieuQua, caoCap).`;
  const raw = await runTextJsonGemini(
    ROUTINE_BUDGET_SYSTEM,
    user,
    THREE_TIER_ROUTINE_SCHEMA,
    0.38,
    8192,
  );
  return parseThreeTierRoutineJson(raw);
}
