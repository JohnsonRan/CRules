import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "NextJS",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "WoW!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}
