"use client";

import { forwardRef, useCallback, useMemo, memo } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "./haptic";
import { useCanHover } from "./use-can-hover";
import { useCoarsePointerOrNarrow } from "./use-coarse-pointer";
import { springBouncy, springSnappy, tweenEnter, tweenTap } from "./motion-spring";

export type InteractiveCardProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: React.ReactNode;
  /** Trạng thái đang chọn — viền glow + checkmark */
  selected?: boolean;
  /** Trang trí (icon watermark) */
  decoration?: React.ReactNode;
};

const InteractiveCardInner = forwardRef<HTMLButtonElement, InteractiveCardProps>(function InteractiveCardInner(
  { className, children, selected, decoration, disabled, onPointerDown, onClick, ...rest },
  ref,
) {
  const canHover = useCanHover();
  const coarse = useCoarsePointerOrNarrow();
  const tapTransition = useMemo(() => (coarse ? tweenTap : springSnappy), [coarse]);
  const checkTransition = useMemo(() => (coarse ? tweenEnter : springBouncy), [coarse]);

  /** Chỉ transform — không animate border (tránh repaint nặng trên mobile) */
  const hoverMotion =
    canHover && !disabled && !selected ? { scale: 1.02, transition: tapTransition } : undefined;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) triggerHaptic(10);
      onClick?.(e);
    },
    [disabled, onClick],
  );

  return (
    <motion.button
      ref={ref}
      type="button"
      layout={false}
      disabled={disabled}
      whileHover={hoverMotion}
      whileTap={disabled ? undefined : { scale: 0.98, transition: tapTransition }}
      className={cn(
        "sk-touch-manipulation relative min-h-[3.35rem] overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
        coarse && "sk-will-change-transform",
        "disabled:opacity-50",
        selected
          ? [
              "border-teal-400 bg-teal-50/95 text-teal-900",
              "shadow-[0_0_26px_-4px_rgba(34,211,172,0.75),0_0_0_2px_rgba(45,212,191,0.55)]",
              "ring-2 ring-teal-400/90",
              "dark:border-teal-400/70 dark:bg-teal-950/50 dark:text-teal-50",
              "dark:shadow-[0_0_32px_-4px_rgba(34,211,172,0.5),0_0_0_2px_rgba(45,212,191,0.45)]",
            ]
          : [
              "border-slate-200 bg-white text-slate-700",
              "dark:border-zinc-800 dark:bg-[#1a1f26]/80 dark:text-zinc-300",
              "[@media(hover:hover)]:hover:border-slate-300 dark:[@media(hover:hover)]:hover:border-zinc-600",
            ],
        className,
      )}
      onPointerDown={(e) => {
        onPointerDown?.(e);
      }}
      onClick={handleClick}
      {...rest}
    >
      {decoration}
      {selected ? (
        <motion.span
          aria-hidden
          layout={false}
          className="sk-will-change-transform absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white shadow-md shadow-teal-900/25 dark:bg-teal-400 dark:text-teal-950"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={checkTransition}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      ) : null}
      <span className={cn("relative z-10", selected && "pr-7")}>{children}</span>
    </motion.button>
  );
});

InteractiveCardInner.displayName = "InteractiveCard";

export const InteractiveCard = memo(InteractiveCardInner);
