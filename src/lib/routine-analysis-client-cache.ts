import type { AcneSafety, ConflictItem } from "@/types/routine-analysis";

export const ROUTINE_ANALYSIS_LOCAL_CACHE_KEY = "skincheck_routine_analysis_cache_v1";

export type CachedRoutineAnalysis = {
  v: 1;
  hash: string;
  score: number;
  conflicts: ConflictItem[];
  recommendations: string;
  acneSafety: AcneSafety;
};

export function hashRoutineAnalyzeInputs(routineText: string, skinType: string): string {
  let h = 5381;
  const s = `${skinType}\n${routineText}`;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h, 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function readRoutineAnalysisLocalCache(hash: string): CachedRoutineAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ROUTINE_ANALYSIS_LOCAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRoutineAnalysis;
    if (parsed?.v !== 1 || parsed.hash !== hash) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeRoutineAnalysisLocalCache(entry: CachedRoutineAnalysis): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROUTINE_ANALYSIS_LOCAL_CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota / private mode */
  }
}
