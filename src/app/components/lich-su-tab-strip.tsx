"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Sparkles, WalletCards, BookHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LichSuLoai } from "@/lib/lich-su-unified";
import { springSoft, tweenLayout, tweenTabIconBounce } from "@/components/ui/motion-spring";
import { useCoarsePointerOrNarrow } from "@/components/ui/use-coarse-pointer";

const tabs: {
  loai: LichSuLoai;
  label: string;
  href: string;
  Icon: typeof LayoutGrid;
}[] = [
  { loai: "tat-ca", label: "Tất cả", href: "/lich-su", Icon: LayoutGrid },
  { loai: "routine", label: "Routine", href: "/lich-su?loai=routine", Icon: Sparkles },
  { loai: "da-ngan-sach", label: "Da & NS", href: "/lich-su?loai=da-ngan-sach", Icon: WalletCards },
  { loai: "nhat-ky-da", label: "Nhật ký", href: "/lich-su?loai=nhat-ky-da", Icon: BookHeart },
];

export function LichSuTabStrip({ activeLoai }: { activeLoai: LichSuLoai }) {
  const coarse = useCoarsePointerOrNarrow();
  const pillTransition = useMemo(() => (coarse ? tweenLayout : springSoft), [coarse]);

  return (
    <div
      className={cn(
        "mt-5 flex gap-1 sm:flex-wrap sm:gap-2",
        "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-40 max-sm:justify-between max-sm:border-t max-sm:border-slate-200 max-sm:bg-white/95 max-sm:px-1.5 max-sm:py-2 max-sm:pb-[max(0.6rem,env(safe-area-inset-bottom))] max-sm:backdrop-blur-md dark:max-sm:border-zinc-800 dark:max-sm:bg-[#0b0e14]/95",
      )}
      role="tablist"
      aria-label="Lọc loại lịch sử"
    >
      {tabs.map((t) => {
        const active = t.loai === activeLoai;
        const Icon = t.Icon;
        return (
          <Link
            key={t.loai}
            href={t.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "sk-touch-manipulation relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1.5 text-[10px] font-semibold leading-tight sm:min-h-9 sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3 sm:py-1.5 sm:text-xs md:text-sm",
              active
                ? "border-teal-600 text-white dark:border-teal-500"
                : "border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
            )}
          >
            {active ? (
              <motion.span
                layoutId="lich-su-tab-pill"
                className="sk-will-change-transform absolute inset-0 rounded-xl bg-teal-600 sm:rounded-full dark:bg-teal-600"
                transition={pillTransition}
              />
            ) : null}
            <motion.span
              className={cn(
                "relative z-10 flex flex-col items-center gap-0.5 sm:flex-row sm:gap-1.5",
                active && "sk-will-change-transform",
              )}
              initial={false}
              animate={active ? { scale: [1, 1.14, 1] } : { scale: 1 }}
              transition={active ? tweenTabIconBounce : { type: "tween", duration: 0.12, ease: "easeOut" }}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90 sm:h-3.5 sm:w-3.5" aria-hidden />
              <span className="max-w-[4.2rem] truncate text-center sm:max-w-none">{t.label}</span>
            </motion.span>
          </Link>
        );
      })}
    </div>
  );
}
