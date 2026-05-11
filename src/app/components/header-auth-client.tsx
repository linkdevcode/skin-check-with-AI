"use client";

import { signOut } from "next-auth/react";

export function HeaderAuthClient() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="sk-press-feedback min-h-10 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white"
    >
      Đăng xuất
    </button>
  );
}
