"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/admin",
    label: "Overview",
    icon: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  },
  {
    href: "/admin/tickets",
    label: "Tickets",
    icon: "M4 5h16v14H4z M8 9h8 M8 13h5",
  },
  {
    href: "/admin/clients",
    label: "Clients",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  },
  {
    href: "/admin/projects",
    label: "Projects",
    icon: "M3 7h18v14H3z M3 7V3h7l3 4 M8 11v6 M12 11v3 M16 11v6",
  },
  {
    href: "/admin/settings/security",
    label: "Settings",
    icon: "M4 7h16 M4 17h16 M8 4v6 M16 14v6",
  },
];

export default function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin navigation"
      className="flex gap-1 overflow-x-auto py-1 lg:flex-col lg:overflow-visible"
    >
      {items.map(({ href, label, icon }) => {
        const projectRoute =
          pathname.startsWith("/admin/projects") ||
          pathname.includes("/projects/");
        const active =
          href === "/admin"
            ? pathname === href
            : href === "/admin/projects"
              ? projectRoute
              : href === "/admin/clients"
                ? pathname.startsWith(href) && !projectRoute
                : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-ncs/15 text-white" : "text-text-secondary hover:bg-white/5 hover:text-white"}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-blue-ncs"
            >
              <path d={icon} />
            </svg>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
