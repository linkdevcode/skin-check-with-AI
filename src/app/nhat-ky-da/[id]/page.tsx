import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageBackBar } from "@/app/components/page-back-bar";
import type { SkinDiaryAnalysisJson } from "@/types/skin-diary";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Ảnh nhật ký · ${id.slice(0, 8)}…` };
}

export default async function SkinEntryDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?callbackUrl=/nhat-ky-da/${(await params).id}`);
  }
  const { id } = await params;
  const row = await prisma.skinEntry.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      imageUrlFront: true,
      imageUrlLeft: true,
      imageUrlRight: true,
      userNote: true,
      createdAt: true,
      analysisResult: true,
    },
  });
  if (!row) notFound();

  const ar = row.analysisResult as SkinDiaryAnalysisJson;
  const compareHref =
    ar.comparedWithEntryId != null
      ? `/nhat-ky-da/so-sanh?before=${ar.comparedWithEntryId}&after=${row.id}`
      : null;

  return (
    <div className="min-h-[calc(100svh-3rem)] bg-slate-50 pb-8 dark:bg-[#0b0e14]">
      <div className="mx-auto max-w-lg px-4 pt-2 sm:max-w-xl">
        <PageBackBar href="/nhat-ky-da">Về nhật ký</PageBackBar>
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
          {row.createdAt.toLocaleString("vi-VN")}
        </p>
        <div className="mt-4 space-y-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.imageUrlFront} alt="Mặt trước" className="aspect-square w-full object-cover" />
          </div>
          {row.imageUrlLeft && row.imageUrlRight ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.imageUrlLeft} alt="Góc trái" className="aspect-square w-full object-cover" />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.imageUrlRight} alt="Góc phải" className="aspect-square w-full object-cover" />
              </div>
            </div>
          ) : null}
        </div>
        {row.userNote ? (
          <p className="mt-4 text-sm text-slate-700 dark:text-zinc-300">
            <span className="font-medium text-slate-900 dark:text-white">Ghi chú: </span>
            {row.userNote}
          </p>
        ) : null}
        <dl className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-[#141820]/80">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 dark:text-zinc-500">Mụn (ước lượng)</dt>
            <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{ar.acneCount ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 dark:text-zinc-500">Độ đỏ (0–1)</dt>
            <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{ar.rednessScore ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 dark:text-zinc-500">Thâm (0–100)</dt>
            <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{ar.darkSpotAreaPercent ?? "—"}</dd>
          </div>
          {ar.compositeImprovementPercent != null ? (
            <div className="flex justify-between gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
              <dt className="text-teal-700 dark:text-teal-400">Cải thiện tổng hợp</dt>
              <dd className="font-bold tabular-nums text-teal-700 dark:text-teal-300">
                {ar.compositeImprovementPercent}%
              </dd>
            </div>
          ) : null}
        </dl>
        {ar.nextAdvice ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-zinc-800 dark:bg-[#141820]/90 dark:text-zinc-300">
            <p className="text-xs font-semibold uppercase text-teal-700 dark:text-teal-400">Lời khuyên</p>
            <p className="mt-2 whitespace-pre-wrap">{ar.nextAdvice}</p>
          </div>
        ) : null}
        {compareHref ? (
          <Link
            href={compareHref}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-600 text-sm font-semibold text-white hover:bg-teal-500"
          >
            Mở slider so sánh
          </Link>
        ) : null}
      </div>
    </div>
  );
}
