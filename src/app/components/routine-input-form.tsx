"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Droplets,
  Sun,
  Moon,
  Layers2,
  Shield,
  type LucideIcon,
} from "lucide-react";
import {
  RoutineProductLists,
  rowsFromStrings,
  stringsFromRows,
  type ProductRow,
} from "./routine-product-lists";
import { AiProcessingOverlay } from "./ai-processing-overlay";
import { PageBackBar } from "./page-back-bar";
import { analyzeRoutine } from "@/actions/analyze-routine";
import { extractRoutineProductsAction } from "@/actions/extract-routine-products";
import { formatRoutineForAnalysis } from "@/lib/routine-format";
import { saveRoutineResult } from "@/lib/routine-result-storage";
import {
  hashRoutineAnalyzeInputs,
  readRoutineAnalysisLocalCache,
  writeRoutineAnalysisLocalCache,
} from "@/lib/routine-analysis-client-cache";
import type { SkinTypeInput } from "@/types/routine-analysis";
import { cn } from "@/lib/utils";
import { InteractiveCard, MotionReveal, VibeButton, triggerHaptic } from "@/components/ui";
import { useCoarsePointerOrNarrow } from "@/components/ui/use-coarse-pointer";
import { springSoft, tweenLayout, tweenTabIconBounce, tweenTap } from "@/components/ui/motion-spring";

function isTransientAiCode(code?: string): boolean {
  return code === "RATE_LIMIT" || code === "UNAVAILABLE";
}

const SKIN_OPTIONS: { id: SkinTypeInput; label: string; Icon: LucideIcon }[] = [
  { id: "OILY", label: "Dầu", Icon: Droplets },
  { id: "DRY", label: "Khô", Icon: Sun },
  { id: "COMBINATION", label: "Hỗn hợp", Icon: Layers2 },
  { id: "SENSITIVE", label: "Nhạy cảm", Icon: Shield },
];

