"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles, Loader2, AlertCircle, ListChecks } from "lucide-react";
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
import type { SkinTypeInput } from "@/types/routine-analysis";
import { cn } from "@/lib/utils";

const SKIN_OPTIONS: { id: SkinTypeInput; label: string }[] = [
  { id: "OILY", label: "Dầu" },
  { id: "DRY", label: "Khô" },
  { id: "COMBINATION", label: "Hỗn hợp" },
  { id: "SENSITIVE", label: "Nhạy cảm" },
];

export function RoutineInputForm() {
  const router = useRouter();
  const { status } = useSession();

  const [amText, setAmText] = useState("");
  const [pmText, setPmText] = useState("");

  const [morningRows, setMorningRows] = useState<ProductRow[]>([]);
  const [eveningRows, setEveningRows] = useState<ProductRow[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [lockedSnapshot, setLockedSnapshot] = useState<{ am: string; pm: string } | null>(null);

  const [skinType, setSkinType] = useState<SkinTypeInput>("COMBINATION");
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

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
    setError(null);
    try {
      const res = await extractRoutineProductsAction(amText, pmText);
      if (!res.ok) {
        setReviewError(res.error);
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

    setLoading(true);
    setError(null);

    try {
      const res = await analyzeRoutine(routineText, skinType);
      if (!res.ok) {
        setError(res.error);
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

  const taClass = cn(
    "min-h-[140px] w-full resize-y rounded-xl border px-3 py-3 font-[family-name:var(--font-mono)] text-sm leading-relaxed",
    "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
    "shadow-inner outline-none transition-shadow",
    "focus:border-teal-500/55 focus:ring-2 focus:ring-teal-500/25",
    "dark:border-slate-700 dark:bg-[#141820] dark:text-slate-100 dark:placeholder:text-slate-600",
    "disabled:cursor-not-allowed disabled:opacity-60",
  );

  return (
    <>
      <AiProcessingOverlay open={overlayOpen} phase={overlayPhase} />

      <div
        className={cn(
          "min-h-[calc(100svh-3.5rem)] bg-slate-50 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          "pt-[max(0.35rem,env(safe-area-inset-top))] dark:bg-[#0b0e14]",
        )}
      >
        <div className="mx-auto w-full max-w-lg px-4 pb-8 pt-1 sm:max-w-xl sm:px-6 lg:max-w-3xl lg:px-8">
          <PageBackBar href="/">Về trang chủ</PageBackBar>

          <section
            className="space-y-5 pt-1 scroll-mt-20 sm:scroll-mt-24"
            aria-labelledby="routine-main-title"
          >
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
                className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-3xl"
                role="group"
                aria-labelledby="skin-type-label"
              >
                {SKIN_OPTIONS.map((opt) => {
                  const selected = skinType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSkinType(opt.id)}
                      disabled={busy}
                      className={cn(
                        "min-h-12 rounded-xl border px-2 text-sm font-semibold transition sm:px-3",
                        selected
                          ? "border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-500/35 dark:border-teal-500/70 dark:bg-teal-950/50 dark:text-teal-100 dark:ring-teal-500/40"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-zinc-800 dark:bg-[#1a1f26]/80 dark:text-zinc-300 dark:hover:border-zinc-600",
                        "disabled:opacity-50",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <span id="routine-label" className="sr-only">
                Routine của bạn
              </span>

              <div className="grid gap-4 lg:grid-cols-2 lg:gap-6 lg:items-start">
                <div className="min-w-0">
                  <label htmlFor="routine-am" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-zinc-500">
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
                    className={cn(taClass, "min-h-[132px] lg:min-h-[168px]")}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="routine-pm" className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-zinc-500">
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
                    className={cn(taClass, "min-h-[132px] lg:min-h-[168px]")}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void runReview()}
                disabled={busy || !rawHasContent}
                className={cn(
                  "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition",
                  "border-slate-200 bg-white text-slate-800 hover:border-teal-400/60 hover:bg-slate-50",
                  "dark:border-zinc-700 dark:bg-[#1a1f26] dark:text-zinc-100 dark:hover:border-teal-600/40 dark:hover:bg-[#1f2630]",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                {reviewing ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal-600 dark:text-teal-400" aria-hidden />
                ) : (
                  <ListChecks className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
                )}
                Rà soát — tách sản phẩm bằng AI
              </button>

              {reviewError ? (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-200"
                  role="alert"
                >
                  {reviewError}
                </p>
              ) : null}
            </div>

            {reviewed ? (
              <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-zinc-800/80">
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

                <button
                  type="button"
                  onClick={() => void analyze()}
                  disabled={busy || !reviewed || totalProducts === 0}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold transition active:scale-[0.98]",
                    "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-900/25",
                    "hover:from-teal-400 hover:to-cyan-400",
                    "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
                  )}
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
                </button>
              </div>
            ) : null}

            {!reviewed && !error ? (
              <p className="mt-2 text-center text-xs text-slate-500 dark:text-zinc-600">
                Sau khi Rà soát, bạn có thể thêm / xóa / sửa từng dòng trước khi phân tích.
              </p>
            ) : null}

            {error ? (
              <div
                className="mt-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 ring-1 ring-red-200/80 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-500/20"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                <p>{error}</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}
