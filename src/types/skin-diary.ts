/**
 * Lưu trong `SkinEntry.analysisResult` (Json).
 * Giá trị ước lượng từ ảnh — mang tính giáo dục, không thay chẩn đoán lâm sàng.
 */
export type SkinDiaryAnalysisJson = {
  acneCount?: number;
  rednessScore?: number;
  /** Diện tích / mức độ thâm tương đối 0–100 (ước lượng từ ảnh) */
  darkSpotAreaPercent?: number;
  /** % cải thiện so ảnh trước (dương = tốt hơn) — chỉ khi đã so sánh */
  acneImprovementPercent?: number | null;
  rednessImprovementPercent?: number | null;
  darkSpotImprovementPercent?: number | null;
  /** Trung bình các chỉ số cải thiện — dùng cho biểu đồ tuần */
  compositeImprovementPercent?: number | null;
  nextAdvice: string;
  /** Ghi chú so sánh song song ảnh (tiếng Việt) */
  comparisonNarrativeVi?: string;
  comparedWithEntryId?: string;
};

export type SkinEntryListItem = {
  id: string;
  imageUrl: string;
  userNote: string | null;
  createdAt: string;
  analysisResult: SkinDiaryAnalysisJson;
};
