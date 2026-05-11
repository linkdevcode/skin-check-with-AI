import Link from "next/link";
import { Wand2, BookHeart, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";

const cardBase = cn(
  "sk-touch-manipulation group flex h-full min-h-[280px] flex-col items-center rounded-2xl border p-6 text-center shadow-sm transition",
);

const titleClass = "text-base font-bold leading-snug text-slate-900 dark:text-white";

const descClass = cn(
  "mt-2 flex flex-1 flex-col justify-start text-pretty text-sm leading-relaxed text-slate-600 dark:text-slate-400",
  "min-h-[3.25rem] sm:min-h-[3.5rem]",
);

const btnBase = cn(
  "mt-auto mx-auto inline-flex min-h-11 w-full max-w-[240px] items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
);

/** Da & ngân sách — violet */
const budgetCard = cn(
  cardBase,
  "border-violet-200/90 bg-white/90 hover:border-violet-400/60 hover:shadow-md hover:shadow-violet-500/10",
  "dark:border-violet-900/45 dark:bg-[#1a1624]/92 dark:hover:border-violet-600/50",
);
const budgetIconWrap = cn(
  "mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 ring-2 ring-violet-400/30",
  "dark:bg-violet-500/10 dark:ring-violet-500/25",
);
const budgetIcon = "h-7 w-7 text-violet-700 dark:text-violet-300";
const budgetBtn = cn(
  btnBase,
  "bg-violet-600 text-white shadow-sm shadow-violet-900/15 hover:bg-violet-500 dark:shadow-violet-950/35",
);

/** Phân tích routine — teal */
const routineCard = cn(
  cardBase,
  "border-slate-200/90 bg-white/90 hover:border-teal-400/60 hover:shadow-md hover:shadow-teal-500/10",
  "dark:border-zinc-800 dark:bg-[#161c24]/90 dark:hover:border-teal-600/50",
);
const routineIconWrap = cn(
  "mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 ring-2 ring-teal-400/30",
  "dark:bg-teal-500/10 dark:ring-teal-500/25",
);
const routineIcon = "h-7 w-7 text-teal-600 dark:text-teal-400";
const routineBtn = cn(
  btnBase,
  "bg-teal-600 text-white shadow-sm shadow-teal-900/10 hover:bg-teal-500 dark:shadow-teal-950/30",
);

/** Nhật ký da — cyan + nút viền (secondary) */
const diaryCard = cn(
  cardBase,
  "border-cyan-200/90 bg-white/90 hover:border-cyan-400/60 hover:shadow-md hover:shadow-cyan-500/10",
  "dark:border-cyan-900/40 dark:bg-[#141c22]/92 dark:hover:border-cyan-600/45",
);
const diaryIconWrap = cn(
  "mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 ring-2 ring-cyan-400/30",
  "dark:bg-cyan-500/10 dark:ring-cyan-500/25",
);
const diaryIcon = "h-7 w-7 text-cyan-700 dark:text-cyan-400";
const diaryBtn = cn(
  btnBase,
  "border-2 border-teal-600 bg-transparent text-teal-800 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-200 dark:hover:bg-teal-950/45",
);

/**
 * Trang chủ: Da & ngân sách → Phân tích routine → Nhật ký da.
 */
export function RoutineLanding() {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100svh-3.5rem)] flex-col bg-slate-50",
        "pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]",
        "dark:bg-[#0b0e14]",
      )}
    >
      <div
        className={cn(
          "flex min-h-[calc(100svh-3.5rem)] w-full flex-1 flex-col px-0",
          "pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
          "sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))]",
        )}
      >
        <section
          className={cn(
            "flex w-full flex-1 flex-col justify-center bg-gradient-to-b from-teal-50 via-white to-white py-10",
            "border-y border-slate-200/90 dark:border-teal-800/45 dark:bg-[#121821] dark:from-teal-950/40 dark:via-[#121821] dark:to-[#0c1015]",
            "rounded-none border-x-0 sm:mx-auto sm:my-3 sm:min-h-0 sm:max-w-[min(92rem,calc(100vw-2rem))] sm:rounded-2xl sm:border sm:px-6 sm:py-12 sm:shadow-lg md:px-10 md:py-14",
            "dark:shadow-none sm:dark:shadow-xl",
          )}
          aria-labelledby="hero-title"
        >
          <div className="mx-auto mb-8 max-w-xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-400/95">
              SkinCheck AI
            </p>
            <h1
              id="hero-title"
              className={cn(
                "mt-2 text-balance font-bold tracking-tight text-slate-900 dark:text-white",
                "text-[clamp(1.25rem,3.5vw+0.5rem,2.25rem)] leading-tight",
              )}
            >
              Chăm sóc da thông minh
            </h1>
            <p
              className={cn(
                "mt-3 text-pretty text-slate-600 dark:text-slate-400",
                "text-[clamp(0.875rem,1vw+0.6rem,1rem)] leading-relaxed",
              )}
            >
              Phân tích da, phân tích routine và nhật ký chăm sóc da qua ảnh.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-2xl auto-rows-fr gap-4 sm:max-w-5xl sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/routine-ngan-sach" className={budgetCard}>
              <div className={budgetIconWrap} aria-hidden>
                <ScanFace className={budgetIcon} strokeWidth={2} />
              </div>
              <h2 className={titleClass}>Phân tích da &amp; ngân sách</h2>
              <p className={descClass}>
                Bước 1: Chụp ảnh mặt trước (bắt buộc) — 2 ảnh trái phải là tuỳ chọn để AI chấm điểm chính xác hơn.
              </p>
              <span className={budgetBtn}>Bắt đầu</span>
            </Link>

            <Link href="/routine" className={routineCard}>
              <div className={routineIconWrap} aria-hidden>
                <Wand2 className={routineIcon} strokeWidth={2} />
              </div>
              <h2 className={titleClass}>Phân tích routine</h2>
              <p className={descClass}>Kiểm tra xung đột hoạt chất, da mụn, gợi ý layering.</p>
              <span className={routineBtn}>Bắt đầu</span>
            </Link>

            <Link href="/nhat-ky-da" className={cn(diaryCard, "sm:col-span-2 lg:col-span-1")}>
              <div className={diaryIconWrap} aria-hidden>
                <BookHeart className={diaryIcon} strokeWidth={2} />
              </div>
              <h2 className={titleClass}>Nhật ký theo dõi da</h2>
              <p className={descClass}>
                Bước 1: Chụp ảnh mặt trước (bắt buộc). AI cần ảnh này để so sánh với các mốc thời gian khác.
              </p>
              <span className={diaryBtn}>Mở nhật ký</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
