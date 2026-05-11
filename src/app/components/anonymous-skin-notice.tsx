import Link from "next/link";
import { AlertCircle } from "lucide-react";

type Props = {
  /** Đường dẫn callback sau đăng nhập, ví dụ /routine-ngan-sach */
  callbackPath: string;
};

/** Cảnh báo khi dùng phân tích da (routine ngân sách) mà chưa đăng nhập — khách vẫn lưu DB theo cookie. */
export function AnonymousSkinNotice({ callbackPath }: Props) {
  const q = encodeURIComponent(callbackPath);
  return (
    <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-3 text-sm text-amber-950 dark:border-amber-900/55 dark:bg-amber-950/40 dark:text-amber-50">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div className="space-y-1.5 leading-snug">
        <p className="font-semibold">Đăng nhập để lưu kết quả và xem lại trên mọi thiết bị.</p>
        <p>
          <Link
            href={`/dang-nhap?callbackUrl=${q}`}
            className="font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
