"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/app/components/auth-shell";
import { registerUser } from "@/actions/auth-actions";
import { authFieldClass } from "@/lib/auth-field-classes";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const reg = await registerUser({ name, email, password });
    if (!reg.ok) {
      setLoading(false);
      setError(reg.error);
      return;
    }

    const sign = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl: "/",
    });

    setLoading(false);

    if (sign?.error) {
      setError("Tạo tài khoản thành công nhưng đăng nhập tự động thất bại. Hãy đăng nhập thủ công.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell
      title="Đăng ký"
      subtitle="Miễn phí. Sau khi có tài khoản, mọi phân tích sẽ lưu vào lịch sử."
      footer={
        <p>
          Đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="font-medium text-emerald-400 hover:text-emerald-300">
            Đăng nhập
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-name" className="text-sm font-medium text-zinc-300">
            Tên hoặc biệt danh
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={cn("mt-1", authFieldClass)}
            disabled={loading}
            placeholder="Ví dụ: Lan"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-password" className="text-sm font-medium text-zinc-300">
            Mật khẩu (tối thiểu 8 ký tự)
          </label>
          <input
            id="reg-password"
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
          Tạo tài khoản
        </button>
      </form>
    </AuthShell>
  );
}
