import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/layout/Navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "游戏SEO内容生成工具",
  description: "基于AI技术的智能游戏内容创作平台",
};

// Toast Provider 组件
function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <div id="toast-container" className="fixed top-4 right-4 z-[9999] space-y-2" />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
