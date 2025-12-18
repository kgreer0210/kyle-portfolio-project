import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Particles from "../Particles/Particles";
import { Header, Footer, BackToTop } from "../components";

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
    default: "KYGR Solutions | Websites, Web & Mobile Apps, Automations",
    template: "%s | KYGR Solutions",
  },
  description:
    "KYGR Solutions builds conversion-focused websites, web & mobile apps, and automations for local businesses in middle Georgia — helping you win more leads, streamline operations, and reclaim time.",
  keywords: [
    "KYGR Solutions",
    "local business",
    "website development",
    "web app",
    "mobile app",
    "automation",
    "integration",
    "Next.js",
    "TypeScript",
    "software development",
    "custom software",
    "Houston County",
    "Bibb County",
    "Middle Georgia",
    "Macon",
    "Warner Robins",
    "Milledgeville",
  ],
  authors: [{ name: "Kyle Greer" }],
  creator: "Kyle Greer",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kygrsolutions.com",
    siteName: "KYGR Solutions",
    title: "KYGR Solutions | Custom Software for Local Businesses",
    description:
      "Helping local businesses in middle Georgia grow through custom websites, apps, and automation. Reclaim your time and win more leads.",
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
    title: "KYGR Solutions | Custom Software for Local Businesses",
    description:
      "Helping local businesses in middle Georgia grow through custom websites, apps, and automation. Reclaim your time and win more leads.",
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
        {/* Animated Particles Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Particles
            particleCount={1000}
            particleSpread={22}
            speed={1}
            particleColors={[
              "#0094c6", // blue-ncs (main accent)
              "#005e7c", // lapis-lazuli (secondary accent)
              "#001242", // penn-blue (subtle)
              "#e0e6f0", // text-primary (subtle white)
              "#a8b2d1", // text-secondary (muted)
            ]}
            moveParticlesOnHover={true}
            particleHoverFactor={1}
            alphaParticles={true}
            particleBaseSize={500}
            sizeRandomness={0.8}
            cameraDistance={25}
            disableRotation={true}
            className="opacity-50 pointer-events-auto"
          />
        </div>

        <Header />

        {/* Main Content */}
        <div className="relative z-10">
          {children}
          <Footer />
        </div>

        <BackToTop />
      </body>
    </html>
  );
}
