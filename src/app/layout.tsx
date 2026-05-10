import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import { AppHeader } from "@/app/components/app-header";
import { Providers } from "@/app/providers";
import "./globals.css";

const fontApp = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "SkinCheck AI",
  title: {
    default: "SkinCheck AI — Phân tích routine skincare với AI",
    template: "%s · SkinCheck AI",
  },
  description:
    "Dán routine sáng và tối, nhận điểm số, cảnh báo xung đột hoạt chất, đánh giá an toàn da mụn và gợi ý thứ tự bôi thoa — tối ưu mobile, tiếng Việt.",
  keywords: [
    "skincare",
    "routine",
    "Retinol",
    "BHA",
    "AHA",
    "Vitamin C",
    "da mụn",
    "chăm sóc da",
    "SkinCheck",
  ],
  authors: [{ name: "SkinCheck AI" }],
  creator: "SkinCheck AI",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "SkinCheck AI",
    title: "SkinCheck AI — Phân tích routine skincare với AI",
    description:
      "Chấm điểm routine, phát hiện xung đột hoạt chất và gợi ý layering thông minh cho da bạn.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkinCheck AI",
    description:
      "Phân tích routine skincare bằng AI — nhanh, rõ ràng, tối ưu điện thoại.",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0e14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${fontApp.className} ${fontMono.variable} antialiased bg-slate-50 text-slate-900 dark:bg-[#0b0e14] dark:text-slate-100`}
      >
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
