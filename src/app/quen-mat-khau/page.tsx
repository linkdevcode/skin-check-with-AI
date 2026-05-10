import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  description: "Đặt lại mật khẩu tài khoản SkinCheck AI qua email.",
  robots: { index: false, follow: true },
};

export default function QuenMatKhauPage() {
  return <ForgotForm />;
}
