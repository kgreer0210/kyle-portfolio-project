import Link from "next/link";
import type { ReactNode } from "react";
import SignOutButton from "@/components/crm/SignOutButton";
import { requireAdminUser } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/onboarding", label: "Onboarding" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/clients/new", label: "New Client" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireAdminUser();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#000022_0%,#040f16_60%,#040f16_100%)] text-text-primary">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-6 rounded-[2rem] border border-penn-blue bg-oxford-blue/80 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-ncs">
              Admin CRM
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Welcome back, {profile.full_name || profile.email}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-penn-blue px-4 py-2 text-sm text-text-secondary transition hover:border-blue-ncs hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <SignOutButton />
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
