"use client";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
      <span className="inline-flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-emerald-500/30 border-t-emerald-500" aria-label="Loading" />
      <p className="text-sm font-semibold text-emerald-600">Đang tải...</p>
    </div>
  );
}
