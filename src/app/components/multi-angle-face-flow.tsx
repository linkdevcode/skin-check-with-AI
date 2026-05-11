"use client";

import { memo, useCallback, useState } from "react";
import { Check, ChevronRight, Info } from "lucide-react";
import { FaceScanCapture } from "@/app/components/face-scan-capture";
import { uploadSkinImageAction } from "@/actions/upload-skin-image";
import { cn } from "@/lib/utils";

export type CapturedTriplet = {
  front: string;
  left?: string | null;
  right?: string | null;
};

const KEYS = ["front", "left", "right"] as const;

const STEPS_VI = [
  { title: "Mặt trước", hint: "Nhìn thẳng camera, đủ sáng, cả khuôn mặt." },
  { title: "Góc trái", hint: "Quay ~45° để lộ má trái của bạn (bên trái khuôn mặt khi nhìn vào gương)." },
  { title: "Góc phải", hint: "Quay ~45° để lộ má phải của bạn." },
] as const;

type Props = {
  minAngles: 1 | 3;
  scope: "face-scan" | "skin-diary";
  disabled?: boolean;
  onComplete: (urls: CapturedTriplet) => void;
  className?: string;
};

export const MultiAngleFaceFlow = memo(function MultiAngleFaceFlow({
  minAngles,
  scope,
  disabled,
  onComplete,
  className,
}: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [urls, setUrls] = useState<{ front: string | null; left: string | null; right: string | null }>({
    front: null,
    left: null,
    right: null,
  });
  /** Sau ảnh trước với minAngles=1: chờ user chọn có thêm góc hay không */
  const [optionalChoice, setOptionalChoice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("scope", scope);
    const up = await uploadSkinImageAction(fd);
    if (!up.ok) {
      setMsg(up.error);
      return null;
    }
    return up.url;
  }, [scope]);

  const onFileReady = useCallback(
    async (file: File) => {
      if (disabled || busy) return;
      setMsg(null);
      setBusy(true);
      try {
        const url = await uploadFile(file);
        if (!url) return;
        const key = KEYS[stepIdx];

        if (minAngles === 3) {
          if (key === "right") {
            setUrls((prev) => {
              const next = { ...prev, right: url };
              queueMicrotask(() =>
                onComplete({
                  front: next.front!,
                  left: next.left!,
                  right: next.right!,
                }),
              );
              return next;
            });
          } else {
            setUrls((prev) => ({ ...prev, [key]: url }));
            setStepIdx((s) => s + 1);
          }
          return;
        }

        // minAngles === 1
        if (key === "front") {
          setUrls((prev) => ({ ...prev, front: url }));
          setOptionalChoice(true);
        } else if (key === "left") {
          setUrls((prev) => ({ ...prev, left: url }));
          setStepIdx(2);
        } else {
          setUrls((prev) => {
            const next = { ...prev, right: url };
            queueMicrotask(() =>
              onComplete({
                front: next.front!,
                left: next.left ?? null,
                right: next.right!,
              }),
            );
            return next;
          });
        }
      } finally {
        setBusy(false);
      }
    },
    [disabled, busy, stepIdx, minAngles, onComplete, uploadFile],
  );

  const finishFrontOnly = () => {
    if (!urls.front) return;
    onComplete({ front: urls.front, left: null, right: null });
  };

  const startOptionalSides = () => {
    setOptionalChoice(false);
    setStepIdx(1);
  };

  const reset = () => {
    setStepIdx(0);
    setUrls({ front: null, left: null, right: null });
    setOptionalChoice(false);
    setMsg(null);
  };

  const showCapture = !optionalChoice && (minAngles === 3 || stepIdx === 0 || stepIdx >= 1);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => {
          const filled = urls[KEYS[i]] != null;
          const active = !optionalChoice && stepIdx === i;
          return (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                filled ? "bg-teal-500" : active ? "bg-teal-400/80" : "bg-slate-200 dark:bg-zinc-700",
              )}
            />
          );
        })}
      </div>

      {minAngles === 1 && stepIdx === 0 && !optionalChoice ? (
        <p className="text-xs font-medium text-teal-800 dark:text-teal-200">Bước 1 — Ảnh mặt trước (bắt buộc)</p>
      ) : null}
      {minAngles === 3 ? (
        <p className="text-xs font-medium text-violet-800 dark:text-violet-200">
          Bước {stepIdx + 1}/3 — {STEPS_VI[stepIdx].title}
        </p>
      ) : null}
      {(minAngles === 3 || (minAngles === 1 && stepIdx > 0 && !optionalChoice)) && STEPS_VI[stepIdx] ? (
        <p className="text-xs text-slate-600 dark:text-zinc-400">{STEPS_VI[stepIdx].hint}</p>
      ) : null}

      {optionalChoice && minAngles === 1 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 dark:border-amber-900/50 dark:bg-amber-950/35">
          <div className="flex gap-2 text-xs text-amber-950 dark:text-amber-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Thêm góc trái &amp; phải giúp AI đánh giá đều hai bên mặt, nhưng <strong>phân tích sẽ lâu hơn</strong> (gọi
              nhiều ảnh hơn).
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={finishFrontOnly}
              className="sk-touch-manipulation inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
            >
              <Check className="h-4 w-4" aria-hidden />
              Chỉ dùng ảnh trước
            </button>
            <button
              type="button"
              onClick={startOptionalSides}
              className="sk-touch-manipulation inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500"
            >
              Thêm góc trái &amp; phải
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      {showCapture ? (
        <FaceScanCapture
          key={`${stepIdx}-${urls[KEYS[stepIdx]] ?? "x"}`}
          onFileReady={onFileReady}
          disabled={disabled || busy}
          showScanLine={busy}
        />
      ) : null}

      {msg ? (
        <p
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100"
          role="alert"
        >
          {msg}
        </p>
      ) : null}

      {urls.front ? (
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

MultiAngleFaceFlow.displayName = "MultiAngleFaceFlow";
