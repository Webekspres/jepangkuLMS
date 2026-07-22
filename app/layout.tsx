import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Suspense } from "react";
import { AppProviders } from "@/components/providers";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { AnalyticsPageViewTracker } from "@/components/analytics/analytics-page-view-tracker";
import { getClerkPublishableKey } from "@/lib/auth/clerk-config";
import { getGscVerificationToken } from "@/lib/analytics/config";
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

/** Enable env(safe-area-inset-*) for iOS/Android browser chrome. Light-only LMS. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kursus.jepangku.com"),

  title: "JepangKu LMS - Platform Belajar Bahasa Jepang Interaktif",

  description:
    "Kuasai Bahasa Jepang dari tingkat N5 hingga N1 secara interaktif. Dilengkapi video lesson terstruktur, kuis evaluasi, serta gamifikasi skor XP dan Badge pencapaian.",

  openGraph: {
    title: "JepangKu LMS - Platform Belajar Bahasa Jepang Interaktif",
    description:
      "Kuasai Bahasa Jepang dari tingkat N5 hingga N1 secara interaktif.",
    url: "https://kursus.jepangku.com",
    siteName: "JepangKu LMS",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "JepangKu LMS",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "JepangKu LMS - Platform Belajar Bahasa Jepang Interaktif",
    description:
      "Kuasai Bahasa Jepang dari tingkat N5 hingga N1 secara interaktif.",
    images: ["/opengraph-image.png"],
  },

  ...(getGscVerificationToken()
    ? { verification: { google: getGscVerificationToken() } }
    : {}),
};

const THEME_SCRUB_SCRIPT = `(function(){try{document.documentElement.classList.remove('dark');localStorage.removeItem('theme');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = getClerkPublishableKey();

  return (
    <html
      lang="en"
      style={{ colorScheme: "light" }}
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRUB_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />
        <AppProviders clerkPublishableKey={clerkPublishableKey}>
          <Suspense fallback={null}>
            <AnalyticsPageViewTracker />
          </Suspense>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
