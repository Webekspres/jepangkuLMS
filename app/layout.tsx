import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { AppProviders } from "@/components/providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JepangKu LMS - Platform Belajar Bahasa Jepang Interaktif",
  description: "Kuasai Bahasa Jepang dari tingkat N5 hingga N1 secara interaktif. Dilengkapi video lesson terstruktur, kuis evaluasi, serta gamifikasi skor XP dan Badge pencapaian.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
