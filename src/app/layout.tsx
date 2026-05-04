import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import ChatWidget from "@/components/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kygrsolutions.com"),
  title: {
    default: "KYGR Solutions | Website, Software & Application Development",
    template: "%s | KYGR Solutions",
  },
  description:
    "KYGR Solutions builds conversion-focused websites, web & mobile apps, and AI automations for businesses ready to grow — custom software development, application development, and tech stack reviews that help you win more leads and reclaim time.",
  keywords: [
    "KYGR Solutions",
    "website development",
    "website development services",
    "software development",
    "custom software development",
    "application development",
    "custom application development",
    "web app development",
    "mobile app development",
    "AI automations",
    "AI automation services",
    "business automation",
    "workflow automation",
    "tech stack review",
    "technology consulting",
    "business software",
    "automation",
    "integration",
    "Georgia",
    "remote software consulting",
  ],
  authors: [{ name: "Kyle Greer" }],
  creator: "Kyle Greer",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kygrsolutions.com",
    siteName: "KYGR Solutions",
    title: "KYGR Solutions | Custom Software for Growing Businesses",
    description:
      "Helping businesses grow through custom websites, apps, and automation — based in Georgia, working everywhere. Reclaim your time and win more leads.",
    images: [
      {
        url: "/logo.png", // Ensure this path is correct or use a specific OG image
        width: 1200,
        height: 630,
        alt: "KYGR Solutions Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KYGR Solutions | Custom Software for Growing Businesses",
    description:
      "Helping businesses grow through custom websites, apps, and automation — based in Georgia, working everywhere. Reclaim your time and win more leads.",
    images: ["/logo.png"],
    creator: "@kygrsolutions", // Replace with your actual handle if applicable
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
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
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-rich-black text-text-primary min-h-screen relative`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "KYGR Solutions",
              url: "https://kygrsolutions.com",
              description:
                "Custom website development, software development, application development, AI automations, and tech stack reviews for businesses ready to grow.",
              founder: { "@type": "Person", name: "Kyle Greer" },
              areaServed: ["Georgia", "United States"],
              serviceType: [
                "Website Development",
                "Software Development",
                "Application Development",
                "AI Automation",
                "Tech Stack Review",
                "Technology Consulting",
              ],
              sameAs: ["https://kygrsolutions.com"],
            }),
          }}
        />
        <AppShell>{children}</AppShell>
        <ChatWidget />
      </body>
    </html>
  );
}
