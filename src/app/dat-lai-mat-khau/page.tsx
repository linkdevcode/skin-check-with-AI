import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  description: "Tạo mật khẩu mới cho tài khoản SkinCheck AI.",
  robots: { index: false, follow: false },
};

export default function DatLaiMatKhauPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh animate-pulse bg-zinc-950" />}>
      <ResetForm />
    </Suspense>
  );
}
