"use client";

import type { FaceRoutineAnalysis } from "@/types/face-routine-budget";
import { cn } from "@/lib/utils";

const SKIN_VI: Record<FaceRoutineAnalysis["skinType"], string> = {
  OILY: "Da dầu",
  DRY: "Da khô",
  COMBINATION: "Da hỗn hợp",
  SENSITIVE: "Da nhạy cảm",
};

function Bar({ label, value, accent }: { label: string; value: number; accent: string }) {
  const v = Math.max(0, Math.min(10, value));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums text-slate-900 dark:text-white">{v}/10</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
        <div
          className={cn("h-full rounded-full transition-all duration-500", accent)}
          style={{ width: `${(v / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

type Props = {
  data: FaceRoutineAnalysis;
  className?: string;
};

export function RoutineBudgetDashboard({ data, className }: Props) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/90",
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Kết quả phân tích</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
        Ước lượng từ ảnh — không thay thế khám da liễu.
      </p>

      <div className="mt-4 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
        Loại da: {SKIN_VI[data.skinType]}
      </div>

      <div className="mt-5 space-y-4">
        <Bar label="Da mụn / viêm" value={data.acneScore} accent="bg-rose-500 dark:bg-rose-400" />
        <Bar label="Lỗ chân lông" value={data.poreVisibilityScore} accent="bg-amber-500 dark:bg-amber-400" />
        <Bar label="Độ ẩm (bề mặt)" value={data.hydrationScore} accent="bg-sky-500 dark:bg-sky-400" />
      </div>

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-700 dark:border-zinc-800 dark:text-zinc-300">
        <p>
          <span className="font-medium text-slate-900 dark:text-white">Mụn: </span>
          {data.acneLevelSummaryVi}
        </p>
        <p>
          <span className="font-medium text-slate-900 dark:text-white">Lỗ chân lông: </span>
          {data.poreSummaryVi}
        </p>
      </div>
      <p className="mt-3 text-[11px] text-slate-500 dark:text-zinc-500">{data.disclaimerShortVi}</p>
    </section>
  );
}
