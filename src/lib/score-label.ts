/** Nhãn đáp ứng PDF dashboard “Khá tốt” / v.v. */
export function getScoreLabelVi(score: number): string {
  if (score >= 90) return "Xuất sắc";
  if (score >= 75) return "Khá tốt";
  if (score >= 60) return "Ổn định";
  if (score >= 40) return "Cần cải thiện";
  return "Nên xem lại";
}

export function acneRiskToPercent(level: "low" | "moderate" | "high"): number {
  switch (level) {
    case "low":
      return 92;
    case "moderate":
      return 68;
    case "high":
      return 42;
    default:
      return 70;
  }
}
