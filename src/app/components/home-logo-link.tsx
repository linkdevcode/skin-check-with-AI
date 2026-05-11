"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Logo trang chủ: luôn dẫn về `/`. Khi đang ở trang chủ, cuộn lên đầu (không chặn điều hướng).
 */
export function HomeLogoLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <Link
      href="/"
      className={cn(
        "sk-press-feedback -ml-1.5 min-h-10 items-center rounded-lg px-1.5 py-1",
        className,
      )}
      onClick={() => {
        if (isHome) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      {children}
    </Link>
  );
}
