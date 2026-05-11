/** Loại da từ Vision (khớp enum Prisma SkinType). */
export type SkinTypeFromVision = "OILY" | "DRY" | "COMBINATION" | "SENSITIVE";

/** Bước 2–3: kết quả phân tích ảnh + điểm dashboard. */
export type FaceRoutineAnalysis = {
  skinType: SkinTypeFromVision;
  acneLevelSummaryVi: string;
  poreSummaryVi: string;
  /** 0–10 */
  acneScore: number;
  /** 0–10 */
  poreVisibilityScore: number;
  /** 0–10 */
  hydrationScore: number;
  disclaimerShortVi: string;
};

export type RoutineProductPhase = "cleanser" | "treatment" | "moisturizer" | "sunscreen" | "other";

export type RoutineProductSuggestion = {
  productName: string;
  brandName: string;
  estimatedPriceVnd: number;
  reason: string;
  routinePhase: RoutineProductPhase;
};

export type BudgetRoutinePackage = {
  summaryVi: string;
  totalEstimatedVnd: number;
  products: RoutineProductSuggestion[];
};

export type TierRoutinePackage = {
  taglineVi: string;
  totalEstimatedVnd: number;
  products: RoutineProductSuggestion[];
};

export type ThreeTierRoutineResult = {
  tietKiem: TierRoutinePackage;
  hieuQua: TierRoutinePackage;
  caoCap: TierRoutinePackage;
};

export type SavedRoutineGenResult =
  | { kind: "BUDGET"; package: BudgetRoutinePackage }
  | { kind: "AUTO"; tiers: ThreeTierRoutineResult };

export type RecommendedRoutineListItem = {
  id: string;
  mode: "BUDGET" | "AUTO";
  budgetVnd: number | null;
  createdAt: string;
  previewSkinType: SkinTypeFromVision;
  previewTotalVnd: number | null;
};
