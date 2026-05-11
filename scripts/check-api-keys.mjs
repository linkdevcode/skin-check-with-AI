/**
 * Kiểm tra nhanh GEMINI + GROQ (không in key ra stdout).
 * Chạy: node scripts/check-api-keys.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDotEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function mergeEnv() {
  const fromFile = loadDotEnv(path.join(root, ".env"));
  const fromLocal = loadDotEnv(path.join(root, ".env.local"));
  return { ...fromFile, ...fromLocal, ...process.env };
}

function mask(s) {
  if (!s) return "(trống)";
  return `(đã set, ${s.length} ký tự — không hiển thị giá trị)`;
}

async function checkGroq(key) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4,
      messages: [{ role: "user", content: "Reply only: OK" }],
    }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, snippet: text.slice(0, 120) };
}

async function checkGemini(key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Reply only one word: "OK"' }] }],
      generationConfig: { maxOutputTokens: 8, temperature: 0 },
    }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, snippet: text.slice(0, 120) };
}

const env = mergeEnv();
const geminiKey =
  env.GEMINI_API_KEY?.trim() ||
  env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
  env.GOOGLE_API_KEY?.trim() ||
  "";
const groqKey = env.GROQ_API_KEY?.trim() || "";

console.log("=== SkinCheck API key smoke test ===\n");

console.log("GEMINI_API_KEY (hoặc GOOGLE_*):", geminiKey ? mask(geminiKey) : "MISSING — thêm vào .env hoặc Vercel");
if (geminiKey) {
  try {
    const r = await checkGemini(geminiKey);
    if (r.ok) console.log("  → Gemini REST:", "OK", `(HTTP ${r.status})`);
    else console.log("  → Gemini REST:", "FAIL", `(HTTP ${r.status})`, r.snippet.replace(/\n/g, " "));
  } catch (e) {
    console.log("  → Gemini:", "ERROR", e instanceof Error ? e.message : String(e));
  }
} else {
  console.log("  → Bỏ qua gọi API (thiếu key).");
}

console.log("\nGROQ_API_KEY:", groqKey ? mask(groqKey) : "MISSING — tùy chọn; không có thì chỉ dùng Gemini cho văn bản");
if (groqKey) {
  try {
    const r = await checkGroq(groqKey);
    if (r.ok) console.log("  → Groq chat:", "OK", `(HTTP ${r.status})`);
    else console.log("  → Groq chat:", "FAIL", `(HTTP ${r.status})`, r.snippet.replace(/\n/g, " "));
  } catch (e) {
    console.log("  → Groq:", "ERROR", e instanceof Error ? e.message : String(e));
  }
} else {
  console.log("  → Bỏ qua gọi API (thiếu key).");
}

const deployHints = [
  "\n=== Deploy (Vercel) ===",
  "Biến môi trường nên có trên Production:",
  "  - GEMINI_API_KEY (bắt buộc cho Vision + fallback văn bản)",
  "  - GROQ_API_KEY (khuyến nghị — giảm 429 Gemini cho routine)",
  "  - DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL, BLOB_READ_WRITE_TOKEN (theo tính năng)",
];
console.log(deployHints.join("\n"));

const geminiOk = Boolean(geminiKey);
const exitBad = !geminiOk;
if (exitBad) {
  console.error("\nThiếu GEMINI — build có thể chạy nhưng phân tích AI sẽ lỗi trên server.");
  process.exit(1);
}
process.exit(0);
