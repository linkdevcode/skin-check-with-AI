"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/app/components/auth-shell";
import { requestPasswordReset } from "@/actions/auth-actions";
import { authFieldClass } from "@/lib/auth-field-classes";
import { cn } from "@/lib/utils";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await requestPasswordReset(email);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell
        title="Kiểm tra email"
        subtitle="Nếu địa chỉ tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu."
        footer={
          <Link href="/dang-nhap" className="font-medium text-emerald-400 hover:text-emerald-300">
            ← Quay lại đăng nhập
          </Link>
        }
      >
        <p className="text-sm leading-relaxed text-zinc-400">
          Hãy mở hộp thư và làm theo hướng dẫn. Một số nhà cung cấp có thể đưa thư vào tab quảng cáo
          hoặc thư rác. Nếu đang chạy local chưa cấu hình email, kiểm tra log terminal server để xem liên
          kết đặt lại (nếu được in ra).
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Nhập email đã đăng ký — chúng tôi gửi liên kết đặt lại (hiệu lực 1 giờ)."
      footer={
        <Link href="/dang-nhap" className="font-medium text-emerald-400 hover:text-emerald-300">
          ← Quay lại đăng nhập
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn("mt-1", authFieldClass)}
            disabled={loading}
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-45"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Gửi liên kết
        </button>
      </form>
    </AuthShell>
  );
}
