import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";
import type { SkinTypeInput } from "@/types/routine-analysis";

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
