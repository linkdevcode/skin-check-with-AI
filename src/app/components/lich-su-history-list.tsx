"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/components/ui/motion-spring";
import { triggerHaptic } from "@/components/ui/haptic";

export type LichSuHistoryRow = {
  kind: "routine" | "da-ngan-sach" | "nhat-ky-da";
  id: string;
  createdAtIso: string;
  title: string;
  subtitle: string;
  href: string;
  badge: string | null;
};

function kindStyles(kind: LichSuHistoryRow["kind"]) {
  switch (kind) {
    case "routine":
      return {
        pill: "bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-200",
        badge: "bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-300",
      };
    case "da-ngan-sach":
      return {
        pill: "bg-violet-100 text-violet-900 dark:bg-violet-950/80 dark:text-violet-200",
        badge: "bg-violet-100 text-violet-900 dark:bg-violet-950/80 dark:text-violet-300",
      };
    case "nhat-ky-da":
      return {
        pill: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-200",
        badge: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-300",
      };
    default:
      return {
        pill: "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200",
        badge: "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300",
      };
  }
}

function kindLabel(kind: LichSuHistoryRow["kind"]) {
  switch (kind) {
    case "routine":
      return "Routine";
    case "da-ngan-sach":
      return "Da & NS";
    case "nhat-ky-da":
      return "Nhật ký";
    default:
      return "";
  }
}

export function LichSuHistoryList({ items }: { items: LichSuHistoryRow[] }) {
  return (
    <ul className="mt-8 space-y-3" role="list">
      <AnimatePresence mode="popLayout">
        {items.map((row, index) => {
          const date = new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(row.createdAtIso));
          const st = kindStyles(row.kind);
          return (
            <motion.li
              key={`${row.kind}-${row.id}`}
              layout
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0, transition: { ...springSnappy, delay: index * 0.05 } }}
              exit={{ opacity: 0, y: -6, transition: springSnappy }}
            >
              <motion.div
                whileTap={{ backgroundColor: "rgba(45, 212, 191, 0.12)" }}
                transition={springSnappy}
                className="rounded-2xl"
              >
                <Link
                  href={row.href}
                  className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm ring-1 ring-slate-100 transition-colors dark:border-zinc-800 dark:bg-[#1a1f26]/80 dark:ring-zinc-800/60 sm:px-4"
                  onClick={() => triggerHaptic(10)}
                >
                  <span
                    className={cn(
                      "hidden shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide sm:inline-block",
                      st.pill,
                    )}
                  >
                    {kindLabel(row.kind)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{row.title}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-zinc-500">
                      <span
                        className={cn(
                          "mr-1.5 inline sm:hidden",
                          st.pill,
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                        )}
                      >
                        {kindLabel(row.kind)}
                      </span>
                      {row.subtitle} · {date}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {row.badge ? (
                      <span
                        className={cn(
                          "max-w-[5.5rem] truncate rounded-lg px-2 py-1 text-xs font-semibold tabular-nums sm:max-w-[7rem]",
                          st.badge,
                        )}
                        title={row.badge}
                      >
                        {row.badge}
                      </span>
                    ) : null}
                    <ChevronRight className="h-5 w-5 text-slate-400 dark:text-zinc-600" aria-hidden />
                  </div>
                </Link>
              </motion.div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
