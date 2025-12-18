"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export default function Breadcrumb() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const paths = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm text-text-secondary mb-8">
      <Link href="/" className="hover:text-blue-ncs transition-colors">Home</Link>
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join("/")}`;
        const isLast = index === paths.length - 1;
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

        return (
          <div key={path} className="flex items-center gap-2">
            <span className="opacity-50">/</span>
            {isLast ? (
              <span className="text-text-primary font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-blue-ncs transition-colors">{label}</Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

