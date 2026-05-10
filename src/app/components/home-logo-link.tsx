"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
      className={className}
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
