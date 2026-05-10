import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnalysisDetail } from "./analysis-detail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Chi tiết phân tích",
    robots: { index: false, follow: false },
  };
}

export default async function LichSuChiTietPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const { id } = await params;

  const row = await prisma.analysisHistory.findFirst({
    where: {
      id,
      routine: { userId: session.user.id },
    },
    include: {
      routine: { select: { routineName: true } },
    },
  });

  if (!row) {
    notFound();
  }

  const createdLabel = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(row.createdAt);

  return (
    <AnalysisDetail
      analysis={row}
      routineName={row.routine.routineName}
      createdLabel={createdLabel}
    />
  );
}
