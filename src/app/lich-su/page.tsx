import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Lịch sử phân tích",
  description: "Xem lại các lần chấm điểm routine skincare đã lưu.",
  robots: { index: false, follow: true },
};

export default async function LichSuPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const items = await prisma.analysisHistory.findMany({
    where: { routine: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      routine: { select: { routineName: true } },
    },
  });

  return (
    <div className="min-h-dvh bg-slate-50 px-4 pb-24 pt-6 dark:bg-[#0b0e14]">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Lịch sử phân tích</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          Các lần phân tích đã lưu khi bạn đăng nhập. Dữ liệu có thể được dọn theo chính sách lưu trữ.
        </p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm ring-1 ring-slate-100 dark:border-zinc-800 dark:bg-[#141820]/80 dark:text-zinc-500 dark:shadow-none dark:ring-zinc-800/60">
            Chưa có phân tích nào. Quay lại trang chủ và dán routine để bắt đầu.
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-teal-600 px-6 font-semibold text-white hover:bg-teal-500"
              >
                Phân tích routine
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-8 space-y-3" role="list">
            {items.map((row) => {
              const date = new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(row.createdAt);
              return (
                <li key={row.id}>
                  <Link
                    href={`/lich-su/${row.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 transition hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#1a1f26]/80 dark:ring-zinc-800/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {row.routine.routineName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{date}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-teal-800 dark:bg-teal-950/80 dark:text-teal-300">
                        {row.overallScore}
                      </span>
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
