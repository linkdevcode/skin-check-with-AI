"use client";

import { forwardRef, useCallback } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "./haptic";
import { useCanHover } from "./use-can-hover";
import { springSnappy, springSoft } from "./motion-spring";

export type VibeButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: React.ReactNode;
  /** Hiệu ứng pulse teal nhẹ (mặc định bật khi không disabled) */
  pulse?: boolean;
};

const baseClass =
  "relative z-10 inline-flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-semibold text-white " +
  "bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-500 shadow-md shadow-teal-900/20 dark:shadow-black/40 " +
  "disabled:cursor-not-allowed disabled:opacity-45";

export const VibeButton = forwardRef<HTMLButtonElement, VibeButtonProps>(function VibeButton(
  { className, children, pulse = true, disabled, onPointerDown, onClick, type = "button", ...rest },
  ref,
) {
  const canHover = useCanHover();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) triggerHaptic(10);
      onClick?.(e);
    },
    [disabled, onClick],
  );

  const hoverMotion =
    canHover && !disabled ? { y: -2, transition: springSoft } : undefined;
  const tapMotion = disabled ? undefined : { scale: 0.96, opacity: 0.9, transition: springSnappy };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      whileHover={hoverMotion}
      whileTap={tapMotion}
      className={cn(baseClass, className)}
      onPointerDown={(e) => {
        onPointerDown?.(e);
      }}
      onClick={handleClick}
      {...rest}
    >
      {canHover && !disabled ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1 z-20 h-[3px] w-[38%] max-w-[9rem] rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-95 shadow-[0_0_14px_rgba(204,251,241,0.95)]"
          initial={false}
          animate={{ x: ["-35%", "280%"] }}
          transition={{ duration: 2.35, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      {pulse && !disabled ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          initial={false}
          animate={{
            opacity: [0.32, 0.12, 0.32],
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
