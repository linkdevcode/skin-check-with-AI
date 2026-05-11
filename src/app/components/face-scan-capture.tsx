"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImagePlus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { tweenTap } from "@/components/ui/motion-spring";

export type FaceFrameNavArrows = {
  showLeft: boolean;
  showRight: boolean;
  onPrev: () => void;
  onNext: () => void;
};

type Props = {
  onFileReady: (file: File) => void;
  committedImageUrl?: string | null;
  onClearCommitted?: () => void;
  disabled?: boolean;
  showScanLine?: boolean;
  navArrows?: FaceFrameNavArrows | null;
  dots?: { count: number; index: number } | null;
  className?: string;
};

const tapMotion = { scale: 0.9, transition: tweenTap };

/**
 * Chọn ảnh qua input. Mũi tên điều hướng nằm ngoài khung ảnh (trong container rộng hơn), hiển thị mọi kích thước màn hình.
 */
export function FaceScanCapture({
  onFileReady,
  committedImageUrl,
  onClearCommitted,
  disabled,
  showScanLine,
  navArrows,
  dots,
  className,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blobPreview, setBlobPreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const displaySrc = blobPreview ?? committedImageUrl ?? null;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!committedImageUrl) return;
    setBlobPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }, [committedImageUrl]);

  const dragEnabled = useMemo(() => {
    if (!isMobile) return false;
    if (!navArrows) return false;
    // Cho phép vuốt khi ảnh đang hiển thị; không gây khó chịu khi chưa chọn ảnh.
    return Boolean(displaySrc);
  }, [displaySrc, isMobile, navArrows]);

  const revokeBlob = () => {
    if (blobPreview?.startsWith("blob:")) URL.revokeObjectURL(blobPreview);
    setBlobPreview(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || disabled) return;
    revokeBlob();
    const url = URL.createObjectURL(f);
    setBlobPreview(url);
    onFileReady(f);
  };

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const onDiscard = () => {
    revokeBlob();
    onClearCommitted?.();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop: mũi tên nằm ngoài ảnh (không đè). Mobile: ẩn mũi tên + vuốt để đổi bước. */}
      <div className="mx-auto w-full max-w-[min(100%,420px)]">
        <div className="grid grid-cols-[44px_1fr_44px] items-center gap-5 px-5">
          <div className="flex items-center justify-center max-md:hidden">
            {navArrows?.showLeft ? (
              <motion.button
                type="button"
                disabled={disabled}
                whileTap={disabled ? undefined : tapMotion}
                onClick={(e) => {
                  e.stopPropagation();
                  navArrows.onPrev();
                }}
                className="sk-touch-manipulation flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                aria-label="Xem bước ảnh trước"
              >
                <ChevronLeft className="h-7 w-7" aria-hidden />
              </motion.button>
            ) : (
              <div className="h-11 w-11" aria-hidden />
            )}
          </div>

          <motion.div
            className="sk-touch-manipulation relative mx-auto w-[280px]"
            drag={dragEnabled ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (!dragEnabled || !navArrows) return;
              const x = info.offset.x;
              if (x > 60 && navArrows.showLeft) navArrows.onPrev();
              if (x < -60 && navArrows.showRight) navArrows.onNext();
            }}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5 shadow-inner dark:border-zinc-700 dark:bg-black/40">
              {displaySrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displaySrc}
                  alt="Xem trước"
                  className="h-full w-full select-none object-cover"
                  decoding="async"
                  fetchPriority="high"
                  draggable={false}
                />
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={openPicker}
                  className="sk-touch-manipulation flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-600 dark:text-zinc-400"
                >
                  <ImagePlus className="h-10 w-10 opacity-70" aria-hidden />
                  Chạm để chọn ảnh
                  <span className="text-xs text-slate-500 dark:text-zinc-500">Máy ảnh hoặc thư viện ảnh</span>
                </button>
              )}

              {showScanLine && displaySrc ? (
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="face-scan-sweep" />
                </div>
              ) : null}
            </div>

            {dots && dots.count > 1 ? (
              <div className="mt-2 flex items-center justify-center gap-2 md:hidden" aria-hidden>
                {Array.from({ length: dots.count }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition",
                      i === dots.index ? "bg-slate-900/70 dark:bg-white/70" : "bg-slate-900/20 dark:bg-white/20",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </motion.div>

          <div className="flex items-center justify-center max-md:hidden">
            {navArrows?.showRight ? (
              <motion.button
                type="button"
                disabled={disabled}
                whileTap={disabled ? undefined : tapMotion}
                onClick={(e) => {
                  e.stopPropagation();
                  navArrows.onNext();
                }}
                className="sk-touch-manipulation flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                aria-label="Sang bước ảnh tiếp theo"
              >
                <ChevronRight className="h-7 w-7" aria-hidden />
              </motion.button>
            ) : (
              <div className="h-11 w-11" aria-hidden />
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />

      {displaySrc ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              revokeBlob();
              openPicker();
            }}
            className="sk-touch-manipulation inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5 shrink-0" aria-hidden />
            Chọn ảnh khác
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onDiscard}
            className="sk-touch-manipulation inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-800 dark:border-zinc-600 dark:text-white"
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            Bỏ ảnh
          </button>
        </div>
      ) : null}
    </div>
  );
}
