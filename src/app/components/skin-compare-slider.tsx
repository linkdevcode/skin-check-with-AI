"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
};

/**
 * Slider so sánh Before / After — kéo để lộ ảnh sau (mới) từ trái sang phải.
 */
export function SkinCompareSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Trước",
  afterLabel = "Sau",
  className,
}: Props) {
  const [pct, setPct] = useState(50);

  const onPointer = useCallback((clientX: number, rect: DOMRect) => {
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    setPct(Math.round((x / rect.width) * 100));
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex justify-between text-xs font-medium text-slate-500 dark:text-zinc-400">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
      <div
        className="relative aspect-[4/5] w-full max-h-[70vh] cursor-ew-resize overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner select-none touch-pan-y dark:border-zinc-700 dark:bg-zinc-900"
        onPointerDown={(e) => {
          const el = e.currentTarget;
          const move = (ev: PointerEvent) => {
            onPointer(ev.clientX, el.getBoundingClientRect());
          };
          const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          };
          onPointer(e.clientX, el.getBoundingClientRect());
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        }}
        role="img"
        aria-label={`So sánh ảnh da: ${beforeLabel} và ${afterLabel}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeUrl} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={afterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[2px_0_8px_rgba(0,0,0,0.25)]"
          style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
        />
        <div
          className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-teal-600 text-[10px] font-bold text-white shadow-lg"
          style={{ left: `${pct}%` }}
          aria-hidden
        >
          ⟷
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500 dark:text-zinc-500">
        Chạm và kéo ngang để so sánh
      </p>
    </div>
  );
}
