import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageBackBar } from "@/app/components/page-back-bar";
import { FaceRoutineWizard } from "./face-routine-wizard";

export const metadata: Metadata = {
  title: "Phân tích da & routine theo ngân sách",
  description: "Chụp ảnh da, điểm số AI và gợi ý sản phẩm theo ngân sách hoặc 3 gói.",
  robots: { index: false, follow: true },
};

export default async function RoutineNganSachPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/dang-nhap?callbackUrl=/routine-ngan-sach");
  }

  return (
    <div className="min-h-[calc(100svh-3rem)] bg-slate-50 pb-10 dark:bg-[#0b0e14]">
      <div className="mx-auto w-full max-w-lg px-4 pt-2 sm:max-w-xl sm:px-6 lg:max-w-3xl lg:px-8">
        <PageBackBar href="/">Về trang chủ</PageBackBar>
        <header className="mb-6 mt-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Phân tích da &amp; gợi ý routine
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Camera hoặc chọn ảnh mặt → điểm số → routine theo ngân sách hoặc 3 gói (Tiết kiệm / Hiệu quả / Cao cấp).
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/routine-ngan-sach/lich-su" className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400">
              Lịch sử gợi ý đã lưu
            </Link>
            <Link href="/routine" className="text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white">
              Phân tích routine chữ
            </Link>
          </div>
        </header>
        <FaceRoutineWizard />
      </div>
    </div>
  );
}
