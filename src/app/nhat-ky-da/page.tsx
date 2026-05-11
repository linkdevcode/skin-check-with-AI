import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageBackBar } from "@/app/components/page-back-bar";
import { SkinDiaryView } from "./skin-diary-view";
import type { SkinDiaryAnalysisJson, SkinEntryListItem } from "@/types/skin-diary";

export const metadata: Metadata = {
  title: "Nhật ký da",
  description: "Theo dõi ảnh da theo ngày, so sánh Before/After và biểu đồ cải thiện.",
};

export const maxDuration = 30;

export default async function NhatKyDaPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/dang-nhap?callbackUrl=/nhat-ky-da");
  }

  const rows = await prisma.skinEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 120,
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

  const initialEntries: SkinEntryListItem[] = rows.map((r) => ({
    id: r.id,
    imageUrlFront: r.imageUrlFront,
    imageUrlLeft: r.imageUrlLeft,
    imageUrlRight: r.imageUrlRight,
    userNote: r.userNote,
    createdAt: r.createdAt.toISOString(),
    analysisResult: r.analysisResult as SkinDiaryAnalysisJson,
  }));

  return (
    <div className="min-h-[calc(100svh-3rem)] bg-slate-50 pb-6 dark:bg-[#0b0e14]">
      <div className="mx-auto w-full max-w-lg px-4 pt-2 sm:max-w-xl sm:px-6 lg:max-w-3xl lg:px-8">
        <PageBackBar href="/">Về trang chủ</PageBackBar>
        <header className="mb-6 mt-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Nhật ký da</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Bước 1: Chụp ảnh mặt trước (bắt buộc). AI cần ảnh này để so sánh với các mốc thời gian khác; thêm góc phụ
            nếu muốn.
          </p>
        </header>
        <SkinDiaryView initialEntries={initialEntries} />
      </div>
    </div>
  );
}
