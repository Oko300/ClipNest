import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import "./globals.css";
import SwRegister from "../components/SwRegister";

export const metadata = {
  title: "ClipNest — Free Video Downloader | No Watermark, No Signup",
  description: "Download videos from TikTok, Instagram, Twitter, Facebook, Vimeo and 1000+ platforms. Free, no watermark, no signup, no ads. Get MP4 or MP3 instantly.",
  keywords: [
    "free video downloader",
    "TikTok downloader",
    "Instagram video download",
    "Twitter video downloader",
    "Facebook video download",
    "no watermark video downloader",
    "mp4 downloader",
    "mp3 downloader",
    "download video online free",
    "video downloader no signup",
    "social media video downloader",
    "ClipNest"
  ],
  authors: [{ name: "ClipNest" }],
  creator: "ClipNest",
  metadataBase: new URL("https://clip-nest-ten.vercel.app"),
  alternates: {
    canonical: "https://clip-nest-ten.vercel.app",
  },
  openGraph: {
    title: "ClipNest — Free Video Downloader",
    description: "Download videos from TikTok, Instagram, Twitter, Facebook and 1000+ platforms. No watermark, no signup, no ads.",
    url: "https://clip-nest-ten.vercel.app",
    siteName: "ClipNest",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipNest — Free Video Downloader",
    description: "Download videos from TikTok, Instagram, Twitter, Facebook and 1000+ platforms. Free, no watermark, no signup.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
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
