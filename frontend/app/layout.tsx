import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import "./globals.css";
import SwRegister from "../components/SwRegister";

export const metadata = {
  title: "ClipNest — Free Video Downloader",
  description: "Download videos from TikTok, Instagram, Twitter, Facebook and 1000+ platforms. Free, no signup, no watermark, no ads.",
  keywords: "video downloader, TikTok downloader, Instagram downloader, Twitter video download, Facebook video download, free video downloader, no watermark, mp4 downloader, mp3 downloader",
  openGraph: {
    title: "ClipNest — Free Video Downloader",
    description: "Download videos from TikTok, Instagram, Twitter, Facebook and 1000+ platforms. Free, no signup, no watermark.",
    url: "https://clip-nest-ten.vercel.app",
    siteName: "ClipNest",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ClipNest — Free Video Downloader",
    description: "Free video downloader. No signup, no watermark, no ads.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ClipNest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>
        <SwRegister />
        <main className="min-h-screen">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
