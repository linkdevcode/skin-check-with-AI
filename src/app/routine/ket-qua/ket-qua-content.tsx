"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageBackBar } from "@/app/components/page-back-bar";
import { RoutineResultView } from "@/app/components/routine-result-view";
import type { StoredRoutinePayload } from "@/lib/routine-result-storage";
import { loadRoutineResult } from "@/lib/routine-result-storage";
import { cn } from "@/lib/utils";

const shell = cn(
  "mx-auto w-full max-w-lg px-4 pb-10 pt-1 sm:max-w-xl sm:px-6 lg:max-w-3xl lg:px-8",
  "min-h-[calc(100svh-3.5rem)] bg-slate-50 pb-[max(1.25rem,env(safe-area-inset-bottom))] dark:bg-[#0b0e14]",
);

export function RoutineKetQuaContent() {
  const [payload, setPayload] = useState<StoredRoutinePayload | null | undefined>(undefined);

  useEffect(() => {
    setPayload(loadRoutineResult());
  }, []);

  if (payload === undefined) {
    return (
      <div className={shell}>
        <div
          className="mt-4 h-48 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-zinc-800/60"
          aria-hidden
        />
      </div>
    );
  }

  if (!payload) {
    return (
      <div className={cn(shell, "flex flex-col items-center text-center")}>
        <div className="w-full text-left">
          <PageBackBar href="/routine">Quay lại nhập routine</PageBackBar>
        </div>
        <p className="mt-6 max-w-md text-slate-600 dark:text-slate-400">
          Chưa có kết quả trên thiết bị này. Hãy nhập routine và chạy phân tích (cùng phiên trình duyệt).
        </p>
        <Link
          href="/routine"
          className="mt-8 inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-xl bg-teal-600 px-6 font-semibold text-white hover:bg-teal-500"
        >
          Đến nhập routine
        </Link>
      </div>
    );
  }

  return (
    <div className={shell}>
      <PageBackBar href="/routine">Quay lại nhập routine</PageBackBar>
      <div className="mt-2 space-y-8">
        <RoutineResultView
          score={payload.score}
          conflicts={payload.conflicts}
          markdown={payload.markdown}
          acneSafety={payload.acneSafety}
          persistMessage={payload.persistMessage}
          guestNoSaveHint={payload.guestNoSaveHint}
        />
      </div>
    </div>
  );
}
