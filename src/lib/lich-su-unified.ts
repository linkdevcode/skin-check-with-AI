import type { FaceRoutineAnalysis, SavedRoutineGenResult } from "@/types/face-routine-budget";
import type { SkinDiaryAnalysisJson } from "@/types/skin-diary";

export type LichSuLoai = "tat-ca" | "routine" | "da-ngan-sach" | "nhat-ky-da";

export function parseLichSuLoai(raw: string | string[] | undefined): LichSuLoai {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "routine") return "routine";
  if (v === "da-ngan-sach" || v === "face") return "da-ngan-sach";
  if (v === "nhat-ky-da" || v === "nhat-ky") return "nhat-ky-da";
  return "tat-ca";
}

export type UnifiedHistoryItem = {
  kind: "routine" | "da-ngan-sach" | "nhat-ky-da";
  id: string;
  createdAt: Date;
  title: string;
  subtitle: string;
  href: string;
  /** Hiển thị bên phải (điểm, %, giá…) */
  badge: string | null;
};

const SKIN_VI: Record<FaceRoutineAnalysis["skinType"], string> = {
  OILY: "Da dầu",
  DRY: "Da khô",
  COMBINATION: "Da hỗn hợp",
  SENSITIVE: "Da nhạy cảm",
};

function routineBadgeFromResult(raw: unknown): string | null {
  const r = raw as SavedRoutineGenResult;
  if (!r || typeof r !== "object") return null;
  if (r.kind === "BUDGET") return `~${r.package.totalEstimatedVnd.toLocaleString("vi-VN")}đ`;
  if (r.kind === "AUTO") {
    const t = r.tiers.hieuQua?.totalEstimatedVnd;
    return typeof t === "number" ? `~${t.toLocaleString("vi-VN")}đ` : "3 gói";
  }
  return null;
}

export function mapAnalysisHistoryRow(row: {
  id: string;
  createdAt: Date;
  overallScore: number;
  routine: { routineName: string };
}): UnifiedHistoryItem {
  return {
    kind: "routine",
    id: row.id,
    createdAt: row.createdAt,
    title: row.routine.routineName,
    subtitle: "Phân tích routine skincare",
    href: `/lich-su/${row.id}`,
    badge: String(row.overallScore),
  };
}

export function mapRecommendedRoutineRow(row: {
  id: string;
  createdAt: Date;
  mode: string;
  budgetVnd: number | null;
  faceAnalysis: unknown;
  routineResult: unknown;
}): UnifiedHistoryItem {
  const face = row.faceAnalysis as FaceRoutineAnalysis;
  const skin = face?.skinType ? SKIN_VI[face.skinType] ?? face.skinType : "Phân tích da";
  const modeLabel = row.mode === "BUDGET" ? "Theo ngân sách" : "3 gói";
  const budgetPart =
    row.mode === "BUDGET" && row.budgetVnd != null
      ? ` · ${row.budgetVnd.toLocaleString("vi-VN")}đ`
      : "";
  return {
    kind: "da-ngan-sach",
    id: row.id,
    createdAt: row.createdAt,
    title: `${modeLabel}${budgetPart}`,
    subtitle: `Da & ngân sách · ${skin}`,
    href: `/routine-ngan-sach/${row.id}`,
    badge: routineBadgeFromResult(row.routineResult),
  };
}

export function mapSkinEntryRow(row: {
  id: string;
  createdAt: Date;
  userNote: string | null;
  analysisResult: unknown;
}): UnifiedHistoryItem {
  const ar = row.analysisResult as SkinDiaryAnalysisJson;
  const badge =
    ar.compositeImprovementPercent != null
      ? `${ar.compositeImprovementPercent}%`
      : ar.acneCount != null
        ? `${ar.acneCount} mụn`
        : null;
  const note = row.userNote?.trim();
  return {
    kind: "nhat-ky-da",
    id: row.id,
    createdAt: row.createdAt,
    title: note ? (note.length > 42 ? `${note.slice(0, 42)}…` : note) : "Ảnh nhật ký da",
    subtitle: "Nhật ký theo dõi da",
    href: `/nhat-ky-da/${row.id}`,
    badge,
  };
}
