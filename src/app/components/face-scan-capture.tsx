"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Webcam from "@/app/components/webcam-bridge";

type WebcamHandle = InstanceType<typeof import("react-webcam").default>;

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

type Props = {
  onFileReady: (file: File) => void;
  disabled?: boolean;
  showScanLine?: boolean;
  className?: string;
};

export function FaceScanCapture({ onFileReady, disabled, showScanLine, className }: Props) {
  const wcRef = useRef<WebcamHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [useCam, setUseCam] = useState(true);
  const [camMounted, setCamMounted] = useState(false);

  useEffect(() => {
    setCamMounted(true);
  }, []);

  const clearPreview = () => {
    setPreview(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || disabled) return;
    setPreview(URL.createObjectURL(f));
    onFileReady(f);
  };

  const capture = useCallback(() => {
    if (disabled) return;
    const shot = wcRef.current?.getScreenshot?.();
    if (!shot) return;
    setPreview(shot);
    onFileReady(dataURLtoFile(shot, `face-${Date.now()}.jpg`));
  }, [disabled, onFileReady]);

  const showLiveCam = useCam && !preview;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            clearPreview();
            setUseCam(true);
          }}
          className={cn(
            "rounded-xl px-3 py-2 text-xs font-semibold transition",
            useCam
              ? "bg-teal-600 text-white"
              : "border border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
          )}
        >
          Camera
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            clearPreview();
            setUseCam(false);
          }}
          className={cn(
            "rounded-xl px-3 py-2 text-xs font-semibold transition",
            !useCam
              ? "bg-teal-600 text-white"
              : "border border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
          )}
        >
          Chọn ảnh
        </button>
      </div>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5 shadow-inner dark:border-zinc-700 dark:bg-black/40">
        {showLiveCam ? (
          camMounted ? (
            <Webcam
              ref={wcRef}
              audio={false}
              mirrored
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={{ facingMode: "user", width: 720, height: 960 }}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-200/80 text-xs text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
              Đang mở camera…
            </div>
          )
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Xem trước" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500 dark:text-zinc-500"
          >
            <ImagePlus className="h-10 w-10 opacity-70" aria-hidden />
            Chạm để chọn ảnh mặt
          </button>
        )}

        {showScanLine && (showLiveCam || preview) ? (
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

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {useCam ? (
          preview ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => clearPreview()}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-800 dark:border-zinc-600 dark:text-white"
            >
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
              Chụp lại
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={capture}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
            >
              <Camera className="h-5 w-5 shrink-0" aria-hidden />
              Chụp ảnh
            </button>
          )
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5 shrink-0" aria-hidden />
            Chọn từ máy
          </button>
        )}
      </div>
    </div>
  );
}
