import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        <main className="min-h-screen bg-[#0a0a0a]">
          {children}
        </main>
      </body>
    </html>
  );
}