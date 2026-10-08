"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Particles, { homepageParticleProps } from "@/Particles/Particles";
import { BackToTop, Footer, Header } from "@/components";
import ChatWidget from "@/components/ChatWidget";

const appPrefixes = [
  "/login",
  "/reset-password",
  "/portal",
  "/admin",
  "/auth",
];

function isAppRoute(pathname: string): boolean {
  return appPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const renderAppChrome = isAppRoute(pathname);

  if (renderAppChrome) {
    return <div className="relative z-10 min-h-screen">{children}</div>;
  }

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Particles {...homepageParticleProps} />
      </div>

      <Header />

      <div className="relative z-10">
        {children}
        <Footer />
      </div>

      <BackToTop />
      <ChatWidget />
    </>
  );
}
