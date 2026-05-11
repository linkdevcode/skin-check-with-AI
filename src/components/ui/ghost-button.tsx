"use client";

import { forwardRef, useCallback, useMemo } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "./haptic";
import { useCanHover } from "./use-can-hover";
import { useCoarsePointerOrNarrow } from "./use-coarse-pointer";
import { springSnappy, springSoft, tweenTap } from "./motion-spring";

export type GhostButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: React.ReactNode;
};

const baseClass =
  "sk-touch-manipulation relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-transparent px-4 text-sm font-medium " +
  "text-slate-700 transition-colors duration-200 " +
  "hover:bg-slate-100/90 hover:text-slate-900 motion-reduce:transition-none " +
  "dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800/70 dark:hover:text-white " +
  "disabled:cursor-not-allowed disabled:opacity-45 " +
  /** Chỉ hover chuột — tránh “sticky hover” trên cảm ứng */
  "[@media(hover:none)]:hover:bg-transparent [@media(hover:none)]:hover:text-inherit " +
  "dark:[@media(hover:none)]:hover:bg-transparent dark:[@media(hover:none)]:hover:text-inherit";

/** Nút phụ: hover chỉ khi có chuột; tap scale + haptic. */
export const GhostButton = forwardRef<HTMLButtonElement, GhostButtonProps>(function GhostButton(
  { className, children, disabled, onPointerDown, onClick, ...rest },
  ref,
) {
  const canHover = useCanHover();
  const coarse = useCoarsePointerOrNarrow();
  const tapTransition = useMemo(() => (coarse ? tweenTap : springSnappy), [coarse]);
  const hoverTransition = useMemo(() => (coarse ? tweenTap : springSoft), [coarse]);

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
      whileHover={canHover && !disabled ? { y: -1, transition: hoverTransition } : undefined}
      whileTap={disabled ? undefined : { scale: 0.96, opacity: 0.9, transition: tapTransition }}
      className={cn(baseClass, coarse && "sk-will-change-transform", className)}
      onPointerDown={(e) => {
        onPointerDown?.(e);
      }}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
