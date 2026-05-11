import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageBackBar } from "@/app/components/page-back-bar";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import {
  mapAnalysisHistoryRow,
  mapRecommendedRoutineRow,
  mapSkinEntryRow,
  parseLichSuLoai,
  type LichSuLoai,
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

const tabDef: { loai: LichSuLoai; label: string; href: string }[] = [
  { loai: "tat-ca", label: "Tất cả", href: "/lich-su" },
  { loai: "routine", label: "Routine", href: "/lich-su?loai=routine" },
  { loai: "da-ngan-sach", label: "Da & ngân sách", href: "/lich-su?loai=da-ngan-sach" },
  { loai: "nhat-ky-da", label: "Nhật ký da", href: "/lich-su?loai=nhat-ky-da" },
];

function kindStyles(kind: UnifiedHistoryItem["kind"]) {
  switch (kind) {
    case "routine":
      return {
        pill: "bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-200",
        badge: "bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-300",
      };
    case "da-ngan-sach":
      return {
        pill: "bg-violet-100 text-violet-900 dark:bg-violet-950/80 dark:text-violet-200",
        badge: "bg-violet-100 text-violet-900 dark:bg-violet-950/80 dark:text-violet-300",
      };
    case "nhat-ky-da":
      return {
        pill: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-200",
        badge: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-300",
      };
    default:
      return {
        pill: "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200",
        badge: "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300",
      };
  }
}

function kindLabel(kind: UnifiedHistoryItem["kind"]) {
  switch (kind) {
    case "routine":
      return "Routine";
    case "da-ngan-sach":
      return "Da & NS";
    case "nhat-ky-da":
      return "Nhật ký";
    default:
      return "";
  }
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
        include: { routine: { select: { routineName: true } } },
      }),
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
      include: { routine: { select: { routineName: true } } },
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

  return (
    <div className="min-h-dvh bg-slate-50 px-4 pb-24 pt-6 dark:bg-[#0b0e14]">
      <div className="mx-auto max-w-lg sm:max-w-xl">
        <PageBackBar href="/">Về trang chủ</PageBackBar>
        <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Lịch sử hoạt động</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          Phân tích routine, gợi ý da &amp; ngân sách, và ảnh nhật ký — sắp xếp mới nhất trước.
        </p>

        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Lọc loại lịch sử">
          {tabDef.map((t) => {
            const active = t.loai === loai;
            return (
              <Link
                key={t.loai}
                href={t.href}
                role="tab"
                aria-selected={active}
                className={cn(
                  "min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                  active
                    ? "border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-600"
                    : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-teal-700 dark:hover:bg-teal-950/40",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

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
          <ul className="mt-8 space-y-3" role="list">
            {items.map((row) => {
              const date = new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(row.createdAt);
              const st = kindStyles(row.kind);
              return (
                <li key={`${row.kind}-${row.id}`}>
                  <Link
                    href={row.href}
                    className="flex min-h-[3.25rem] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm ring-1 ring-slate-100 transition hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#1a1f26]/80 dark:ring-zinc-800/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 sm:px-4"
                  >
                    <span
                      className={cn(
                        "hidden shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide sm:inline-block",
                        st.pill,
                      )}
                    >
                      {kindLabel(row.kind)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{row.title}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-zinc-500">
                        <span className={cn("mr-1.5 inline sm:hidden", st.pill, "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase")}>
                          {kindLabel(row.kind)}
                        </span>
                        {row.subtitle} · {date}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {row.badge ? (
                        <span
                          className={cn(
                            "max-w-[5.5rem] truncate rounded-lg px-2 py-1 text-xs font-semibold tabular-nums sm:max-w-[7rem]",
                            st.badge,
                          )}
                          title={row.badge}
                        >
                          {row.badge}
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
