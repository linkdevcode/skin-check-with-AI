"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Loader2, Sparkles, Wallet } from "lucide-react";
import { SkinAnalysisUpload, type SkinAnalysisTriplet } from "@/app/components/skin-analysis-upload";
import { toastServerActionFailure } from "@/lib/ai/toast-action-error";
import { isAiStructuredActionError } from "@/lib/ai/structured-errors";
import { RoutineBudgetDashboard } from "@/app/components/routine-budget-dashboard";
import {
  BudgetRoutineResultView,
  ThreeTierRoutineResultView,
} from "@/app/components/routine-suggestion-display";
import {
  analyzeFaceRoutineAction,
  generateAndSaveRoutineAction,
} from "@/actions/face-routine-budget";
import type { FaceRoutineAnalysis, SavedRoutineGenResult } from "@/types/face-routine-budget";
import { cn } from "@/lib/utils";
import { GhostButton, StepTransition, VibeButton, VibeLink, triggerHaptic } from "@/components/ui";

type Step = "capture" | "processing" | "scores" | "pick" | "generating" | "done";

function parseVndInput(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

type WizardProps = {
  /** false = phiên khách: ẩn nút mở lịch sử gợi ý ở bước hoàn tất */
  isLoggedIn: boolean;
};

export function FaceRoutineWizard({ isLoggedIn }: WizardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("capture");
  const [msg, setMsg] = useState<string | null>(null);
  const [angleUrls, setAngleUrls] = useState<{ front: string; left: string; right: string } | null>(null);
  const [face, setFace] = useState<FaceRoutineAnalysis | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [routine, setRoutine] = useState<SavedRoutineGenResult | null>(null);
  const [captureKey, setCaptureKey] = useState(0);
  /** Ảnh mặt trước cho luồng chấm điểm / routine ngân sách (tách biệt nhật ký da). */
  const [analysisFrontImage, setAnalysisFrontImage] = useState<string | null>(null);

  const runAnalyzeTriple = useCallback(async (tri: SkinAnalysisTriplet) => {
    if (!tri.front?.trim()) {
      setMsg("Cần chụp ảnh mặt trước để tiếp tục.");
      return;
    }
    if (!tri.left?.trim() || !tri.right?.trim()) return;
    setMsg(null);
    setStep("processing");
    const an = await analyzeFaceRoutineAction(tri.front, tri.left, tri.right);
    if (!an.ok) {
      toastServerActionFailure(an);
      setMsg(isAiStructuredActionError(an) ? an.message : an.error);
      setStep("capture");
      setCaptureKey((k) => k + 1);
      return;
    }
    setAngleUrls({ front: tri.front, left: tri.left, right: tri.right });
    setFace(an.data);
    setStep("scores");
  }, []);

  const onAnglesComplete = (tri: SkinAnalysisTriplet) => {
    startTransition(() => {
      void runAnalyzeTriple(tri);
    });
  };

  const onBudgetSubmit = () => {
    if (!angleUrls || !face) return;
    const vnd = parseVndInput(budgetInput);
    if (vnd == null) {
      setMsg("Nhập số tiền (VND), ví dụ 1500000.");
      return;
    }
    setMsg(null);
    setStep("generating");
    startTransition(async () => {
      const r = await generateAndSaveRoutineAction({
        imageUrlFront: angleUrls.front,
        imageUrlLeft: angleUrls.left,
        imageUrlRight: angleUrls.right,
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
    if (!angleUrls || !face) return;
    setMsg(null);
    setStep("generating");
    startTransition(async () => {
      const r = await generateAndSaveRoutineAction({
        imageUrlFront: angleUrls.front,
        imageUrlLeft: angleUrls.left,
        imageUrlRight: angleUrls.right,
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
    setAngleUrls(null);
    setFace(null);
    setBudgetInput("");
    setSavedId(null);
    setRoutine(null);
    setAnalysisFrontImage(null);
    setCaptureKey((k) => k + 1);
  };

  const busy = pending || step === "processing" || step === "generating";
  const flowKey = face ? `post-${step}` : "pre";

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
            {step === "processing" ? "Đang phân tích AI (3 góc)…" : "Đang phân tích và tạo gợi ý routine…"}
          </p>
        </div>
      ) : null}

      {msg ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
          {msg}
        </div>
      ) : null}

      <StepTransition stepKey={flowKey} className="space-y-6">
        {!face ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/90">
            <span className="sr-only">
              {analysisFrontImage ? "Đã có ảnh mặt trước cho phân tích." : "Chưa có ảnh mặt trước."}
            </span>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Phân tích da — cần đủ 3 ảnh (mặt trước, góc trái, góc phải)
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
              Tải ảnh theo từng bước bằng mũi tên. Khi đủ 3 ảnh, bấm «Bắt đầu phân tích».
            </p>
            <SkinAnalysisUpload
              key={captureKey}
              className="mt-4"
              disabled={busy}
              onFrontImageChange={setAnalysisFrontImage}
              onComplete={onAnglesComplete}
            />
          </section>
        ) : (
          <>
            <div className="flex justify-end">
              {step !== "generating" && step !== "done" ? (
                <GhostButton
                  type="button"
                  onClick={reset}
                  className="min-h-9 border-0 bg-transparent px-2 py-1 text-xs font-medium text-slate-500 shadow-none hover:bg-slate-100/80 hover:text-slate-800 hover:underline dark:text-zinc-500 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-300"
                >
                  Phân tích ảnh khác
                </GhostButton>
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
                      className="sk-input-focus-ring mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm tabular-nums outline-none transition-[border-color,box-shadow] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                    <VibeButton
                      className="mt-3 min-h-11 rounded-xl from-teal-600 via-teal-600 to-teal-500 shadow-md"
                      disabled={busy}
                      onClick={onBudgetSubmit}
                    >
                      Tạo routine theo ngân sách
                    </VibeButton>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400" aria-hidden />
                      B. Tự động — 3 gói gợi ý
                    </div>
                    <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
                      Tiết kiệm · Hiệu quả · Cao cấp (mức giá khác nhau).
                    </p>
                    <GhostButton
                      type="button"
                      disabled={busy}
                      onClick={onAutoTiers}
                      className={cn(
                        "mt-3 w-full min-h-11 rounded-xl border-2 border-teal-600 bg-transparent font-semibold text-teal-800",
                        "hover:bg-teal-50 dark:border-teal-500 dark:text-teal-200 dark:hover:bg-teal-950/40",
                      )}
                    >
                      Tạo 3 gói
                    </GhostButton>
                  </div>
                </div>
              </section>
            )}

            {step === "scores" && (
              <VibeButton
                pulse={false}
                className={cn(
                  "min-h-12 rounded-xl from-slate-900 via-slate-900 to-slate-800 shadow-lg shadow-black/20",
                  "dark:from-teal-600 dark:via-teal-600 dark:to-teal-500 dark:shadow-teal-900/30",
                )}
                type="button"
                onClick={() => setStep("pick")}
              >
                Tiếp tục — gợi ý routine
              </VibeButton>
            )}

            {step === "done" && routine && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/90">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Gợi ý đã lưu</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                  {isLoggedIn
                    ? "Bạn có thể xem lại trong mục lịch sử gợi ý."
                    : "Đăng nhập để xem lịch sử gợi ý trên mọi thiết bị."}
                </p>
                <div className="mt-4">
                  {routine.kind === "BUDGET" ? (
                    <BudgetRoutineResultView pkg={routine.package} />
                  ) : (
                    <ThreeTierRoutineResultView tiers={routine.tiers} />
                  )}
                </div>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  {isLoggedIn && savedId ? (
                    <VibeLink href={`/routine-ngan-sach/${savedId}`} className="flex-1">
                      Mở chi tiết đã lưu
                    </VibeLink>
                  ) : null}
                  {isLoggedIn ? (
                    <Link
                      href="/routine-ngan-sach/lich-su"
                      onPointerDown={() => triggerHaptic(10)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800/60"
                    >
                      Lịch sử gợi ý
                    </Link>
                  ) : null}
                  <GhostButton type="button" onClick={reset} className="min-h-11 flex-1">
                    Phân tích mới
                  </GhostButton>
                </div>
              </section>
            )}
          </>
        )}
      </StepTransition>
    </div>
  );
}
