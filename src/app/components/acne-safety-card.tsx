"use client";

import { Droplets, ShieldAlert, ShieldCheck } from "lucide-react";
import type { AcneSafety } from "@/types/routine-analysis";
import { cn } from "@/lib/utils";

const riskCopy: Record<
  AcneSafety["riskLevel"],
  { labelVi: string; ring: string; bg: string; text: string; icon: typeof ShieldCheck }
> = {
  low: {
    labelVi: "Rủi ro bít tắc thấp (ước lượng)",
    ring: "ring-emerald-200/80 dark:ring-emerald-500/25",
    bg: "bg-emerald-50 dark:bg-emerald-950/35",
    text: "text-emerald-800 dark:text-emerald-200",
    icon: ShieldCheck,
  },
  moderate: {
    labelVi: "Rủi ro trung bình — theo dõi kỹ",
    ring: "ring-amber-200/90 dark:ring-amber-500/30",
    bg: "bg-amber-50 dark:bg-amber-950/35",
    text: "text-amber-900 dark:text-amber-100",
    icon: ShieldAlert,
  },
  high: {
    labelVi: "Rủi ro bít tắc cao hơn — cân nhắc tối giản lớp",
    ring: "ring-red-200/90 dark:ring-red-500/30",
    bg: "bg-red-50 dark:bg-red-950/35",
    text: "text-red-800 dark:text-red-200",
    icon: Droplets,
  },
};

type AcneSafetyCardProps = {
  data: AcneSafety;
  className?: string;
};

export function AcneSafetyCard({ data, className }: AcneSafetyCardProps) {
  const cfg = riskCopy[data.riskLevel];
  const Icon = cfg.icon;
  const list = data.poreCloggingConcerns?.filter(Boolean) ?? [];

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 p-5 ring-1 ring-inset dark:border-zinc-800",
        cfg.ring,
        cfg.bg,
        className,
      )}
      aria-labelledby="acne-safety-heading"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/90 dark:bg-black/35"
          aria-hidden
        >
          <Icon className={cn("h-6 w-6", cfg.text)} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id="acne-safety-heading"
            className="text-sm font-semibold text-slate-900 dark:text-white"
          >
            An toàn cho da mụn & lỗ chân lông
          </h3>
          <p className={cn("mt-1 text-xs font-medium uppercase tracking-wide", cfg.text)}>
            {cfg.labelVi}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
            {data.summary}
          </p>

          {list.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                Thành phần / nhóm cần lưu ý (bít tắc tiềm ẩn)
              </p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700 dark:text-zinc-300" role="list">
                {list.map((item, i) => (
                  <li
                    key={`${i}-${item.slice(0, 32)}`}
                    className="flex gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-zinc-800/80 dark:bg-black/20"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-zinc-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600 dark:text-zinc-500">
              Không chỉ ra thành phần bít tắc cụ thể từ mô tả — tiếp tục giữ routine gọn, không
              xếp chồng quá nhiều lớp dày.
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-snug text-slate-500 dark:text-zinc-500">
        Thang đánh giá mang tính giáo dục, không thay chẩn đoán bác sĩ. Comedogenicity phụ thuộc
        nồng độ, toàn bộ công thức và cá thể.
      </p>
    </section>
  );
}
