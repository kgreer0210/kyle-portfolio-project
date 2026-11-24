"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Particles, { homepageParticleProps } from "@/Particles/Particles";
import { BackToTop, Footer, Header } from "@/components";
import ChatWidget from "@/components/ChatWidget";
import { FLOATING_CLEARANCE } from "@/components/floatingControls";

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

export default function AppShell({
  children,
  turnstileSiteKey,
}: {
  children: ReactNode;
  /** Set by the server only when Turnstile verification is fully configured. */
  turnstileSiteKey?: string;
}) {
  const pathname = usePathname();
  const renderAppChrome = isAppRoute(pathname);

  if (renderAppChrome) {
    return <div className="relative z-10 min-h-screen">{children}</div>;
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(148deg,var(--color-penn-blue)_14%,#03203a_54%,var(--color-rich-black)_86%)]" />
        <Particles
          {...homepageParticleProps}
          className="pointer-events-none opacity-50"
        />
      </div>

      <Header />

      <div className={`relative z-10 ${FLOATING_CLEARANCE}`}>
        {children}
        <Footer />
      </div>

      <BackToTop />
      <ChatWidget turnstileSiteKey={turnstileSiteKey} />
    </>
  );
}
