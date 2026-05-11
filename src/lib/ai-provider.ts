import type { SkinTypeInput } from "@/types/routine-analysis";
import {
  GeminiAnalysisError,
  geminiAnalyzeRoutineOnce,
  geminiExtractRoutineProductsOnce,
  type RoutineAnalysisJson,
  type RoutineProductsExtract,
  ROUTINE_ALYSIS_JSON_SHAPE_NOTE,
  ROUTINE_ANALYSIS_SYSTEM_INSTRUCTION,
  ROUTINE_SKIN_LABEL_VI,
  ROUTINE_SKIN_TYPE_SET,
  EXTRACT_ROUTINE_PRODUCTS_INSTRUCTION,
  parseRoutineAnalysisJson,
  parseRoutineProductsExtractJson,
} from "@/lib/gemini";
import { withTransientAiRetries } from "@/lib/ai-retry";
import { AI_GATE_RATE_LIMIT_PAYLOAD, type AiGatewayErrorPayload } from "@/lib/ai/messages";
import { AI_GROQ_TEXT_BUSY_ERROR, type AiStructuredActionError } from "@/lib/ai/structured-errors";

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

class GroqAiPayloadError extends Error {
  constructor(readonly payload: AiGatewayErrorPayload) {
    super(payload.error);
    this.name = "GroqAiPayloadError";
  }
}

async function groqChatCompletionJsonOrThrow(options: {
  system: string;
  user: string;
  temperature: number;
  maxCompletionTokens: number;
}): Promise<string> {
  const key = getGroqApiKey();
  if (!key) {
    throw new GroqAiPayloadError({ error: "GROQ_API_KEY is not configured." });
  }

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

  const text = await res.text();
  if (res.status === 429) {
    throw new GroqAiPayloadError({ error: AI_GATE_RATE_LIMIT_PAYLOAD });
  }
  if (!res.ok) {
    throw new GroqAiPayloadError({ error: `Groq HTTP ${res.status}: ${text.slice(0, 400)}` });
  }

  let data: { choices?: Array<{ message?: { content?: string | null } }> };
  try {
    data = JSON.parse(text) as { choices?: Array<{ message?: { content?: string | null } }> };
  } catch {
    throw new GroqAiPayloadError({ error: "Groq: invalid JSON body" });
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new GroqAiPayloadError({ error: "Groq: empty content" });
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

export type AnalyzeTextActionResult = RoutineAnalysisJson | AiGatewayErrorPayload | AiStructuredActionError;

/**
 * Phân tích routine (văn bản): Groq llama-3.3-70b, fallback Gemini khi Groq lỗi.
 */
export async function analyzeTextAction(
  routineText: string,
  skinType: SkinTypeInput,
): Promise<AnalyzeTextActionResult> {
  const trimmed = assertRoutineTextInput(routineText, skinType);
  const skinLabel = ROUTINE_SKIN_LABEL_VI[skinType];

  const user = `Người dùng chọn loại da: **${skinLabel}** (mã: ${skinType}).

Phân tích routine sau và trả về JSON đúng schema (một object duy nhất, không bọc markdown):

---
${trimmed}
---`;

  const system = `${ROUTINE_ANALYSIS_SYSTEM_INSTRUCTION}

${ROUTINE_ALYSIS_JSON_SHAPE_NOTE}`;

  let raw: string;
  try {
    raw = await withTransientAiRetries(() =>
      groqChatCompletionJsonOrThrow({
        system,
        user,
        temperature: 0.35,
        maxCompletionTokens: 4096,
      }),
    );
  } catch (e) {
    if (e instanceof GroqAiPayloadError) {
      try {
        return await withTransientAiRetries(() => geminiAnalyzeRoutineOnce(routineText, skinType));
      } catch {
        return AI_GROQ_TEXT_BUSY_ERROR;
      }
    }
    if (e instanceof GeminiAnalysisError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Phân tích văn bản thất bại." };
  }

  try {
    return parseRoutineAnalysisJson(raw);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "PARSE_ERROR" };
  }
}

export type ExtractRoutineTextActionResult = RoutineProductsExtract | AiGatewayErrorPayload | AiStructuredActionError;

/**
 * Tách sản phẩm routine (văn bản): Groq, fallback Gemini khi Groq lỗi.
 */
export async function extractRoutineTextAction(
  morningText: string,
  eveningText: string,
): Promise<ExtractRoutineTextActionResult> {
  assertExtractInput(morningText, eveningText);
  const am = morningText.trim();
  const pm = eveningText.trim();
  const userBlock = `### Buổi sáng (AM)\n${am || "(trống)"}\n\n### Buổi tối (PM)\n${pm || "(trống)"}\n\nTrả về JSON với morning và evening là mảng chuỗi.`;

  const system = `${EXTRACT_ROUTINE_PRODUCTS_INSTRUCTION}

Trả về đúng một object JSON: {"morning": string[], "evening": string[]} — không markdown, không giải thích ngoài JSON.`;

  let raw: string;
  try {
    raw = await withTransientAiRetries(() =>
      groqChatCompletionJsonOrThrow({
        system,
        user: userBlock,
        temperature: 0.2,
        maxCompletionTokens: 2048,
      }),
    );
  } catch (e) {
    if (e instanceof GroqAiPayloadError) {
      try {
        return await withTransientAiRetries(() => geminiExtractRoutineProductsOnce(morningText, eveningText));
      } catch {
        return AI_GROQ_TEXT_BUSY_ERROR;
      }
    }
    if (e instanceof GeminiAnalysisError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Tách routine thất bại." };
  }

  try {
    return parseRoutineProductsExtractJson(raw);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "PARSE_ERROR" };
  }
}
