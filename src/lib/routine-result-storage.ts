import type { AcneSafety, ConflictItem } from "@/types/routine-analysis";

export const ROUTINE_RESULT_STORAGE_KEY = "skincheck-routine-result-v1";

export type StoredRoutinePayload = {
  score: number;
  conflicts: ConflictItem[];
  markdown: string;
  acneSafety: AcneSafety;
  persistMessage: string | null;
  guestNoSaveHint: boolean;
};

export function saveRoutineResult(payload: StoredRoutinePayload): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ROUTINE_RESULT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function loadRoutineResult(): StoredRoutinePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ROUTINE_RESULT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredRoutinePayload;
  } catch {
    return null;
  }
}
