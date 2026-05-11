"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "./haptic";

export type VibeButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: React.ReactNode;
  /** Hiệu ứng pulse teal nhẹ (mặc định bật khi không disabled) */
  pulse?: boolean;
};

const baseClass =
  "relative inline-flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-semibold text-white " +
  "bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-500 shadow-md shadow-teal-900/20 dark:shadow-black/40 " +
  "disabled:cursor-not-allowed disabled:opacity-45";

export const VibeButton = forwardRef<HTMLButtonElement, VibeButtonProps>(function VibeButton(
  { className, children, pulse = true, disabled, onPointerDown, onClick, type = "button", ...rest },
  ref,
) {
  const vibrate = () => {
    if (!disabled) triggerHaptic(10);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={cn(baseClass, className)}
      onPointerDown={(e) => {
        vibrate();
        onPointerDown?.(e);
      }}
      onClick={(e) => {
        onClick?.(e);
      }}
      {...rest}
    >
      {pulse && !disabled ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          initial={false}
          animate={{
            opacity: [0.35, 0.12, 0.35],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(167,243,208,0.5) 0%, transparent 62%)",
          }}
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
});
