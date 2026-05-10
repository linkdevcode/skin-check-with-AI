"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/app/components/auth-shell";
import { authFieldClass } from "@/lib/auth-field-classes";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const authError = searchParams.get("error");
  const resetOk = searchParams.get("reset") === "ok";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    authError ? "Email hoặc mật khẩu không đúng." : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email hoặc mật khẩu không đúng.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Dùng email đã đăng ký để xem lịch sử phân tích."
      footer={
        <p>
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="font-medium text-emerald-400 hover:text-emerald-300">
            Đăng ký
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {resetOk ? (
          <p className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100" role="status">
            Đã đặt lại mật khẩu. Đăng nhập bằng mật khẩu mới.
          </p>
        ) : null}

        <div>
          <label htmlFor="login-email" className="text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="login-email"
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
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-zinc-300">
              Mật khẩu
            </label>
            <Link
              href="/quen-mat-khau"
              className="text-xs font-medium text-emerald-400/90 hover:text-emerald-300"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          Đăng nhập
        </button>
      </form>
    </AuthShell>
  );
}
