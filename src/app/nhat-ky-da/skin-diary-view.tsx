"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { tweenEnter, tweenExit, tweenTap } from "@/components/ui/motion-spring";
import { triggerHaptic } from "@/components/ui";
import { SkinDiaryUpload, type SkinDiaryUploadResult } from "@/app/components/skin-diary-upload";
import { toastServerActionFailure } from "@/lib/ai/toast-action-error";
import { isAiStructuredActionError } from "@/lib/ai/structured-errors";
import { createSkinDiaryEntryAction } from "@/actions/skin-diary";
import type { SkinEntryListItem } from "@/types/skin-diary";
import { aggregateWeeklyImprovement } from "@/lib/skin-diary-chart";
import { SkinImprovementChart } from "@/app/components/skin-improvement-chart";

function dayGroupKey(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

type Props = {
  initialEntries: SkinEntryListItem[];
};

export function SkinDiaryView({ initialEntries }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [flowKey, setFlowKey] = useState(0);
  const diarySubmitLock = useRef(false);
  /** Ảnh mặt trước cho nhật ký (so sánh theo thời gian) — tách khỏi luồng phân tích / chấm điểm. */
  const [diaryFrontImage, setDiaryFrontImage] = useState<string | null>(null);

  const chartData = useMemo(
    () =>
      aggregateWeeklyImprovement(
        initialEntries.map((e) => ({
          createdAt: new Date(e.createdAt),
          analysisResult: e.analysisResult,
        })),
      ),
    [initialEntries],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, SkinEntryListItem[]>();
    for (const e of initialEntries) {
      const k = dayGroupKey(e.createdAt);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [initialEntries]);

  const busy = submitting || pending;

  const handleDiaryComplete = useCallback(
    (tri: SkinDiaryUploadResult) => {
      if (!tri.front?.trim()) {
        setMsg("Cần chụp ảnh mặt trước để tiếp tục.");
        return;
      }
      if (diarySubmitLock.current) return;
      diarySubmitLock.current = true;
      setMsg(null);
      setSubmitting(true);
      const noteTrim = note.trim();
      startTransition(async () => {
        try {
          const cr = await createSkinDiaryEntryAction({
            imageUrlFront: tri.front,
            imageUrlLeft: tri.left ?? null,
            imageUrlRight: tri.right ?? null,
            userNote: noteTrim || null,
          });
          if (!cr.ok) {
            toastServerActionFailure(cr);
            setMsg(isAiStructuredActionError(cr) ? cr.message : cr.error);
            return;
          }
          setNote("");
          setFlowKey((k) => k + 1);
          router.refresh();
        } finally {
          setSubmitting(false);
          diarySubmitLock.current = false;
        }
      });
    },
    [note, router],
  );

  return (
    <div className="space-y-8 pb-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/90">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Thêm ảnh mới</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
          Ba bước giống phân tích da: mặt trước (bắt buộc), góc trái/phải tuỳ chọn — dùng mũi tên hai bên khung ảnh để
          chuyển bước (có thể bỏ qua góc nghiêng). Bấm «Bắt đầu phân tích» khi đã có ảnh mặt trước.
        </p>
        <label className="mt-3 block text-xs font-medium text-slate-600 dark:text-zinc-400">
          Ghi chú (tuỳ chọn)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: sau tuần dùng BHA…"
          disabled={busy}
          className="sk-input-focus-ring mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-white"
        />
        <div className="relative mt-4">
          <span className="sr-only">
            {diaryFrontImage ? "Đã có ảnh mặt trước để lưu nhật ký." : "Chưa có ảnh mặt trước."}
          </span>
          {busy ? (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/80 backdrop-blur-sm dark:bg-[#0b0e14]/75"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" aria-hidden />
              <p className="px-4 text-center text-xs font-medium text-slate-700 dark:text-zinc-200">Đang phân tích…</p>
            </div>
          ) : null}
          <SkinDiaryUpload
            key={flowKey}
            disabled={busy}
            onFrontImageChange={setDiaryFrontImage}
            onComplete={handleDiaryComplete}
          />
        </div>
        {msg ? (
          <p
            className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
            role="alert"
          >
            {msg}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
          Xu hướng cải thiện
        </h2>
        <SkinImprovementChart data={chartData} />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
          Ảnh theo ngày
        </h2>
        {grouped.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-zinc-500">Chưa có ảnh nào. Thêm ảnh đầu tiên ở trên.</p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([dayLabel, items]) => (
              <div key={dayLabel}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400/90">
                  {dayLabel}
                </p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4" role="list">
                  <AnimatePresence mode="popLayout">
                    {items.map((it, itemIndex) => (
                      <motion.li
                        key={it.id}
                        layout={false}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0, transition: { ...tweenEnter, delay: itemIndex * 0.05 } }}
                        exit={{ opacity: 0, y: -6, transition: tweenExit }}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/60"
                      >
                        <motion.div
                          whileTap={{ scale: 0.99, opacity: 0.95 }}
                          transition={tweenTap}
                          className="sk-will-change-transform relative aspect-square"
                        >
                          <Link
                            href={`/nhat-ky-da/${it.id}`}
                            className="sk-touch-manipulation absolute inset-0 z-[1]"
                            onClick={() => triggerHaptic(10)}
                          >
                            <span className="sr-only">Mở ảnh nhật ký</span>
                          </Link>
                          <Image
                            src={it.imageUrlFront}
                            alt=""
                            fill
                            className="object-cover transition-opacity group-hover:opacity-95"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            loading="lazy"
                          />
                          {it.imageUrlLeft && it.imageUrlRight ? (
                            <span className="pointer-events-none absolute left-1 top-1 z-[2] rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white backdrop-blur-sm">
                              3 góc
                            </span>
                          ) : null}
                          {it.analysisResult.comparedWithEntryId &&
                          it.analysisResult.comparedWithEntryId !== it.id ? (
                            <Link
                              href={`/nhat-ky-da/so-sanh?before=${it.analysisResult.comparedWithEntryId}&after=${it.id}`}
                              className="sk-touch-manipulation absolute bottom-1 right-1 z-[2] rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
                              onClick={() => triggerHaptic(10)}
                            >
                              So sánh
                            </Link>
                          ) : null}
                        </motion.div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
