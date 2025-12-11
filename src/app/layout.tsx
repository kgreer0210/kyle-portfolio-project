import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KYGR Solutions | Websites, Web & Mobile Apps, Automations",
  description:
    "KYGR Solutions builds conversion-focused websites, web & mobile apps, and automations for local service businesses—helping you win more leads, streamline operations, and reclaim time.",
  keywords: [
    "KYGR Solutions",
    "local service business",
    "website development",
    "web app",
    "mobile app",
    "automation",
    "integration",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Kyle Greer" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
