import Link from "next/link";
import { auth } from "@/auth";
import { HeaderAuthClient } from "./header-auth-client";
import { HomeLogoLink } from "./home-logo-link";
import { ThemeToggle } from "./theme-toggle";

export async function AppHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-[#0b0e14]/92">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3 sm:max-w-xl lg:max-w-3xl lg:px-8">
        <HomeLogoLink className="text-sm font-semibold text-slate-900 dark:text-white">
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
