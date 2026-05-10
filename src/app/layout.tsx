import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkinCheck AI",
  description: "Phân tích routine skincare với AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
