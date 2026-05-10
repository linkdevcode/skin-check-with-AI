import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] dark:bg-[#0b0e14]",
      )}
    >
      <div className="mb-8 w-full max-w-md text-center">
        <Link href="/" className="text-xs font-medium uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400/90">
          SkinCheck AI
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{subtitle}</p> : null}
      </div>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 dark:border-zinc-800 dark:bg-[#141820]/90 dark:shadow-black/40 dark:ring-zinc-800/80">
        {children}
      </div>

      {footer ? (
        <div className="mt-8 w-full max-w-md text-center text-sm text-slate-600 dark:text-zinc-500">{footer}</div>
      ) : null}

      <p className="mt-10 max-w-md text-center text-xs text-slate-500 dark:text-zinc-600">
        Phân tích mang tính giáo dục, không thay cho tư vấn y tế.
      </p>
    </div>
  );
}
