import Link from "next/link";
import type { ReactNode } from "react";
import AdminNavigation from "@/components/crm/AdminNavigation";
import SignOutButton from "@/components/crm/SignOutButton";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireAdminUser();
  return (
    <div className="admin-workspace min-h-screen bg-rich-black text-text-primary lg:grid lg:grid-cols-[216px_minmax(0,1fr)]">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-rich-black focus:p-3"
      >
        Skip to content
      </a>
      <aside className="border-b border-penn-blue bg-oxford-blue/40 px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 lg:py-6">
        <Link
          href="/admin"
          className="mb-4 flex items-center gap-3 px-2 lg:mb-8"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-ncs font-semibold text-white">
            K
          </span>
          <span className="text-sm font-semibold text-white">
            KYGR Solutions
            <span className="block text-xs font-normal text-text-secondary">
              Workspace
            </span>
          </span>
        </Link>
        <AdminNavigation />
        <div className="mt-auto hidden border-t border-penn-blue px-2 pt-5 lg:block">
          <p className="truncate text-sm font-medium text-white">
            {profile.full_name || "Administrator"}
          </p>
          <p className="mt-1 truncate text-xs text-text-secondary">
            {profile.email}
          </p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-14 items-center justify-between border-b border-penn-blue px-5 lg:px-8">
          <p className="text-xs font-medium text-text-secondary">
            Client operations
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-text-secondary hover:text-white"
            >
              View website ↗
            </Link>
            <div className="lg:hidden">
              <SignOutButton />
            </div>
          </div>
        </header>
        <div
          id="admin-content"
          tabIndex={-1}
          className="mx-auto max-w-[1600px] px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
