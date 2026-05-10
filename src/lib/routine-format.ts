/**
 * Gộp danh sách đã chỉnh sửa thành một văn bản routine cho bước phân tích AI.
 */
export function formatRoutineForAnalysis(morning: string[], evening: string[]): string {
  const am = morning.map((s) => s.trim()).filter(Boolean);
  const pm = evening.map((s) => s.trim()).filter(Boolean);

  const lines: string[] = [];

  lines.push("## Buổi sáng (AM)");
  if (am.length) {
    am.forEach((x) => lines.push(`- ${x}`));
  } else {
    lines.push("- (Không có bước được ghi nhận)");
  }

  lines.push("");
  lines.push("## Buổi tối (PM)");
  if (pm.length) {
    pm.forEach((x) => lines.push(`- ${x}`));
  } else {
    lines.push("- (Không có bước được ghi nhận)");
  }

  return lines.join("\n");
}
