"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-14 shrink-0 rounded-full bg-slate-200/70 dark:bg-slate-800/70" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Chuyển chế độ sáng" : "Chuyển chế độ tối"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-9 w-14 shrink-0 overflow-hidden rounded-full border p-0.5 shadow-inner transition-colors",
        "border-slate-300/90 bg-slate-200 dark:border-slate-600 dark:bg-slate-800",
      )}
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2.5">
        <Sun className="h-3.5 w-3.5 text-amber-500 dark:opacity-25" aria-hidden />
        <Moon className="h-3.5 w-3.5 text-teal-400 opacity-25 dark:opacity-80" aria-hidden />
      </span>
      <span
        className={cn(
          "absolute top-0.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-out dark:bg-slate-600",
          isDark ? "translate-x-[22px]" : "translate-x-0.5",
        )}
        style={{ left: 2 }}
        aria-hidden
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-cyan-200" strokeWidth={2.2} />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" strokeWidth={2.2} />
        )}
      </span>
    </button>
  );
}
