"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "./haptic";

export type InteractiveCardProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: React.ReactNode;
  /** Trạng thái đang chọn — viền sáng cố định */
  selected?: boolean;
  /** Trang trí (icon watermark) */
  decoration?: React.ReactNode;
};

export const InteractiveCard = forwardRef<HTMLButtonElement, InteractiveCardProps>(function InteractiveCard(
  { className, children, selected, decoration, disabled, onPointerDown, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 16, mass: 0.85 }}
      className={cn(
        "relative min-h-[3.35rem] overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
        "disabled:opacity-50",
        selected
          ? [
              "border-teal-400 bg-teal-50/95 text-teal-900",
              "shadow-[0_0_22px_-5px_rgba(34,211,172,0.65)] ring-2 ring-teal-400/90",
              "dark:border-teal-400/70 dark:bg-teal-950/50 dark:text-teal-50",
              "dark:shadow-[0_0_28px_-6px_rgba(34,211,172,0.45)] dark:ring-teal-400/60",
            ]
          : [
              "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              "dark:border-zinc-800 dark:bg-[#1a1f26]/80 dark:text-zinc-300 dark:hover:border-zinc-600",
            ],
        className,
      )}
      onPointerDown={(e) => {
        if (!disabled) triggerHaptic(10);
        onPointerDown?.(e);
      }}
      {...rest}
    >
      {decoration}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
});
