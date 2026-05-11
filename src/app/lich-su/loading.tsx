import { cn } from "@/lib/utils";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80 dark:bg-zinc-800/90",
        className,
      )}
      aria-hidden
    />
  );
}

function SkeletonRow() {
  return (
    <div className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm ring-1 ring-slate-100 dark:border-zinc-800 dark:bg-[#1a1f26]/80 dark:ring-zinc-800/60 sm:px-4">
      <SkeletonLine className="hidden h-7 w-14 shrink-0 sm:block" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonLine className="h-4 w-[72%] max-w-md" />
        <SkeletonLine className="h-3 w-[55%] max-w-xs" />
      </div>
      <SkeletonLine className="h-6 w-10 shrink-0 rounded-lg" />
    </div>
  );
}

export default function LichSuLoading() {
  return (
    <div className="min-h-dvh bg-slate-50 px-4 pb-24 pt-6 dark:bg-[#0b0e14]">
      <div className="mx-auto max-w-lg sm:max-w-xl">
        <SkeletonLine className="mb-1 h-10 w-44 rounded-lg" />
        <SkeletonLine className="mt-2 h-7 w-56 max-w-[85%]" />
        <div className="mt-2 space-y-2">
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-[92%]" />
        </div>

        <div
          className={cn(
            "mt-5 flex gap-1 sm:flex-wrap sm:gap-2",
            "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-40 max-sm:justify-between max-sm:border-t max-sm:border-slate-200 max-sm:bg-white/95 max-sm:px-1.5 max-sm:py-2 max-sm:pb-[max(0.6rem,env(safe-area-inset-bottom))] max-sm:backdrop-blur-md dark:max-sm:border-zinc-800 dark:max-sm:bg-[#0b0e14]/95",
          )}
          aria-hidden
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-h-11 flex-1 animate-pulse rounded-xl border border-slate-200 bg-slate-100/90 dark:border-zinc-700 dark:bg-zinc-800/80 sm:min-h-9 sm:rounded-full"
            />
          ))}
        </div>

        <ul className="mt-8 space-y-3" aria-busy aria-label="Đang tải danh sách">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <SkeletonRow />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
