"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/portal", label: "Home" },
  { href: "/portal/projects", label: "Projects" },
  { href: "/portal/tickets", label: "Support" },
  { href: "/portal/settings/security", label: "Settings" },
];

export default function PortalNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Client navigation" className="flex gap-1 overflow-x-auto">
      {links.map(({ href, label }) => {
        const active =
          href === "/portal" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition ${active ? "bg-blue-ncs/15 text-white" : "text-text-secondary hover:bg-white/5 hover:text-white"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
