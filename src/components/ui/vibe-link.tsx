"use client";

import Link, { type LinkProps } from "next/link";
import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "./haptic";
import { useCanHover } from "./use-can-hover";
import { useCoarsePointerOrNarrow } from "./use-coarse-pointer";
import { springSnappy, springSoft, tweenTap } from "./motion-spring";

const MotionLink = motion.create(Link);

type VibeLinkProps = LinkProps &
  Omit<React.ComponentPropsWithoutRef<typeof MotionLink>, keyof LinkProps> & {
    className?: string;
    children: React.ReactNode;
  };

/** Link trông như nút primary — hover chỉ desktop; tap scale + haptic. */
export function VibeLink({ className, children, onClick, ...props }: VibeLinkProps) {
  const canHover = useCanHover();
  const coarse = useCoarsePointerOrNarrow();
  const tapTransition = useMemo(() => (coarse ? tweenTap : springSnappy), [coarse]);
  const hoverTransition = useMemo(() => (coarse ? tweenTap : springSoft), [coarse]);
  const beamTransition = useMemo(() => ({ duration: coarse ? 2.8 : 2.35, repeat: Infinity, ease: "easeInOut" as const }), [coarse]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      triggerHaptic(10);
      onClick?.(e);
    },
    [onClick],
  );

  return (
    <MotionLink
      className={cn(
        "sk-touch-manipulation relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold text-white",
        "bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-500 shadow-md shadow-teal-900/20 dark:shadow-black/40",
        coarse && "sk-will-change-transform",
        className,
      )}
      whileHover={
        canHover ? (coarse ? { opacity: 0.96, transition: hoverTransition } : { y: -2, transition: hoverTransition }) : undefined
      }
      whileTap={{ scale: 0.96, opacity: 0.9, transition: tapTransition }}
      transition={hoverTransition}
      onClick={handleClick}
      {...props}
    >
      {canHover ? (
        <motion.span
          aria-hidden
          className="sk-will-change-transform pointer-events-none absolute left-0 top-1 z-20 h-[3px] w-[38%] max-w-[9rem] rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-95 shadow-[0_0_12px_rgba(204,251,241,0.9)]"
          initial={false}
          animate={{ x: ["-35%", "280%"] }}
          transition={beamTransition}
        />
      ) : null}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        initial={false}
        animate={{ opacity: [0.32, 0.1, 0.32] }}
        transition={{ duration: coarse ? 2.8 : 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(167,243,208,0.45) 0%, transparent 62%)",
        }}
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </MotionLink>
  );
}
