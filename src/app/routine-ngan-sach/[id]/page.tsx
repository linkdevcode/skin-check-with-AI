import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserIdForRead } from "@/lib/skin-actor";
import { PageBackBar } from "@/app/components/page-back-bar";
import { RoutineBudgetDashboard } from "@/app/components/routine-budget-dashboard";
import {
  BudgetRoutineResultView,
  ThreeTierRoutineResultView,
} from "@/app/components/routine-suggestion-display";
import type { FaceRoutineAnalysis, SavedRoutineGenResult } from "@/types/face-routine-budget";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Gợi ý routine · ${id.slice(0, 8)}…`,
    robots: { index: false, follow: true },
  };
}

export default async function RoutineNganSachDetailPage({ params }: Props) {
  const userId = await getEffectiveUserIdForRead();
  if (!userId) {
    redirect("/routine-ngan-sach");
  }
  const { id } = await params;

  const row = await prisma.recommendedRoutine.findFirst({
    where: { id, userId },
  });
  if (!row) notFound();

  const face = row.faceAnalysis as FaceRoutineAnalysis;
  const routine = row.routineResult as SavedRoutineGenResult;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);

  return (
    <div className="min-h-dvh bg-slate-50 px-4 pb-24 pt-6 dark:bg-[#0b0e14]">
      <div className="mx-auto max-w-lg sm:max-w-xl">
        <PageBackBar href="/routine-ngan-sach/lich-su">Lịch sử gợi ý</PageBackBar>
        {!isLoggedIn ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100">
            Đăng nhập để lưu lại lịch sử và xem trên mọi thiết bị.{" "}
          </p>
        ) : null}

        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
          {new Intl.DateTimeFormat("vi-VN", { dateStyle: "long", timeStyle: "short" }).format(row.createdAt)}
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
          {row.mode === "BUDGET" ? "Routine theo ngân sách" : "Ba gói gợi ý"}
          {row.mode === "BUDGET" && row.budgetVnd != null
            ? ` · ${row.budgetVnd.toLocaleString("vi-VN")}đ`
            : ""}
        </h1>

        <div className="mt-6 grid max-w-[280px] grid-cols-3 gap-2">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900">
            <Image src={row.imageUrlFront} alt="Trước" fill className="object-cover" sizes="100px" />
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900">
            <Image src={row.imageUrlLeft} alt="Trái" fill className="object-cover" sizes="100px" />
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900">
            <Image src={row.imageUrlRight} alt="Phải" fill className="object-cover" sizes="100px" />
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <RoutineBudgetDashboard data={face} />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/90">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Gợi ý sản phẩm</h2>
            <div className="mt-4">
              {routine?.kind === "BUDGET" ? (
                <BudgetRoutineResultView pkg={routine.package} />
              ) : routine?.kind === "AUTO" ? (
                <ThreeTierRoutineResultView tiers={routine.tiers} />
              ) : (
                <p className="text-sm text-slate-500">Không đọc được dữ liệu gợi ý.</p>
              )}
            </div>
          </section>
        </div>

        <Link
          href="/routine-ngan-sach"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-500"
        >
          Phân tích mới
        </Link>
      </div>
    </div>
  );
}
