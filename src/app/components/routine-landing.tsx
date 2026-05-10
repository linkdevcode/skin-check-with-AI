import Link from "next/link";
import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Trang chủ: chỉ hero full màn — CTA dẫn tới /routine (trang riêng).
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
            "flex w-full flex-1 flex-col justify-center bg-gradient-to-b from-teal-50 via-white to-white",
            "border-y border-slate-200/90 py-12 dark:border-teal-800/45 dark:bg-[#121821] dark:from-teal-950/40 dark:via-[#121821] dark:to-[#0c1015]",
            "rounded-none border-x-0 sm:mx-auto sm:my-3 sm:min-h-0 sm:max-w-[min(92rem,calc(100vw-2rem))] sm:rounded-2xl sm:border sm:px-8 sm:py-14 sm:shadow-lg md:px-12 md:py-16 lg:px-16 lg:py-20 xl:px-20",
            "dark:shadow-none sm:dark:shadow-xl",
          )}
          aria-labelledby="hero-title"
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-[min(36rem,calc(100vw-1.5rem))] flex-col items-center text-center",
              "sm:max-w-2xl md:max-w-3xl lg:max-w-4xl",
            )}
          >
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/15 ring-2 ring-teal-400/40 sm:h-[4.5rem] sm:w-[4.5rem] md:h-20 md:w-20 dark:bg-teal-500/10 dark:ring-teal-500/25"
              aria-hidden
            >
              <Wand2
                className="h-8 w-8 text-teal-600 sm:h-10 sm:w-10 md:h-11 md:w-11 dark:text-teal-400"
                strokeWidth={2}
              />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-400/95">
              SkinCheck AI
            </p>
            <h1
              id="hero-title"
              className={cn(
                "mt-3 max-w-[20ch] text-balance font-bold tracking-tight text-slate-900 dark:text-white",
                "text-[clamp(1.35rem,4.2vw+0.6rem,2.85rem)] leading-tight sm:max-w-none",
              )}
            >
              Phân tích routine skincare
            </h1>
            <p
              className={cn(
                "mt-4 max-w-prose text-pretty text-slate-600 dark:text-slate-400",
                "text-[clamp(0.875rem,1.2vw+0.65rem,1.125rem)] leading-relaxed",
              )}
            >
              Kiểm tra xung đột hoạt chất, độ phù hợp da mụn và gợi ý thứ tự bôi — tối ưu trên điện thoại.
            </p>
            <Link
              href="/routine"
              className={cn(
                "mt-10 flex w-full max-w-md min-h-[3rem] items-center justify-center rounded-xl px-6 text-sm font-semibold shadow-md transition active:scale-[0.98]",
                "sm:mt-12 sm:min-h-14 sm:px-8 sm:text-base",
                "bg-teal-600 text-white shadow-teal-900/20 hover:bg-teal-500 dark:shadow-black/50",
              )}
            >
              Bắt đầu phân tích
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
