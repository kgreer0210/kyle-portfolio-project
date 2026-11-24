"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "motion/react";
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

const MAIN_CONTENT_ID = "main-content";

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

  // Public motion follows the visitor's reduced-motion setting.
  return (
    <MotionConfig reducedMotion="user">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-blue-ncs-strong focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
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
        {/* Each public page renders its own <main> as the first child here. */}
        <div id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
          {children}
        </div>
        <Footer />
      </div>

      {/* Floating controls sit in a landmark so no content is outside one. */}
      <aside aria-label="Quick actions">
        <BackToTop />
        <ChatWidget turnstileSiteKey={turnstileSiteKey} />
      </aside>
    </MotionConfig>
  );
}
