"use client";

import { forwardRef, useCallback } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCanHover } from "./use-can-hover";
import { springSnappy, springSoft } from "./motion-spring";

export type GhostButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: React.ReactNode;
};

const baseClass =
  "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-transparent px-4 text-sm font-medium " +
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

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && typeof window !== "undefined" && window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
      onClick?.(e);
    },
    [disabled, onClick],
  );

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      whileHover={canHover && !disabled ? { y: -1, transition: springSoft } : undefined}
      whileTap={disabled ? undefined : { scale: 0.96, opacity: 0.9, transition: springSnappy }}
      className={cn(baseClass, className)}
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
