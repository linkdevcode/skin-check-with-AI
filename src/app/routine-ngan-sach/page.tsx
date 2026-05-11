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
          {/* <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {isLoggedIn ? (
              <Link href="/routine-ngan-sach/lich-su" className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400">
                Lịch sử gợi ý đã lưu
              </Link>
            ) : null}
          </div> */}
        </header>
        <FaceRoutineWizard isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
