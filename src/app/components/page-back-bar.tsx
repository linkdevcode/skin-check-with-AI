import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PageBackBarProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function PageBackBar({ href, children, className }: PageBackBarProps) {
  return (
    <nav className={cn("mb-1", className)} aria-label="Quay lại">
      <Link
        href={href}
        className={cn(
          "-ml-1 inline-flex min-h-11 max-w-full items-center gap-1 rounded-lg px-2 py-2.5 text-sm font-medium",
          "text-teal-700 transition hover:bg-teal-500/10 hover:text-teal-800",
          "dark:text-teal-400 dark:hover:bg-teal-950/50 dark:hover:text-teal-300",
        )}
      >
        <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
        <span className="truncate">{children}</span>
      </Link>
    </nav>
  );
}
