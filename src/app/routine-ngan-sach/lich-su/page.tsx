import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserIdForRead } from "@/lib/skin-actor";
import { PageBackBar } from "@/app/components/page-back-bar";
import { AnonymousSkinNotice } from "@/app/components/anonymous-skin-notice";
import { SkinGuestSessionInit } from "@/app/components/skin-guest-session-init";
import type { FaceRoutineAnalysis, SavedRoutineGenResult } from "@/types/face-routine-budget";

export const metadata: Metadata = {
  title: "Lịch sử gợi ý routine",
  description: "Các lần phân tích da và gợi ý sản phẩm theo ngân sách đã lưu.",
  robots: { index: false, follow: true },
};

function previewTotal(mode: string, raw: unknown): number | null {
  const r = raw as SavedRoutineGenResult;
  if (!r || typeof r !== "object") return null;
  if (r.kind === "BUDGET") return r.package.totalEstimatedVnd;
  if (r.kind === "AUTO") {
    const t = r.tiers.hieuQua?.totalEstimatedVnd;
    return typeof t === "number" ? t : null;
  }
  return null;
}

export default async function RoutineNganSachLichSuPage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);
  const effectiveUserId = await getEffectiveUserIdForRead();

  const rows = effectiveUserId
    ? await prisma.recommendedRoutine.findMany({
        where: { userId: effectiveUserId },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true,
          mode: true,
          budgetVnd: true,
          createdAt: true,
          faceAnalysis: true,
          routineResult: true,
        },
      })
    : [];

  return (
    <div className="min-h-dvh bg-slate-50 px-4 pb-24 pt-6 dark:bg-[#0b0e14]">
      {!isLoggedIn ? <SkinGuestSessionInit active /> : null}
      <div className="mx-auto max-w-lg">
        <PageBackBar href="/routine-ngan-sach">Quay lại phân tích</PageBackBar>
        {!isLoggedIn ? <AnonymousSkinNotice callbackPath="/routine-ngan-sach/lich-su" /> : null}
        <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Lịch sử gợi ý routine</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          Các phiên đã lưu (ảnh + phân tích + danh sách sản phẩm gợi ý).
        </p>

        {rows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/80 dark:text-zinc-500">
            Chưa có gợi ý nào được lưu.
            <div className="mt-6">
              <Link
                href="/routine-ngan-sach"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-teal-600 px-6 font-semibold text-white hover:bg-teal-500"
              >
                Bắt đầu phân tích
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-8 space-y-3" role="list">
            {rows.map((row) => {
              const date = new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(row.createdAt);
              const face = row.faceAnalysis as FaceRoutineAnalysis;
              const skin = face?.skinType ?? "—";
              const total = previewTotal(row.mode, row.routineResult);
              const modeLabel = row.mode === "BUDGET" ? "Theo ngân sách" : "3 gói";
              return (
                <li key={row.id}>
                  <Link
                    href={`/routine-ngan-sach/${row.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 transition hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#1a1f26]/80 dark:ring-zinc-800/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {modeLabel} · {skin}
                        {row.mode === "BUDGET" && row.budgetVnd != null
                          ? ` · ${row.budgetVnd.toLocaleString("vi-VN")}đ`
                          : ""}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{date}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {total != null ? (
                        <span className="rounded-lg bg-teal-100 px-2 py-1 text-xs font-semibold tabular-nums text-teal-800 dark:bg-teal-950/80 dark:text-teal-300">
                          ~{total.toLocaleString("vi-VN")}đ
                        </span>
                      ) : null}
                      <ChevronRight className="h-5 w-5 text-slate-400 dark:text-zinc-600" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
