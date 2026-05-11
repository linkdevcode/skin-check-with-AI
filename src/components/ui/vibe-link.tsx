"use client";

import Link, { type LinkProps } from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCanHover } from "./use-can-hover";
import { springSnappy, springSoft } from "./motion-spring";

const MotionLink = motion.create(Link);

type VibeLinkProps = LinkProps &
  Omit<React.ComponentPropsWithoutRef<typeof MotionLink>, keyof LinkProps> & {
    className?: string;
    children: React.ReactNode;
  };

/** Link trông như nút primary — hover chỉ desktop; tap scale + haptic. */
export function VibeLink({ className, children, onClick, ...props }: VibeLinkProps) {
  const canHover = useCanHover();

  return (
    <MotionLink
      className={cn(
        "relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold text-white",
        "bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-500 shadow-md shadow-teal-900/20 dark:shadow-black/40",
        className,
      )}
      whileHover={canHover ? { y: -2, transition: springSoft } : undefined}
      whileTap={{ scale: 0.96, opacity: 0.9, transition: springSnappy }}
      transition={springSoft}
      onClick={(e) => {
        if (typeof window !== "undefined" && window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
        onClick?.(e);
      }}
      {...props}
    >
      {canHover ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1 z-20 h-[3px] w-[38%] max-w-[9rem] rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-95 shadow-[0_0_12px_rgba(204,251,241,0.9)]"
          initial={false}
          animate={{ x: ["-35%", "280%"] }}
          transition={{ duration: 2.35, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
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
