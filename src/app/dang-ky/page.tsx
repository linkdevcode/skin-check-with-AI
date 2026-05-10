import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản SkinCheck AI để lưu lịch sử phân tích routine.",
  robots: { index: false, follow: true },
};

export default function DangKyPage() {
  return <RegisterForm />;
}
