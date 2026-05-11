"use client";

import { useEffect, useRef, useState } from "react";
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
  className?: string;
};

const tapMotion = { scale: 0.9, transition: tweenTap };

export function FaceScanCapture({
  onFileReady,
  committedImageUrl,
  onClearCommitted,
  disabled,
  showScanLine,
  navArrows,
  className,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blobPreview, setBlobPreview] = useState<string | null>(null);

  const displaySrc = blobPreview ?? committedImageUrl ?? null;
  const canPrev = navArrows?.showLeft ?? false;
  const canNext = navArrows?.showRight ?? false;
  const handlePrev = navArrows?.onPrev ?? (() => {});
  const handleNext = navArrows?.onNext ?? (() => {});

  useEffect(() => {
    if (!committedImageUrl) return;
    setBlobPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }, [committedImageUrl]);

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

  const openPicker = () => fileInputRef.current?.click();

  const onDiscard = () => {
    revokeBlob();
    onClearCommitted?.();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/*
        Wrapper đủ rộng để 2 nút mũi tên (44px mỗi bên) + gap (8px) nằm
        bên ngoài ảnh mà không che.  Ảnh chiếm phần còn lại ở giữa.
        Toàn bộ wrapper căn giữa trang.
      */}
      <div className="relative mx-auto flex w-full max-w-sm items-center gap-2">
        {/* CỘT TRÁI: nút trước — luôn chiếm 44px, không hiện nếu không có nút */}
        <div className="flex w-11 shrink-0 items-center justify-center">
          <motion.button
            type="button"
            disabled={disabled || !canPrev}
            whileTap={disabled || !canPrev ? undefined : tapMotion}
            onClick={(e) => {
              e.stopPropagation();
              if (canPrev) handlePrev();
            }}
            className="sk-touch-manipulation flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-35 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            aria-label="Xem bước ảnh trước"
            aria-disabled={disabled || !canPrev}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </motion.button>
        </div>

        {/* CỘT GIỮA: ảnh tự co flex-1 */}
        <div className="relative min-w-0 flex-1">
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
        </div>

        {/* CỘT PHẢI: nút tiếp theo — luôn chiếm 44px */}
        <div className="flex w-11 shrink-0 items-center justify-center">
          <motion.button
            type="button"
            disabled={disabled || !canNext}
            whileTap={disabled || !canNext ? undefined : tapMotion}
            onClick={(e) => {
              e.stopPropagation();
              if (canNext) handleNext();
            }}
            className="sk-touch-manipulation flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-35 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            aria-label="Sang bước ảnh tiếp theo"
            aria-disabled={disabled || !canNext}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </motion.button>
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
