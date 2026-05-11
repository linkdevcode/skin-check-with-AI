import type { SkinDiaryAnalysisJson } from "@/types/skin-diary";

/** Ngày đầu tuần (thứ 2) theo giờ local — dùng làm khóa nhóm biểu đồ */
export function mondayWeekKey(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return x.toISOString().slice(0, 10);
}

export function formatWeekLabelVn(mondayIso: string): string {
  const [y, m, day] = mondayIso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export type WeekChartPoint = { weekKey: string; weekLabel: string; value: number };

/**
 * Trung bình `compositeImprovementPercent` theo tuần (chỉ mục đã so sánh với ảnh trước).
 */
export function aggregateWeeklyImprovement(
  entries: { createdAt: Date; analysisResult: unknown }[],
): WeekChartPoint[] {
  const map = new Map<string, { sum: number; n: number }>();
  for (const e of entries) {
    const ar = e.analysisResult as SkinDiaryAnalysisJson;
    const v = ar.compositeImprovementPercent;
    if (v == null || Number.isNaN(Number(v))) continue;
    const key = mondayWeekKey(e.createdAt);
    const cur = map.get(key) ?? { sum: 0, n: 0 };
    cur.sum += Number(v);
    cur.n += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([weekKey, { sum, n }]) => ({
      weekKey,
      weekLabel: `Tuần ${formatWeekLabelVn(weekKey)}`,
      value: Math.round((sum / n) * 10) / 10,
    }))
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey));
}
