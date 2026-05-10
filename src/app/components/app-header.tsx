import Link from "next/link";
import { auth } from "@/auth";
import { HeaderAuthClient } from "./header-auth-client";
import { HomeLogoLink } from "./home-logo-link";
import { ThemeToggle } from "./theme-toggle";

export async function AppHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-white/65 shadow-[0_1px_0_0_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-zinc-700/40 dark:bg-[#0b0e14]/55 dark:shadow-[0_1px_0_0_rgba(0,0,0,0.4)] supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:dark:bg-[#0b0e14]/50">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-3 py-2 sm:max-w-xl sm:gap-3 sm:px-4 sm:py-2.5 lg:max-w-3xl lg:px-8">
        <HomeLogoLink className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">
          SkinCheck AI
        </HomeLogoLink>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <nav className="flex items-center gap-1 sm:gap-2">
            {session?.user ? (
              <>
                <Link
                  href="/lich-su"
                  className="min-h-10 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-white"
                >
                  Lịch sử
                </Link>
                <HeaderAuthClient />
              </>
            ) : (
              <>
                <Link
                  href="/dang-nhap"
                  className="min-h-10 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-white"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  className="min-h-10 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 hover:bg-teal-500"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
