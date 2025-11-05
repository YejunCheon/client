import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MSWProvider } from "./msw-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DealChain - 중고거래 계약서 플랫폼",
  description: "AI 기반 중고거래 계약서 자동 생성 및 전자서명",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MSWProvider>
          <ReactQueryProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="mx-auto w-full max-w-[1512px] flex-1 px-5 flex flex-col">
                {children}
              </main>
              <Footer />
            </div>
          </ReactQueryProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
