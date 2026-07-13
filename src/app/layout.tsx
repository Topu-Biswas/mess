import type { Metadata, Viewport } from "next";
import { Inter, Hind_Siliguri, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "মেস ফাইন্ডার — এলাকাভিত্তিক মেস খুঁজুন ও বুক করুন",
  description:
    "ম্যাপে আপনার এলাকার মেস ও হোস্টেল খুঁজুন। লাইভ সিট অ্যাভেইলেবিলিটি, ফিল্টার ও সরাসরি বুকিং রিকোয়েস্ট — সব এক জায়গায়।",
  keywords: ["মেস", "হোস্টেল", "মেস ফাইন্ডার", "বাসা ভাড়া", "ঢাকা", "Mess Finder"],
  authors: [{ name: "Mess Finder" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "মেস ফাইন্ডার",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "মেস ফাইন্ডার — Mess Finder",
    description: "বাংলাদেশের #১ ম্যাপ-বেসড মেস ও হোস্টেল খোঁজার প্ল্যাটফর্ম",
    type: "website",
    locale: "bn_BD",
    siteName: "মেস ফাইন্ডার",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "মেস ফাইন্ডার" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "মেস ফাইন্ডার",
    description: "এলাকাভিত্তিক মেস খুঁজুন ও বুক করুন",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#00A885",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="মেস ফাইন্ডার" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="মেস ফাইন্ডার" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#00A885" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
      <body
        className={`${inter.variable} ${hindSiliguri.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
