"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Phase = "review" | "analyze";

const LOGS_REVIEW = [
  "Identified: sản phẩm buổi sáng…",
  "Đang tách bước buổi tối…",
  "Scanning product entities…",
];

const LOGS_ANALYZE = [
  "Identified: routine layers…",
  "Scanning for Active Conflicts…",
  "Đánh giá da mụn & barrier…",
  "Tổng hợp lời khuyên…",
];

type Props = {
  open: boolean;
  phase: Phase;
  /** Sau ~2s chờ AI (retry 429) — thông điệp gợi ý, không phải lỗi. */
  showSlowSystemMessage?: boolean;
  className?: string;
};

export function AiProcessingOverlay({ open, phase, showSlowSystemMessage, className }: Props) {
  const [logIdx, setLogIdx] = useState(0);
  const [slowVisible, setSlowVisible] = useState(false);
  const logs = phase === "review" ? LOGS_REVIEW : LOGS_ANALYZE;
  const logLen = logs.length;

  useEffect(() => {
    setLogIdx(0);
  }, [phase, open]);

  useEffect(() => {
    if (!open || !showSlowSystemMessage) {
      setSlowVisible(false);
      return;
    }
    const t = window.setTimeout(() => setSlowVisible(true), 2000);
    return () => clearTimeout(t);
  }, [open, showSlowSystemMessage]);

  useEffect(() => {
    if (!open) {
      setLogIdx(0);
      return;
    }
    const t = window.setInterval(() => {
      setLogIdx((i) => (i + 1) % logLen);
    }, 1400);
    return () => clearInterval(t);
  }, [open, logLen]);

  if (!open) return null;

  const title =
    phase === "review"
      ? 'AI đang "đọc" và tách sản phẩm…'
      : 'AI đang "đọc" routine…';

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center px-6 backdrop-blur-md",
        "bg-slate-100/90 dark:bg-[#0b0e14]/92",
        className,
      )}
      role="alertdialog"
      aria-busy
      aria-label={title}
    >
      <div className="flex h-12 w-12 flex-wrap items-center justify-center gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span
            key={i}
            className="sk-dot h-2 w-2 rounded-full bg-teal-500 dark:bg-cyan-400"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <p className="mt-6 text-center text-base font-medium text-slate-800 dark:text-white">{title}</p>
      {slowVisible ? (
        <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-teal-800/95 dark:text-teal-200/90">
          Hệ thống đang bận một chút, AI sẽ phản hồi trong giây lát…
        </p>
      ) : null}
      <pre
        className="font-mono mt-4 max-w-sm text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400"
      >
        {logs[logIdx]}
      </pre>
    </div>
  );
}
