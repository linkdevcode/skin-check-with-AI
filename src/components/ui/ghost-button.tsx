"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "./haptic";

export type GhostButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: React.ReactNode;
};

const baseClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-transparent px-4 text-sm font-medium " +
  "text-slate-700 transition-colors duration-200 " +
  "hover:bg-slate-100/90 hover:text-slate-900 " +
  "dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800/70 dark:hover:text-white " +
  "disabled:cursor-not-allowed disabled:opacity-45";

/** Nút phụ: chỉ đổi màu chữ / nền mờ khi hover, không scale mạnh. */
export const GhostButton = forwardRef<HTMLButtonElement, GhostButtonProps>(function GhostButton(
  { className, children, disabled, onPointerDown, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(baseClass, className)}
      onPointerDown={(e) => {
        if (!disabled) triggerHaptic(10);
        onPointerDown?.(e);
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
