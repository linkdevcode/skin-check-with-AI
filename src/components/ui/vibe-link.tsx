"use client";

import Link, { type LinkProps } from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "./haptic";

const MotionLink = motion.create(Link);

type VibeLinkProps = LinkProps &
  Omit<React.ComponentPropsWithoutRef<typeof MotionLink>, keyof LinkProps> & {
    className?: string;
    children: React.ReactNode;
  };

/** Link trông như nút primary — hover nổi, tap scale, pulse teal nhẹ */
export function VibeLink({ className, children, ...props }: VibeLinkProps) {
  return (
    <MotionLink
      className={cn(
        "relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold text-white",
        "bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-500 shadow-md shadow-teal-900/20 dark:shadow-black/40",
        className,
      )}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      onPointerDown={() => triggerHaptic(10)}
      {...props}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        initial={false}
        animate={{ opacity: [0.32, 0.1, 0.32] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(167,243,208,0.45) 0%, transparent 62%)",
        }}
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </MotionLink>
  );
}
