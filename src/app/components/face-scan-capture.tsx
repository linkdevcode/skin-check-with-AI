"use client";

import { useRef, useState } from "react";
import { ImagePlus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onFileReady: (file: File) => void;
  disabled?: boolean;
  showScanLine?: boolean;
  className?: string;
};

/**
 * Chỉ chọn ảnh qua input (hệ điều hành thường cho phép chụp mới hoặc chọn từ thư viện).
 */
export function FaceScanCapture({ onFileReady, disabled, showScanLine, className }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const clearPreview = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || disabled) return;
    clearPreview();
    const url = URL.createObjectURL(f);
    setPreview(url);
    onFileReady(f);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5 shadow-inner dark:border-zinc-700 dark:bg-black/40">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Xem trước" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-600 dark:text-zinc-400"
          >
            <ImagePlus className="h-10 w-10 opacity-70" aria-hidden />
            Chạm để chọn ảnh
            <span className="text-xs text-slate-500 dark:text-zinc-500">Máy ảnh hoặc thư viện ảnh</span>
          </button>
        )}

        {showScanLine && preview ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="face-scan-sweep" />
          </div>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />

      {preview ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              clearPreview();
              fileInputRef.current?.click();
            }}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5 shrink-0" aria-hidden />
            Chọn ảnh khác
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => clearPreview()}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-800 dark:border-zinc-600 dark:text-white"
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            Bỏ ảnh
          </button>
        </div>
      ) : null}
    </div>
  );
}
