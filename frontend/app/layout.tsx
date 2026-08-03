import type { Metadata } from "next";
import "./globals.css";
import SwRegister from "../components/SwRegister";

export const metadata: Metadata = {
  title: "ClipNest — Download Any Video",
  description: "Paste any video link. Get the file. No ads, no signup.",
};

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <SwRegister />
        <main className="min-h-screen bg-[#0a0a0a]">
          {children}
        </main>
      </body>
    </html>
  );
}
