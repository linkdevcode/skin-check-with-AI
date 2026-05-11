import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageBackBar } from "@/app/components/page-back-bar";
import { SkinCompareSlider } from "@/app/components/skin-compare-slider";
import type { SkinDiaryAnalysisJson } from "@/types/skin-diary";

export const metadata: Metadata = {
  title: "So sánh ảnh da",
};

type Props = {
  searchParams: Promise<{ before?: string; after?: string }>;
};

export default async function SkinComparePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/dang-nhap?callbackUrl=/nhat-ky-da/so-sanh");
  }

  const { before: beforeId, after: afterId } = await searchParams;
  if (!beforeId || !afterId) {
    redirect("/nhat-ky-da");
  }

  const [a, b] = await Promise.all([
    prisma.skinEntry.findFirst({
      where: { id: beforeId, userId: session.user.id },
      select: { imageUrl: true, createdAt: true, analysisResult: true },
    }),
    prisma.skinEntry.findFirst({
      where: { id: afterId, userId: session.user.id },
      select: { imageUrl: true, createdAt: true, analysisResult: true },
    }),
  ]);

  if (!a || !b) notFound();

  const ar = b.analysisResult as SkinDiaryAnalysisJson;

  return (
    <div className="min-h-[calc(100svh-3rem)] bg-slate-50 pb-8 dark:bg-[#0b0e14]">
      <div className="mx-auto max-w-lg px-4 pt-2 sm:max-w-xl lg:max-w-2xl">
        <PageBackBar href="/nhat-ky-da">Về nhật ký</PageBackBar>
        <h1 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">So sánh Before / After</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
          Trước: {a.createdAt.toLocaleString("vi-VN")} · Sau: {b.createdAt.toLocaleString("vi-VN")}
        </p>
        <div className="mt-6">
          <SkinCompareSlider beforeUrl={a.imageUrl} afterUrl={b.imageUrl} beforeLabel="Trước" afterLabel="Sau" />
        </div>
        {ar.nextAdvice ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 dark:border-zinc-800 dark:bg-[#141820]/90 dark:text-zinc-300">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">Gợi ý tiếp theo</p>
            <p className="mt-2 whitespace-pre-wrap">{ar.nextAdvice}</p>
          </div>
        ) : null}
        <Link
          href="/nhat-ky-da"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
        >
          Đóng
        </Link>
      </div>
    </div>
  );
}
