"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/app/components/auth-shell";
import { resetPasswordWithToken } from "@/actions/auth-actions";
import { authFieldClass } from "@/lib/auth-field-classes";
import { cn } from "@/lib/utils";

export function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== again) {
      setError("Hai lần nhập mật khẩu không khớp.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await resetPasswordWithToken(token, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/dang-nhap?reset=ok");
    router.refresh();
  }

  if (!token) {
    return (
      <AuthShell title="Liên kết không hợp lệ" subtitle="Thiếu mã xác thực. Hãy yêu cầu gửi lại email.">
        <Link
          href="/quen-mat-khau"
          className="sk-press-feedback min-h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-800/50 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Yêu cầu liên kết mới
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      subtitle="Nhập mật khẩu mới cho tài khoản của bạn."
      footer={
        <Link href="/dang-nhap" className="sk-press-feedback font-medium text-emerald-400 hover:text-emerald-300">
          ← Đăng nhập
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-pass" className="text-sm font-medium text-zinc-300">
            Mật khẩu mới
          </label>
          <input
            id="new-pass"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn("mt-1", authFieldClass)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="new-pass-2" className="text-sm font-medium text-zinc-300">
            Nhập lại mật khẩu
          </label>
          <input
            id="new-pass-2"
            name="password2"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={again}
            onChange={(e) => setAgain(e.target.value)}
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
          className="sk-press-feedback-subtle flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-emerald-900/25 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-45"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Cập nhật mật khẩu
        </button>
      </form>
    </AuthShell>
  );
}
