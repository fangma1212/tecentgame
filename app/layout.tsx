import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "这一秒，想到你 · 音乐明信片",
  description: "留下一段音乐，写一句心里话。把听歌时想到一个人的瞬间，寄成一张会唱歌的明信片。",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
