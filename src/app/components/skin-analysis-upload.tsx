"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { FaceScanCapture, type FaceFrameNavArrows } from "@/app/components/face-scan-capture";
import { uploadSkinImageAction } from "@/actions/upload-skin-image";
import { cn } from "@/lib/utils";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Không đọc được file"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Không đọc được file"));
    reader.readAsDataURL(file);
  });
}

export type SkinAnalysisTriplet = { front: string; left: string; right: string };

const STEPS_VI = [
  { title: "Mặt trước", hint: "Nhìn thẳng camera, đủ sáng, cả khuôn mặt." },
  { title: "Góc trái", hint: "Quay ~45° để lộ má trái của bạn." },
  { title: "Góc phải", hint: "Quay ~45° để lộ má phải của bạn." },
] as const;

const STEP_PROGRESS_LABELS = [
  "Ảnh 1/3: Mặt trước (bắt buộc)",
  "Ảnh 2/3: Góc trái (bắt buộc)",
  "Ảnh 3/3: Góc phải (bắt buộc)",
] as const;

const FRONT_REQUIRED_MSG = "Cần chụp ảnh mặt trước để tiếp tục.";

type Props = {
  disabled?: boolean;
  onComplete: (urls: SkinAnalysisTriplet) => void;
  onFrontImageChange?: (url: string | null) => void;
  className?: string;
};

export const SkinAnalysisUpload = memo(function SkinAnalysisUpload({
  disabled,
  onComplete,
  onFrontImageChange,
  className,
}: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [leftImage, setLeftImage] = useState<string | null>(null);
  const [rightImage, setRightImage] = useState<string | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [leftPreview, setLeftPreview] = useState<string | null>(null);
  const [rightPreview, setRightPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const stepIdxRef = useRef(stepIdx);
  useEffect(() => {
    stepIdxRef.current = stepIdx;
  }, [stepIdx]);

  useEffect(() => {
    onFrontImageChange?.(frontImage);
  }, [frontImage, onFrontImageChange]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const uploadInFlightRef = useRef(false);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("scope", "face-scan");
    const up = await uploadSkinImageAction(fd);
    if (!up.ok) {
      setMsg(up.error);
      return null;
    }
    return up.url;
  }, []);

  const onFileReady = useCallback(
    async (file: File) => {
      if (disabled || uploadInFlightRef.current) return;
      uploadInFlightRef.current = true;
      setMsg(null);
      setBusy(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        const currentIdx = stepIdxRef.current;
        if (currentIdx === 0) setFrontPreview(dataUrl);
        else if (currentIdx === 1) setLeftPreview(dataUrl);
        else setRightPreview(dataUrl);
        const url = await uploadFile(file);
        if (!url) return;
        if (currentIdx === 0) setFrontImage(url);
        else if (currentIdx === 1) setLeftImage(url);
        else setRightImage(url);
      } finally {
        uploadInFlightRef.current = false;
        setBusy(false);
      }
    },
    [disabled, uploadFile],
  );

  const clearCurrentSlot = useCallback(() => {
    if (stepIdx === 0) {
      setFrontImage(null);
      setFrontPreview(null);
    } else if (stepIdx === 1) {
      setLeftImage(null);
      setLeftPreview(null);
    } else {
      setRightImage(null);
      setRightPreview(null);
    }
  }, [stepIdx]);

  const handleStart = () => {
    if (!frontImage?.trim()) {
      setMsg(FRONT_REQUIRED_MSG);
      return;
    }
    if (!leftImage || !rightImage) return;
    setMsg(null);
    onCompleteRef.current({ front: frontImage, left: leftImage, right: rightImage });
  };

  const reset = () => {
    setStepIdx(0);
    setFrontImage(null);
    setLeftImage(null);
    setRightImage(null);
    setFrontPreview(null);
    setLeftPreview(null);
    setRightPreview(null);
    setMsg(null);
    onFrontImageChange?.(null);
  };

  const committedForStep =
    stepIdx === 0 ? frontImage : stepIdx === 1 ? leftImage : rightImage;
  const previewForStep =
    stepIdx === 0 ? frontPreview : stepIdx === 1 ? leftPreview : rightPreview;

  const hasFront = !!frontImage;
  const hasLeft = !!leftImage;
  const hasRight = !!rightImage;
  const navArrows: FaceFrameNavArrows = (() => {
    if (stepIdx === 0) {
      return {
        showLeft: false,
        showRight: hasFront,
        onPrev: () => {},
        onNext: () => setStepIdx(1),
      };
    }
    if (stepIdx === 1) {
      return {
        showLeft: true,
        showRight: hasLeft,
        onPrev: () => setStepIdx(0),
        onNext: () => setStepIdx(2),
      };
    }
    return {
      showLeft: true,
      showRight: false,
      onPrev: () => setStepIdx(1),
      onNext: () => {},
    };
  })();

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => {
          const filled =
            i === 0 ? frontImage != null : i === 1 ? leftImage != null : rightImage != null;
          const active = stepIdx === i;
          return (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                filled ? "bg-violet-500" : active ? "bg-violet-400/80" : "bg-slate-200 dark:bg-zinc-700",
              )}
            />
          );
        })}
      </div>

      <p className="text-xs font-medium text-violet-800 dark:text-violet-200">{STEP_PROGRESS_LABELS[stepIdx]}</p>
      <p className="text-xs text-slate-600 dark:text-zinc-400">{STEPS_VI[stepIdx].hint}</p>

      <FaceScanCapture
        onFileReady={onFileReady}
        committedImageUrl={committedForStep}
        previewSrc={previewForStep}
        onClearCommitted={clearCurrentSlot}
        disabled={disabled || busy}
        showScanLine={busy}
        navArrows={navArrows}

      />

      <button
        type="button"
        disabled={!hasFront || !hasLeft || !hasRight}
        onClick={handleStart}
        className="sk-touch-manipulation w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-violet-500 disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
      >
        Bắt đầu phân tích
      </button>

      {msg ? (
        <p
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100"
          role="alert"
        >
          {msg}
        </p>
      ) : null}

      {frontImage ? (
        <button
          type="button"
          onClick={reset}
          className="sk-touch-manipulation text-xs font-medium text-slate-500 underline-offset-2 hover:underline dark:text-zinc-500"
        >
          Chụp lại từ đầu
        </button>
      ) : null}
    </div>
  );
});

SkinAnalysisUpload.displayName = "SkinAnalysisUpload";