/** Tabs sáng/tối — chỉ hiển thị dưới 640px; pill layoutId + icon nảy */
function RoutineAmPmTabs({
  active,
  onChange,
  disabled,
}: {
  active: "am" | "pm";
  onChange: (t: "am" | "pm") => void;
  disabled?: boolean;
}) {
  const coarse = useCoarsePointerOrNarrow();
  const pillTransition = useMemo(() => (coarse ? tweenLayout : springSoft), [coarse]);

  const tabs = [
    { id: "am" as const, label: "Buổi sáng (AM)", Icon: Sun },
    { id: "pm" as const, label: "Buổi tối (PM)", Icon: Moon },
  ];
  return (
    <div
      className="relative mb-3 flex gap-1 rounded-2xl border border-slate-200/90 bg-slate-100/80 p-1 dark:border-zinc-700 dark:bg-zinc-900/60 sm:hidden"
      role="tablist"
      aria-label="Chọn buổi sáng hoặc tối"
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        const Icon = t.Icon;
        return (
          <motion.button
            key={t.id}
            type="button"
            layout={false}
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            transition={tweenTap}
            onClick={() => {
              if (!disabled) {
                triggerHaptic(10);
                onChange(t.id);
              }
            }}
            className={cn(
              "sk-touch-manipulation relative min-h-11 flex-1 overflow-hidden rounded-xl px-2 py-2.5 text-center text-sm font-semibold transition-colors",
              isActive ? "text-teal-900 dark:text-teal-50" : "text-slate-600 dark:text-zinc-400",
              "disabled:opacity-50",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="routine-am-pm-pill"
                className="sk-will-change-transform absolute inset-0 rounded-xl bg-white shadow-sm shadow-teal-900/10 ring-1 ring-teal-500/35 dark:bg-[#1a222c] dark:ring-teal-500/40"
                transition={pillTransition}
              />
            ) : null}
            <motion.span
              className={cn(
                "relative z-10 inline-flex items-center justify-center gap-1.5",
                isActive && "sk-will-change-transform",
              )}
              initial={false}
              animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={isActive ? tweenTabIconBounce : { type: "tween", duration: 0.12, ease: "easeOut" }}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="leading-tight">{t.label}</span>
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function RoutineInputForm() {
  const router = useRouter();
  const { status } = useSession();

  const [amText, setAmText] = useState("");
  const [pmText, setPmText] = useState("");
  const [mobileRoutineTab, setMobileRoutineTab] = useState<"am" | "pm">("am");

  const [morningRows, setMorningRows] = useState<ProductRow[]>([]);
  const [eveningRows, setEveningRows] = useState<ProductRow[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [lockedSnapshot, setLockedSnapshot] = useState<{ am: string; pm: string } | null>(null);

  const [skinType, setSkinType] = useState<SkinTypeInput>("COMBINATION");
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewErrorCode, setReviewErrorCode] = useState<string | undefined>();

  useEffect(() => {
    if (!reviewed || !lockedSnapshot) return;
    if (amText !== lockedSnapshot.am || pmText !== lockedSnapshot.pm) {
      setReviewed(false);
      setLockedSnapshot(null);
      setMorningRows([]);
      setEveningRows([]);
    }
  }, [amText, pmText, reviewed, lockedSnapshot]);

  const totalProducts =
    stringsFromRows(morningRows).length + stringsFromRows(eveningRows).length;
  const rawHasContent = Boolean(amText.trim() || pmText.trim());
  const busy = reviewing || loading;
  const overlayOpen = reviewing || loading;
  const overlayPhase = reviewing ? "review" : "analyze";

  const runReview = useCallback(async () => {
    if (!rawHasContent) return;
    setReviewing(true);
    setReviewError(null);
    setReviewErrorCode(undefined);
    setError(null);
    try {
      const res = await extractRoutineProductsAction(amText, pmText);
      if (!res.ok) {
        setReviewError(res.error);
        setReviewErrorCode(res.code);
        return;
      }
      setMorningRows(rowsFromStrings(res.morning));
      setEveningRows(rowsFromStrings(res.evening));
      setReviewed(true);
      setLockedSnapshot({ am: amText, pm: pmText });
    } catch {
      setReviewError("Không rà soát được. Kiểm tra kết nối và thử lại.");
    } finally {
      setReviewing(false);
    }
  }, [amText, pmText, rawHasContent]);

  const analyze = useCallback(async () => {
    if (!reviewed) return;
    const amList = stringsFromRows(morningRows);
    const pmList = stringsFromRows(eveningRows);
    if (!amList.length && !pmList.length) return;

    const routineText = formatRoutineForAnalysis(amList, pmList);
    const hash = hashRoutineAnalyzeInputs(routineText, skinType);

    setLoading(true);
    setError(null);
    setErrorCode(undefined);

    const cached = readRoutineAnalysisLocalCache(hash);
    if (cached) {
      try {
        const persistMessage =
          status === "authenticated"
            ? "Routine không đổi — hiển thị kết quả đã phân tích gần đây (không gọi lại AI)."
            : null;
        const guestNoSaveHint = status !== "authenticated";
        saveRoutineResult({
          score: cached.score,
          conflicts: cached.conflicts,
          markdown: cached.recommendations,
          acneSafety: cached.acneSafety,
          persistMessage,
          guestNoSaveHint,
        });
        router.push("/routine/ket-qua");
      } catch {
        setError("Không thể hoàn tất phân tích. Kiểm tra kết nối và thử lại.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await analyzeRoutine(routineText, skinType);
      if (!res.ok) {
        setError(res.error);
        setErrorCode(res.code);
        return;
      }

      let persistMessage: string | null = null;
      let guestNoSaveHint = false;
      if (res.saved) {
        persistMessage = "Đã lưu kết quả vào lịch sử phân tích.";
      } else if (status === "authenticated") {
        persistMessage =
          "Không thể lưu lịch sử (database). Kết quả phân tích vẫn hiển thị bên dưới.";
      } else {
        guestNoSaveHint = true;
      }

      writeRoutineAnalysisLocalCache({
        v: 1,
        hash,
        score: res.score,
        conflicts: res.conflicts,
        recommendations: res.recommendations,
        acneSafety: res.acneSafety,
      });

      saveRoutineResult({
        score: res.score,
        conflicts: res.conflicts,
        markdown: res.recommendations,
        acneSafety: res.acneSafety,
        persistMessage,
        guestNoSaveHint,
      });
      router.push("/routine/ket-qua");
    } catch {
      setError("Không thể hoàn tất phân tích. Kiểm tra kết nối và thử lại.");
    } finally {
      setLoading(false);
    }
  }, [reviewed, morningRows, eveningRows, skinType, status, router]);

  // Plus Jakarta Sans (body) + monospace chỉ khi cần — dùng sans cho toàn form
  const taClass = cn(
    "sk-input-focus-ring min-h-[140px] w-full resize-y rounded-xl border px-3 py-3 font-sans text-sm leading-relaxed",
    "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
    "shadow-inner outline-none transition-[border-color,box-shadow] duration-200",
    "dark:border-slate-700 dark:bg-[#141820] dark:text-slate-100 dark:placeholder:text-slate-600",
    "disabled:cursor-not-allowed disabled:opacity-60",
  );

  return (
    <>
      <AiProcessingOverlay open={overlayOpen} phase={overlayPhase} showSlowSystemMessage={overlayOpen} />

      <div
        className={cn(
          "font-sans min-h-[calc(100svh-3rem)] bg-slate-50 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          "pt-[max(0.35rem,env(safe-area-inset-top))] dark:bg-[#0b0e14]",
        )}
      >
        <div className="mx-auto w-full max-w-lg px-4 pb-8 pt-1 sm:max-w-xl sm:px-6 lg:max-w-3xl lg:px-8">
          <PageBackBar href="/">Về trang chủ</PageBackBar>

          <section
            className="space-y-5 pt-1 scroll-mt-16 sm:scroll-mt-20"
            aria-labelledby="routine-main-title"
          >
            <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-3 text-sm text-amber-950 dark:border-amber-900/55 dark:bg-amber-950/40 dark:text-amber-50">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <div className="space-y-1.5 leading-snug">
                <p className="font-semibold">Đăng nhập để lưu kết quả và xem lại trên mọi thiết bị.</p>
              </div>
            </div>
            <header className="mb-1">
              <h1
                id="routine-main-title"
                className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-white"
              >
                Nhập routine
              </h1>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-teal-700 dark:text-teal-500/90">
                Dán quy trình của bạn
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Nhập buổi sáng / tối → <strong className="font-medium text-slate-800 dark:text-slate-200">Rà soát</strong>{" "}
                để AI tách sản phẩm → chỉnh danh sách →{" "}
                <strong className="font-medium text-slate-800 dark:text-slate-200">Phân tích</strong>.
              </p>
            </header>

            <div aria-labelledby="skin-type-label">
              <p id="skin-type-label" className="mb-3 block text-sm font-medium text-slate-800 dark:text-zinc-300">
                Loại da của bạn
              </p>
              <div
                className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:max-w-3xl"
                role="group"
                aria-labelledby="skin-type-label"
              >
                {SKIN_OPTIONS.map((opt) => {
                  const selected = skinType === opt.id;
                  const Icon = opt.Icon;
                  return (
                    <InteractiveCard
                      key={opt.id}
                      selected={selected}
                      disabled={busy}
                      onClick={() => setSkinType(opt.id)}
                      decoration={
                        <Icon
                          className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 text-teal-600/15 dark:text-teal-400/15"
                          strokeWidth={1.25}
                          aria-hidden
                        />
                      }
                    >
                      {opt.label}
                    </InteractiveCard>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <span id="routine-label" className="sr-only">
                Routine của bạn
              </span>

              <RoutineAmPmTabs
                active={mobileRoutineTab}
                onChange={setMobileRoutineTab}
                disabled={busy}
              />

              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:items-start">
                <div
                  className={cn(
                    "min-w-0",
                    mobileRoutineTab !== "am" && "max-sm:hidden",
                  )}
                >
                  <label
                    htmlFor="routine-am"
                    className="mb-1.5 hidden text-xs font-medium text-slate-500 sm:block dark:text-zinc-500"
                  >
                    Buổi sáng (AM)
                  </label>
                  <textarea
                    id="routine-am"
                    value={amText}
                    onChange={(e) => setAmText(e.target.value)}
                    disabled={busy}
                    placeholder={`Ví dụ:
sữa rửa → Vitamin C → kem dưỡng → kem chống nắng`}
                    rows={5}
                    className={cn(taClass, "min-h-[160px] sm:min-h-[132px] lg:min-h-[168px]")}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div
                  className={cn(
                    "min-w-0",
                    mobileRoutineTab !== "pm" && "max-sm:hidden",
                  )}
                >
                  <label
                    htmlFor="routine-pm"
                    className="mb-1.5 hidden text-xs font-medium text-slate-500 sm:block dark:text-zinc-500"
                  >
                    Buổi tối (PM)
                  </label>
                  <textarea
                    id="routine-pm"
                    value={pmText}
                    onChange={(e) => setPmText(e.target.value)}
                    disabled={busy}
                    placeholder={`Ví dụ:
tẩy trang → BHA → Retinol → kem dưỡng`}
                    rows={5}
                    className={cn(taClass, "min-h-[160px] sm:min-h-[132px] lg:min-h-[168px]")}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              <VibeButton
                type="button"
                onClick={() => void runReview()}
                disabled={busy || !rawHasContent}
              >
                {reviewing ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                )}
                Rà soát — tách sản phẩm bằng AI
              </VibeButton>

              {reviewError ? (
                <p
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    isTransientAiCode(reviewErrorCode)
                      ? "border-teal-200/90 bg-teal-50/90 text-teal-950 dark:border-teal-800/60 dark:bg-teal-950/35 dark:text-teal-100"
                      : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200",
                  )}
                  role="alert"
                >
                  {reviewError}
                </p>
              ) : null}
            </div>

            <MotionReveal
              show={reviewed}
              className="space-y-3 border-t border-slate-200 pt-5 dark:border-zinc-800/80"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                Danh sách chỉnh sửa
              </p>
              <RoutineProductLists
                morningRows={morningRows}
                eveningRows={eveningRows}
                onMorningChange={setMorningRows}
                onEveningChange={setEveningRows}
                disabled={busy}
              />
              {totalProducts === 0 ? (
                <p className="text-sm text-amber-800 dark:text-amber-200/90">Thêm ít nhất một bước để phân tích.</p>
              ) : null}

              <VibeButton
                type="button"
                className="min-h-14 text-base shadow-lg shadow-teal-900/25"
                onClick={() => void analyze()}
                disabled={busy || !reviewed || totalProducts === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                    Đang phân tích…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
                    AI phân tích ngay
                  </>
                )}
              </VibeButton>
            </MotionReveal>

            {!reviewed && !error ? (
              <p className="mt-2 text-center text-xs text-slate-500 dark:text-zinc-600">
                Sau khi Rà soát, bạn có thể thêm / xóa / sửa từng dòng trước khi phân tích.
              </p>
            ) : null}

            {error ? (
              <div
                className={cn(
                  "mt-4 flex gap-3 rounded-2xl border px-4 py-3 text-sm ring-1",
                  isTransientAiCode(errorCode)
                    ? "border-teal-200/90 bg-teal-50/90 text-teal-950 ring-teal-200/70 dark:border-teal-800/55 dark:bg-teal-950/40 dark:text-teal-50 dark:ring-teal-800/50"
                    : "border-red-200 bg-red-50 text-red-900 ring-red-200/80 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-500/20",
                )}
                role="alert"
              >
                <AlertCircle
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    isTransientAiCode(errorCode)
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                  aria-hidden
                />
                <p>{error}</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}
