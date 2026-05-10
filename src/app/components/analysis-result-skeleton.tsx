import { cn } from "@/lib/utils";

export function AnalysisResultSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn("mt-10 space-y-8", className)}
      aria-busy
      aria-label="Đang tải kết quả phân tích"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 ring-1 ring-slate-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:ring-zinc-800/80">
        <div className="mx-auto flex h-44 w-44 items-center justify-center">
          <div className="h-36 w-36 animate-pulse rounded-full bg-slate-200 ring-8 ring-slate-100 dark:bg-zinc-800 dark:ring-zinc-800/50" />
        </div>
        <div className="mx-auto mt-3 h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-slate-100 dark:border-zinc-800 dark:ring-zinc-800/60">
        <div className="mb-3 h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="flex gap-3">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-[80%] animate-pulse rounded bg-slate-200/90 dark:bg-zinc-800/90" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-200/70 dark:bg-zinc-800/70" />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex gap-3 rounded-2xl border border-slate-200/90 p-4 ring-1 ring-inset ring-slate-100 dark:border-zinc-800/80 dark:ring-zinc-800/50"
            >
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-[60%] max-w-[220px] animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-200/80 dark:bg-zinc-800/80" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-slate-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:ring-zinc-800/60">
        <div className="mb-4 h-3 w-40 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-200/90 dark:bg-zinc-800/90" />
          <div className="h-3 w-[92%] animate-pulse rounded bg-slate-200/90 dark:bg-zinc-800/90" />
          <div className="h-3 w-[85%] animate-pulse rounded bg-slate-200/90 dark:bg-zinc-800/90" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-200/90 dark:bg-zinc-800/90" />
        </div>
      </div>
    </section>
  );
}
