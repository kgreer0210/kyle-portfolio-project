"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Particles from "@/Particles/Particles";
import { BackToTop, Footer, Header } from "@/components";

const appPrefixes = ["/login", "/reset-password", "/portal", "/admin", "/auth"];

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
        <Particles
          particleCount={1000}
          particleSpread={22}
          speed={1}
          particleColors={["#0094c6", "#005e7c", "#001242", "#e0e6f0", "#a8b2d1"]}
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

      <div className="relative z-10">
        {children}
        <Footer />
      </div>

      <BackToTop />
    </>
  );
}
