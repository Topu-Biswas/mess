import type { Metadata } from "next";
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
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
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
