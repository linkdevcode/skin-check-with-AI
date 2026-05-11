"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="skincheck-theme"
    >
      <SessionProvider>
        {children}
        <Toaster richColors closeButton position="top-center" />
      </SessionProvider>
    </ThemeProvider>
  );
}
