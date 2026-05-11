"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Loader2, Sparkles, Wallet } from "lucide-react";
import { FaceScanCapture } from "@/app/components/face-scan-capture";
import { RoutineBudgetDashboard } from "@/app/components/routine-budget-dashboard";
import {
  BudgetRoutineResultView,
  ThreeTierRoutineResultView,
} from "@/app/components/routine-suggestion-display";
import { uploadSkinImageAction } from "@/actions/upload-skin-image";
import {
  analyzeFaceRoutineAction,
  generateAndSaveRoutineAction,
} from "@/actions/face-routine-budget";
import type { FaceRoutineAnalysis, SavedRoutineGenResult } from "@/types/face-routine-budget";
import { cn } from "@/lib/utils";

type Step = "capture" | "processing" | "scores" | "pick" | "generating" | "done";

function parseVndInput(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export function FaceRoutineWizard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("capture");
  const [msg, setMsg] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [face, setFace] = useState<FaceRoutineAnalysis | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [routine, setRoutine] = useState<SavedRoutineGenResult | null>(null);

  const runUploadAndAnalyze = useCallback(async (file: File) => {
    setMsg(null);
    setStep("processing");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("scope", "face-scan");
    const up = await uploadSkinImageAction(fd);
    if (!up.ok) {
      setMsg(up.error);
      setStep("capture");
      return;
    }
    setImageUrl(up.url);
    const an = await analyzeFaceRoutineAction(up.url);
    if (!an.ok) {
      setMsg(an.error);
      setStep("capture");
      return;
    }
    setFace(an.data);
    setStep("scores");
  }, []);

  const onFileReady = (file: File) => {
    startTransition(() => {
      void runUploadAndAnalyze(file);
    });
  };

  const onBudgetSubmit = () => {
    if (!imageUrl || !face) return;
    const vnd = parseVndInput(budgetInput);
    if (vnd == null) {
      setMsg("Nhập số tiền (VND), ví dụ 1500000.");
      return;
    }
    setMsg(null);
    setStep("generating");
    startTransition(async () => {
      const r = await generateAndSaveRoutineAction({
        imageUrl,
        faceAnalysis: face,
        mode: "BUDGET",
        budgetVnd: vnd,
      });
      if (!r.ok) {
        setMsg(r.error);
        setStep("pick");
        return;
      }
      setSavedId(r.id);
      setRoutine(r.routine);
      setStep("done");
      router.refresh();
    });
  };

  const onAutoTiers = () => {
    if (!imageUrl || !face) return;
    setMsg(null);
    setStep("generating");
    startTransition(async () => {
      const r = await generateAndSaveRoutineAction({
        imageUrl,
        faceAnalysis: face,
        mode: "AUTO",
      });
      if (!r.ok) {
        setMsg(r.error);
        setStep("pick");
        return;
      }
      setSavedId(r.id);
      setRoutine(r.routine);
      setStep("done");
      router.refresh();
    });
  };

  const reset = () => {
    setStep("capture");
    setMsg(null);
    setImageUrl(null);
    setFace(null);
    setBudgetInput("");
    setSavedId(null);
    setRoutine(null);
  };

  const busy = pending || step === "processing" || step === "generating";

  return (
    <div className="relative space-y-6">
      {busy ? (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-slate-100/85 px-6 backdrop-blur-md dark:bg-[#0b0e14]/88"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400" aria-hidden />
          <p className="text-center text-sm font-medium text-slate-800 dark:text-white">
            {step === "processing" ? "Đang tải ảnh & phân tích AI…" : "Đang tạo gợi ý routine…"}
          </p>
        </div>
      ) : null}

      {msg ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
          {msg}
        </div>
      ) : null}

      {step === "capture" || step === "processing" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/90">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Bước 1 — Chụp / chọn ảnh mặt</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
            Ảnh rõ vùng da mặt, ánh sáng đều. Thanh quét chỉ là hiệu ứng giao diện.
          </p>
          <FaceScanCapture
            className="mt-4"
            onFileReady={onFileReady}
            disabled={busy}
            showScanLine={step === "capture" || step === "processing"}
          />
        </section>
      ) : null}

      {face && (step === "scores" || step === "pick" || step === "generating" || step === "done") ? (
        <>
          <div className="flex justify-end">
            {step !== "generating" && step !== "done" ? (
              <button
                type="button"
                onClick={reset}
                className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                Phân tích ảnh khác
              </button>
            ) : null}
          </div>
          <RoutineBudgetDashboard data={face} />

          {(step === "pick" || step === "generating") && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/90">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Bước 4 — Gợi ý routine</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                Chọn cách lập danh sách sản phẩm (giá tham khảo thị trường VN).
              </p>

              <div className="mt-5 space-y-6">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />
                    A. Tự nhập ngân sách
                  </div>
                  <label htmlFor="budget-vnd" className="mt-2 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Số tiền (VND)
                  </label>
                  <input
                    id="budget-vnd"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Ví dụ: 1500000"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    disabled={busy}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onBudgetSubmit}
                    className="mt-3 flex w-full min-h-11 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
                  >
                    Tạo routine theo ngân sách
                  </button>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400" aria-hidden />
                    B. Tự động — 3 gói gợi ý
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
                    Tiết kiệm · Hiệu quả · Cao cấp (mức giá khác nhau).
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onAutoTiers}
                    className="mt-3 flex w-full min-h-11 items-center justify-center rounded-xl border-2 border-teal-600 bg-transparent px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-50 dark:border-teal-500 dark:text-teal-200 dark:hover:bg-teal-950/40"
                  >
                    Tạo 3 gói
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === "scores" && (
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="flex w-full min-h-12 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              Tiếp tục — gợi ý routine
            </button>
          )}

          {step === "done" && routine && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/90">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Gợi ý đã lưu</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                Bạn có thể xem lại trong mục lịch sử gợi ý.
              </p>
              <div className="mt-4">
                {routine.kind === "BUDGET" ? (
                  <BudgetRoutineResultView pkg={routine.package} />
                ) : (
                  <ThreeTierRoutineResultView tiers={routine.tiers} />
                )}
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                {savedId ? (
                  <Link
                    href={`/routine-ngan-sach/${savedId}`}
                    className={cn(
                      "inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500",
                    )}
                  >
                    Mở chi tiết đã lưu
                  </Link>
                ) : null}
                <Link
                  href="/routine-ngan-sach/lich-su"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-800 dark:border-zinc-600 dark:text-white"
                >
                  Lịch sử gợi ý
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 dark:border-zinc-600 dark:text-zinc-300"
                >
                  Phân tích mới
                </button>
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
