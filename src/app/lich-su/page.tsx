import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageBackBar } from "@/app/components/page-back-bar";
import { LichSuHistoryList, type LichSuHistoryRow } from "@/app/components/lich-su-history-list";
import { LichSuTabStrip } from "@/app/components/lich-su-tab-strip";
import {
  mapAnalysisHistoryRow,
  mapRecommendedRoutineRow,
  mapSkinEntryRow,
  parseLichSuLoai,
  type UnifiedHistoryItem,
} from "@/lib/lich-su-unified";

export const metadata: Metadata = {
  title: "Lịch sử hoạt động",
  description:
    "Theo dõi phân tích routine, phân tích da & gợi ý ngân sách, và nhật ký da đã lưu.",
  robots: { index: false, follow: true },
};

type PageProps = {
  searchParams: Promise<{ loai?: string }>;
};

const TAKE_EACH = 45;
const TAKE_MERGED = 90;

function toHistoryRows(items: UnifiedHistoryItem[]): LichSuHistoryRow[] {
  return items.map((row) => ({
    kind: row.kind,
    id: row.id,
    createdAtIso: row.createdAt.toISOString(),
    title: row.title,
    subtitle: row.subtitle,
    href: row.href,
    badge: row.badge,
  }));
}

export default async function LichSuPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/dang-nhap?callbackUrl=/lich-su");
  }

  const sp = await searchParams;
  const loai = parseLichSuLoai(sp.loai);

  let items: UnifiedHistoryItem[] = [];

  if (loai === "tat-ca") {
    const [routines, faces, diaries] = await Promise.all([
      prisma.analysisHistory.findMany({
        where: { routine: { userId: session.user.id } },
        orderBy: { createdAt: "desc" },
        take: TAKE_EACH,
        select: {
          id: true,
          createdAt: true,
          overallScore: true,
          routine: { select: { routineName: true } },
        },
      }),
      // RecommendedRoutine / SkinEntry: mapper cần JSON đầy đủ cho badge; có thể thu hẹp sau bằng json path hoặc cột tóm tắt nếu payload lớn.
      prisma.recommendedRoutine.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: TAKE_EACH,
        select: {
          id: true,
          createdAt: true,
          mode: true,
          budgetVnd: true,
          faceAnalysis: true,
          routineResult: true,
        },
      }),
      prisma.skinEntry.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: TAKE_EACH,
        select: {
          id: true,
          createdAt: true,
          userNote: true,
          analysisResult: true,
        },
      }),
    ]);
    items = [
      ...routines.map(mapAnalysisHistoryRow),
      ...faces.map(mapRecommendedRoutineRow),
      ...diaries.map(mapSkinEntryRow),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, TAKE_MERGED);
  } else if (loai === "routine") {
    const routines = await prisma.analysisHistory.findMany({
      where: { routine: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        overallScore: true,
        routine: { select: { routineName: true } },
      },
    });
    items = routines.map(mapAnalysisHistoryRow);
  } else if (loai === "da-ngan-sach") {
    const faces = await prisma.recommendedRoutine.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        mode: true,
        budgetVnd: true,
        faceAnalysis: true,
        routineResult: true,
      },
    });
    items = faces.map(mapRecommendedRoutineRow);
  } else {
    const diaries = await prisma.skinEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        userNote: true,
        analysisResult: true,
      },
    });
    items = diaries.map(mapSkinEntryRow);
  }

  const empty = items.length === 0;
  const historyRows = toHistoryRows(items);

  return (
    <div className="min-h-dvh bg-slate-50 px-4 pb-24 pt-6 dark:bg-[#0b0e14]">
      <div className="mx-auto max-w-lg sm:max-w-xl">
        <PageBackBar href="/">Về trang chủ</PageBackBar>
        <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Lịch sử hoạt động</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          Phân tích routine, gợi ý da &amp; ngân sách, và ảnh nhật ký — sắp xếp mới nhất trước.
        </p>

        <LichSuTabStrip activeLoai={loai} />

        {empty ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm ring-1 ring-slate-100 dark:border-zinc-800 dark:bg-[#141820]/80 dark:text-zinc-500 dark:shadow-none dark:ring-zinc-800/60">
            <p>Chưa có mục nào trong mục này.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <Link
                href="/routine"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-500"
              >
                Phân tích routine
              </Link>
              <Link
                href="/routine-ngan-sach"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Da &amp; ngân sách
              </Link>
              <Link
                href="/nhat-ky-da"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-teal-600 px-5 text-sm font-semibold text-teal-800 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-200 dark:hover:bg-teal-950/40"
              >
                Nhật ký da
              </Link>
            </div>
          </div>
        ) : (
          <LichSuHistoryList items={historyRows} />
        )}
      </div>
    </div>
  );
}
