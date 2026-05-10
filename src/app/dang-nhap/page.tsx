import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập SkinCheck AI để lưu và xem lịch sử phân tích routine.",
  robots: { index: false, follow: true },
};

export default function DangNhapPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh animate-pulse bg-zinc-950" />}>
      <LoginForm />
    </Suspense>
  );
}
