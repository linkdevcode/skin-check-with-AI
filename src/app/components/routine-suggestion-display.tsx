"use client";

import type {
  BudgetRoutinePackage,
  RoutineProductSuggestion,
  ThreeTierRoutineResult,
} from "@/types/face-routine-budget";
import { cn } from "@/lib/utils";

const PHASE_VI: Record<RoutineProductSuggestion["routinePhase"], string> = {
  cleanser: "Làm sạch",
  treatment: "Điều trị / hoạt chất",
  moisturizer: "Dưỡng ẩm",
  sunscreen: "Chống nắng",
  other: "Khác",
};

function formatVnd(n: number) {
  return `${n.toLocaleString("vi-VN")}đ`;
}

function ProductCard({ p }: { p: RoutineProductSuggestion }) {
  return (
    <li className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-white">{p.productName}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-500">{p.brandName}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400/90">
            {PHASE_VI[p.routinePhase]}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-semibold tabular-nums text-slate-800 shadow-sm dark:bg-zinc-800 dark:text-teal-200">
          {formatVnd(p.estimatedPriceVnd)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">{p.reason}</p>
    </li>
  );
}

export function BudgetRoutineResultView({ pkg }: { pkg: BudgetRoutinePackage }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-teal-200/80 bg-teal-50/60 p-3 text-sm text-teal-950 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-100">
        <p className="font-semibold">Tổng ước tính: {formatVnd(pkg.totalEstimatedVnd)}</p>
        <p className="mt-2 whitespace-pre-wrap text-teal-900/90 dark:text-teal-100/90">{pkg.summaryVi}</p>
      </div>
      <ul className="space-y-3" role="list">
        {pkg.products.map((p, i) => (
          <ProductCard key={`${p.productName}-${i}`} p={p} />
        ))}
      </ul>
    </div>
  );
}

export function ThreeTierRoutineResultView({ tiers }: { tiers: ThreeTierRoutineResult }) {
  const blocks: { key: keyof ThreeTierRoutineResult; title: string; sub: string }[] = [
    { key: "tietKiem", title: "Tiết kiệm", sub: "Drugstore, tối giản" },
    { key: "hieuQua", title: "Hiệu quả", sub: "Cân bằng giá & hiệu quả" },
    { key: "caoCap", title: "Cao cấp", sub: "Dòng cao hơn" },
  ];
  return (
    <div className="space-y-6">
      {blocks.map(({ key, title, sub }) => {
        const t = tiers[key];
        return (
          <section
            key={key}
            className={cn(
              "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
              "dark:border-zinc-800 dark:bg-[#141820]/90",
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-500">{sub}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-teal-700 dark:text-teal-300">
                ~{formatVnd(t.totalEstimatedVnd)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300">{t.taglineVi}</p>
            <ul className="mt-4 space-y-3" role="list">
              {t.products.map((p, i) => (
                <ProductCard key={`${key}-${p.productName}-${i}`} p={p} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
