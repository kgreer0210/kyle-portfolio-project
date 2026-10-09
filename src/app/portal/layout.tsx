import Link from "next/link";
import type { ReactNode } from "react";
import PortalNavigation from "@/components/crm/PortalNavigation";
import SignOutButton from "@/components/crm/SignOutButton";
import { requireClientUser } from "@/lib/auth";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireClientUser();
  return (
    <div className="client-workspace min-h-screen bg-rich-black text-text-primary">
      <a
        href="#portal-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-rich-black focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b border-penn-blue bg-oxford-blue/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/portal" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-ncs font-semibold text-white">
              K
            </span>
            <span className="text-sm font-semibold text-white">
              KYGR Solutions
              <span className="block text-xs font-normal text-text-secondary">
                Your client workspace
              </span>
            </span>
          </Link>
          <div className="order-2 flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-text-secondary sm:block">
              {profile.full_name || profile.email}
            </span>
            <SignOutButton />
          </div>
          <div className="order-3 w-full min-w-0 lg:order-1 lg:w-auto lg:flex-1 lg:pl-10">
            <PortalNavigation />
          </div>
        </div>
      </header>
      <div
        id="portal-content"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-10"
      >
        {children}
      </div>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-text-secondary sm:px-6 lg:px-8">
        KYGR Solutions · Your projects and support, in one place.
      </footer>
    </div>
  );
}
