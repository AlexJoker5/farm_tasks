/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Farm Tasks — Grow Your Productivity",
  description:
    "A gamified spatial productivity platform where your real-world goals grow into a living pixel-art garden. Complete tasks, grow plants, and share your garden with friends.",
  keywords: [
    "productivity",
    "gamification",
    "pixel art",
    "habit tracker",
    "todo app",
    "garden",
  ],
  openGraph: {
    title: "Farm Tasks — Grow Your Productivity",
    description:
      "A gamified spatial productivity platform where your real-world goals grow into a living pixel-art garden.",
    url: "https://farmtasks.com",
    siteName: "Farm Tasks",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Farm Tasks — Grow Your Productivity",
    description: "Grow your goals into a pixel-art garden.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/* Press Start 2P pixel font for headings and UI accents */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col crt-overlay">{children}</body>
    </html>
  );
}
