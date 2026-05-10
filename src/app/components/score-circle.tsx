"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type ScoreCircleProps = {
  score: number;
  max?: number;
  className?: string;
  size?: "md" | "lg";
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ScoreCircle({
  score,
  max = 100,
  className,
  size = "lg",
}: ScoreCircleProps) {
  const gradId = useId().replace(/:/g, "");
  const value = clamp(score, 0, max);
  const pct = (value / max) * 100;
  const r = 54;
  const stroke = 8;
  const normalized = r * 2 + stroke;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - pct / 100);

  const dim = size === "lg" ? "h-44 w-44" : "h-36 w-36";
  const textSize = size === "lg" ? "text-4xl" : "text-3xl";

  return (
    <div
      className={cn("flex flex-col items-center", className)}
      role="img"
      aria-label={`Điểm routine ${value} trên ${max}`}
    >
      <div className={cn("relative flex items-center justify-center", dim)}>
        <svg
          className="-rotate-90 transform"
          width={normalized}
          height={normalized}
          viewBox={`0 0 ${normalized} ${normalized}`}
          aria-hidden
        >
          <circle
            cx={normalized / 2}
            cy={normalized / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-slate-200 dark:text-zinc-700"
          />
          <circle
            cx={normalized / 2}
            cy={normalized / 2}
            r={r}
            fill="none"
            stroke={`url(#scoreGrad-${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dash}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
          <defs>
            <linearGradient id={`scoreGrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white",
              textSize,
            )}
          >
            {Math.round(value)}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-500">/ {max}</span>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-slate-500 dark:text-zinc-400">
        Điểm tổng thể routine
      </p>
    </div>
  );
}
