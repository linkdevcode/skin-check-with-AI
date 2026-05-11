import type { SkinTypeInput } from "@/types/routine-analysis";
import {
  GeminiAnalysisError,
  type RoutineAnalysisJson,
  type RoutineProductsExtract,
  ROUTINE_ALYSIS_JSON_SHAPE_NOTE,
  ROUTINE_ANALYSIS_SYSTEM_INSTRUCTION,
  ROUTINE_SKIN_LABEL_VI,
  ROUTINE_SKIN_TYPE_SET,
  EXTRACT_ROUTINE_PRODUCTS_INSTRUCTION,
  geminiAnalyzeRoutineOnce,
  geminiExtractRoutineProductsOnce,
  parseRoutineAnalysisJson,
  parseRoutineProductsExtractJson,
} from "@/lib/gemini";
import { withTransientAiRetries } from "@/lib/ai-retry";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function stripJsonFence(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z0-9]*\s*\n?/, "").replace(/\n?```\s*$/u, "");
  }
  return t.trim();
}

function getGroqApiKey(): string | null {
  const k = process.env.GROQ_API_KEY?.trim();
  return k || null;
}

async function groqChatCompletionJson(options: {
  system: string;
  user: string;
  temperature: number;
  maxCompletionTokens: number;
}): Promise<string> {
  const key = getGroqApiKey();
  if (!key) throw new Error("GROQ_SKIP");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
      temperature: options.temperature,
      max_tokens: options.maxCompletionTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new Error("Groq: empty content");
  return stripJsonFence(content);
}

function assertRoutineTextInput(routineText: string, skinType: SkinTypeInput): string {
  const trimmed = routineText.trim();
  if (!trimmed) {
    throw new GeminiAnalysisError("INPUT", "Routine không được để trống.");
  }
  if (!ROUTINE_SKIN_TYPE_SET.has(skinType)) {
    throw new GeminiAnalysisError("INPUT", "Loại da không hợp lệ.");
  }
  if (trimmed.length > 16_000) {
    throw new GeminiAnalysisError("INPUT", "Routine quá dài (tối đa 16.000 ký tự).");
  }
  return trimmed;
}

function assertExtractInput(morningText: string, eveningText: string): void {
  const am = morningText.trim();
  const pm = eveningText.trim();
  if (!am && !pm) {
    throw new GeminiAnalysisError("INPUT", "Nhập ít nhất nội dung buổi sáng hoặc buổi tối.");
  }
  if (am.length + pm.length > 16_000) {
    throw new GeminiAnalysisError("INPUT", "Nội dung quá dài (tối đa ~16.000 ký tự).");
  }
}

/**
 * Phân tích routine (văn bản): Groq llama-3.3-70b-versatile trước; lỗi / quá tải → Gemini 2.5 Flash.
 * Retry 429: 2s, 4s, 8s (withTransientAiRetries) trên từng lần gọi provider.
 */
export async function analyzeTextAction(
  routineText: string,
  skinType: SkinTypeInput,
): Promise<RoutineAnalysisJson> {
  const trimmed = assertRoutineTextInput(routineText, skinType);
  const skinLabel = ROUTINE_SKIN_LABEL_VI[skinType];

  const user = `Người dùng chọn loại da: **${skinLabel}** (mã: ${skinType}).

Phân tích routine sau và trả về JSON đúng schema (một object duy nhất, không bọc markdown):

---
${trimmed}
---`;

  const system = `${ROUTINE_ANALYSIS_SYSTEM_INSTRUCTION}

${ROUTINE_ALYSIS_JSON_SHAPE_NOTE}`;

  if (getGroqApiKey()) {
    try {
      const raw = await withTransientAiRetries(() =>
        groqChatCompletionJson({
          system,
          user,
          temperature: 0.35,
          maxCompletionTokens: 4096,
        }),
      );
      return parseRoutineAnalysisJson(raw);
    } catch {
      /* fallback Gemini */
    }
  }

  return withTransientAiRetries(() => geminiAnalyzeRoutineOnce(routineText, skinType));
}

/**
 * Tách sản phẩm routine (văn bản): Groq trước, fallback Gemini.
 */
export async function extractRoutineTextAction(
  morningText: string,
  eveningText: string,
): Promise<RoutineProductsExtract> {
  assertExtractInput(morningText, eveningText);
  const am = morningText.trim();
  const pm = eveningText.trim();
  const userBlock = `### Buổi sáng (AM)\n${am || "(trống)"}\n\n### Buổi tối (PM)\n${pm || "(trống)"}\n\nTrả về JSON với morning và evening là mảng chuỗi.`;

  const system = `${EXTRACT_ROUTINE_PRODUCTS_INSTRUCTION}

Trả về đúng một object JSON: {"morning": string[], "evening": string[]} — không markdown, không giải thích ngoài JSON.`;

  if (getGroqApiKey()) {
    try {
      const raw = await withTransientAiRetries(() =>
        groqChatCompletionJson({
          system,
          user: userBlock,
          temperature: 0.2,
          maxCompletionTokens: 2048,
        }),
      );
      return parseRoutineProductsExtractJson(raw);
    } catch {
      /* fallback */
    }
  }

  return withTransientAiRetries(() => geminiExtractRoutineProductsOnce(morningText, eveningText));
}
