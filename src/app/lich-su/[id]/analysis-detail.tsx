"use client";

import type { AnalysisHistory } from "@prisma/client";
import Link from "next/link";
import { ScoreCircle } from "@/app/components/score-circle";
import { ConflictList, type ConflictItem } from "@/app/components/conflict-list";
import { AiAdvice } from "@/app/components/ai-advice";

type Props = {
  analysis: AnalysisHistory & {
    conflicts: unknown;
  };
  routineName: string;
  createdLabel: string;
};

export function AnalysisDetail({ analysis, routineName, createdLabel }: Props) {
  let conflicts: ConflictItem[] = [];
  try {
    const raw = analysis.conflicts;
    if (Array.isArray(raw)) {
      conflicts = raw.map((c: unknown) => {
        if (!c || typeof c !== "object") {
          return { pair: "Không rõ", level: "medium" as const };
        }
        const o = c as Record<string, unknown>;
        return {
          pair: String(o.pair ?? ""),
          level:
            o.level === "high" || o.level === "medium" || o.level === "low"
              ? o.level
              : "medium",
          ...(typeof o.hint === "string" && o.hint ? { hint: o.hint } : {}),
        };
      });
    }
  } catch {
    conflicts = [];
  }

  return (
    <div className="min-h-dvh bg-slate-50 px-4 pb-24 pt-6 dark:bg-[#0b0e14]">
      <div className="mx-auto max-w-lg space-y-6">
        <Link
          href="/lich-su"
          className="inline-block text-sm font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
        >
          ← Lịch sử
        </Link>

        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-500">{createdLabel}</p>
          <h1 className="mt-1 text-lg font-semibold leading-snug text-slate-900 dark:text-white">{routineName}</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:border-zinc-800 dark:bg-[#141820]/80 dark:shadow-none dark:ring-zinc-800/80">
          <ScoreCircle score={analysis.overallScore} />
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
            Xung đột hoạt chất
          </h2>
          <ConflictList items={conflicts} />
        </div>

        <AiAdvice markdown={analysis.aiRecommendations} />
      </div>
    </div>
  );
}
