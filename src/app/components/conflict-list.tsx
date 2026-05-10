"use client";

import { AlertTriangle, ShieldAlert, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConflictItem, ConflictLevel } from "@/types/routine-analysis";

export type { ConflictItem, ConflictLevel };

type ConflictListProps = {
  items: ConflictItem[];
  className?: string;
};

const levelConfig: Record<
  ConflictLevel,
  { icon: typeof AlertTriangle; label: string; ring: string; text: string; iconStyle: string }
> = {
  high: {
    icon: AlertTriangle,
    label: "Cao",
    ring: "border-red-200 bg-red-50 ring-red-200/70 dark:border-zinc-800/80 dark:bg-red-950/50 dark:ring-red-500/40",
    text: "text-red-800 dark:text-red-300",
    iconStyle: "text-red-600 dark:text-red-400",
  },
  medium: {
    icon: ShieldAlert,
    label: "Trung bình",
    ring: "border-amber-200 bg-amber-50 ring-amber-200/70 dark:border-zinc-800/80 dark:bg-amber-950/40 dark:ring-amber-500/35",
    text: "text-amber-900 dark:text-amber-200",
    iconStyle: "text-amber-600 dark:text-amber-400",
  },
  low: {
    icon: AlertCircle,
    label: "Thấp",
    ring: "border-yellow-200 bg-yellow-50 ring-yellow-200/80 dark:border-zinc-800/80 dark:bg-yellow-950/30 dark:ring-yellow-500/30",
    text: "text-yellow-900 dark:text-yellow-100",
    iconStyle: "text-yellow-700 dark:text-yellow-400",
  },
};

export function ConflictList({ items, className }: ConflictListProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500",
          className,
        )}
      >
        Không phát hiện xung đột hoạt chất rõ ràng trong routine đã phân tích.
      </div>
    );
  }

  return (
    <ul className={cn("space-y-3", className)} role="list">
      {items.map((item, index) => {
        const cfg = levelConfig[item.level];
        const Icon = cfg.icon;
        return (
          <li
            key={`${item.pair}-${item.level}-${index}`}
            className={cn(
              "flex gap-3 rounded-2xl border p-4 ring-1 ring-inset",
              cfg.ring,
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/90 dark:bg-black/30",
              )}
              aria-hidden
            >
              <Icon className={cn("h-6 w-6", cfg.iconStyle)} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className={cn("font-medium", cfg.text)}>{item.pair}</p>
                <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:bg-black/25 dark:text-zinc-400">
                  {cfg.label}
                </span>
              </div>
              {item.hint ? (
                <p className="mt-1 text-sm leading-snug text-slate-600 dark:text-zinc-400">{item.hint}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
