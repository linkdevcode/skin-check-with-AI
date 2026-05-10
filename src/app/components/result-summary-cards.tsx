"use client";

import type { ConflictItem } from "@/types/routine-analysis";
import { acneRiskToPercent, getScoreLabelVi } from "@/lib/score-label";
import type { AcneSafety } from "@/types/routine-analysis";
import { cn } from "@/lib/utils";

type Props = {
  score: number;
  conflicts: ConflictItem[];
  acneSafety: AcneSafety;
};

export function ResultSummaryCards({ score, conflicts, acneSafety }: Props) {
  const label = getScoreLabelVi(score);
  const highWarnings = conflicts.filter((c) => c.level === "high").length;
  const acnePct = acneRiskToPercent(acneSafety.riskLevel);

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Routine của bạn đạt mức:{" "}
        <strong className="font-semibold text-teal-600 dark:text-teal-400">{label}</strong>
      </p>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div
          className={cn(
            "rounded-xl border p-3 shadow-sm",
            "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#1a1f26]",
          )}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
            Xung đột
          </p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-white">
              Hoạt chất
            </span>
            {highWarnings > 0 ? (
              <span className="shrink-0 rounded-md bg-red-950 px-2 py-0.5 text-[10px] font-bold uppercase text-red-400 ring-1 ring-red-900/50">
                {highWarnings} cảnh báo
              </span>
            ) : (
              <span className="shrink-0 rounded-md bg-teal-950/80 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-300 ring-1 ring-teal-900/40">
                Ổn định
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "rounded-xl border p-3 shadow-sm",
            "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#1a1f26]",
          )}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
            Da mụn
          </p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-white">
              Phù hợp
            </span>
            <span className="shrink-0 rounded-md bg-teal-950/90 px-2 py-0.5 text-[11px] font-bold tabular-nums text-teal-300 ring-1 ring-teal-800/60">
              {acnePct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
