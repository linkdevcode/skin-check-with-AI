export type ConflictLevel = "high" | "medium" | "low";

export type ConflictItem = {
  pair: string;
  level: ConflictLevel;
  hint?: string;
};

/** Khớp Prisma `SkinType` — Phase 4 chọn 3 loại chính + nhạy cảm tùy chọn */
export type SkinTypeInput = "OILY" | "DRY" | "COMBINATION" | "SENSITIVE";

export type AcneRiskLevel = "low" | "moderate" | "high";

/** Đánh giá “Safe for acne” / bít tắc lỗ chân lông */
export type AcneSafety = {
  summary: string;
  riskLevel: AcneRiskLevel;
  /** Thành phần / nhóm thường gây bít tắc hoặc cần lưu ý với da mụn */
  poreCloggingConcerns: string[];
};
