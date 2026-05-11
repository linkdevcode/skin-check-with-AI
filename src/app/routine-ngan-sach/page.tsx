import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { PageBackBar } from "@/app/components/page-back-bar";
import { AnonymousSkinNotice } from "@/app/components/anonymous-skin-notice";
import { SkinGuestSessionInit } from "@/app/components/skin-guest-session-init";
import { FaceRoutineWizard } from "./face-routine-wizard";

export const metadata: Metadata = {
  title: "Phân tích da & routine theo ngân sách",
  description: "Ảnh da, điểm số AI và gợi ý sản phẩm theo ngân sách hoặc 3 gói.",
  robots: { index: false, follow: true },
};

export const maxDuration = 30;

export default async function RoutineNganSachPage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);

  return (
    <div className="min-h-[calc(100svh-3rem)] bg-slate-50 pb-10 dark:bg-[#0b0e14]">
      {!isLoggedIn ? <SkinGuestSessionInit active /> : null}
      <div className="mx-auto w-full max-w-lg px-4 pt-2 sm:max-w-xl sm:px-6 lg:max-w-3xl lg:px-8">
        <PageBackBar href="/">Về trang chủ</PageBackBar>
        {!isLoggedIn ? <AnonymousSkinNotice callbackPath="/routine-ngan-sach" /> : null}
        <header className="mb-6 mt-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Phân tích da &amp; gợi ý routine
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Bước 1: Chụp ảnh mặt trước (bắt buộc) — 2 ảnh trái phải tuỳ chọn để AI chấm điểm chính xác hơn; sau đó điểm
            số và routine theo ngân sách hoặc 3 gói.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {isLoggedIn ? (
              <Link href="/routine-ngan-sach/lich-su" className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400">
                Lịch sử gợi ý đã lưu
              </Link>
            ) : null}
            <Link href="/routine" className="text-slate-600 font-bold hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white">
              Phân tích routine chữ
            </Link>
          </div>
        </header>
        <FaceRoutineWizard isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
