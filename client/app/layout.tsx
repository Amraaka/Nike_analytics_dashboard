import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nike Аналитикийн Хяналтын Самбар",
  description: "Nike дэлгүүрийн аналитикийн хяналтын самбар",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 p-8 md:ml-56">{children}</main>
        </div>
      </body>
    </html>
  );
}
