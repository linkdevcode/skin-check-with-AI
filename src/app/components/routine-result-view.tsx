"use client";

import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ScoreCircle } from "./score-circle";
import { ConflictList } from "./conflict-list";
import { AiAdvice } from "./ai-advice";
import { AcneSafetyCard } from "./acne-safety-card";
import { ResultSummaryCards } from "./result-summary-cards";
import type { AcneSafety, ConflictItem } from "@/types/routine-analysis";
import { cn } from "@/lib/utils";

export type RoutineResultViewProps = {
  score: number;
  conflicts: ConflictItem[];
  markdown: string;
  acneSafety: AcneSafety;
  persistMessage: string | null;
  guestNoSaveHint: boolean;
};

export function RoutineResultView({
  score,
  conflicts,
  markdown,
  acneSafety,
  persistMessage,
  guestNoSaveHint,
}: RoutineResultViewProps) {
  return (
    <section className="space-y-8" aria-live="polite">
      {guestNoSaveHint ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200/80 dark:border-zinc-700/80 dark:bg-[#1a1f26]/90 dark:text-zinc-300 dark:ring-zinc-800/60">
          <p>
            Bạn chưa đăng nhập — kết quả{" "}
            <strong className="text-slate-900 dark:text-white">không được lưu</strong>; tải lại trang sẽ mất. Đăng nhập
            để lưu lần sau và xem trong mục Lịch sử.
          </p>
          <Link
            href="/dang-nhap"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-600 px-4 text-center font-semibold text-white hover:bg-teal-500"
          >
            Đăng nhập
          </Link>
        </div>
      ) : null}

      {persistMessage ? (
        <div
          className={cn(
            "flex gap-3 rounded-2xl border px-4 py-3 text-sm ring-1",
            persistMessage.startsWith("Đã lưu")
              ? "border-teal-200 bg-teal-50 text-teal-900 ring-teal-200/80 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100 dark:ring-emerald-500/15"
              : "border-amber-200 bg-amber-50 text-amber-900 ring-amber-200/80 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100 dark:ring-amber-500/20",
          )}
        >
          {persistMessage.startsWith("Đã lưu") ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-emerald-400" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          )}
          <p>{persistMessage}</p>
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6",
          "dark:border-zinc-800 dark:bg-[#141820]/80 dark:ring-zinc-800/80",
        )}
      >
        <h2 className="sr-only">Kết quả tổng quan</h2>
        <ScoreCircle score={score} />
        <div className="mt-6">
          <ResultSummaryCards score={score} conflicts={conflicts} acneSafety={acneSafety} />
        </div>
      </div>

      <AcneSafetyCard data={acneSafety} />

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
          Xung đột hoạt chất
        </h2>
        <ConflictList items={conflicts} />
      </div>

      <AiAdvice markdown={markdown} />
    </section>
  );
}
