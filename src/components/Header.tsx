"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navItems } from "../data/navigation";
import { PHONE_DISPLAY, PHONE_HREF } from "../data/contact";
import { trackPhoneClick } from "../lib/analytics";
import { useBodyScrollLock } from "../lib/useBodyScrollLock";

const MOBILE_MENU_ID = "mobile-menu";
const CONTACT_HREF = "/contact";
// The Contact CTA already links to /contact, so the page links leave it out.
const pageNavItems = navItems.filter((item) => item.href !== CONTACT_HREF);

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasMenuOpen = useRef(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const menuOpenRef = useRef(false);
  useEffect(() => {
    menuOpenRef.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  useBodyScrollLock(isMobileMenuOpen);

  // Focus follows the drawer: into its first link on open, back to the toggle
  // on close (Escape, the toggle, the backdrop, or a link).
  useEffect(() => {
    if (isMobileMenuOpen) {
      drawerRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    } else if (wasMenuOpen.current) {
      toggleRef.current?.focus();
    }
    wasMenuOpen.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      // While the scroll lock pins the body, scrollY reads 0. Ignore that.
      if (menuOpenRef.current) return;
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,padding,backdrop-filter] duration-300 ${
        isScrolled
          ? "border-b border-white/10 bg-rich-black/75! py-3 backdrop-blur-md md:py-4"
          : "bg-transparent! py-4 md:py-6"
      }`}
    >
      <nav
        aria-label="Main"
        className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center"
      >
        <Link
          href="/"
          aria-label="KYGR Solutions home"
          className="flex shrink-0 items-center rounded-md transition-transform duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-95"
        >
          <Image
            src="/logo.svg"
            alt=""
            width={282}
            height={120}
            className="w-auto h-12 md:h-[60px] brightness-0 invert"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden shrink-0 items-center gap-3 md:flex lg:gap-6 xl:gap-8">
          {pageNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`text-sm font-medium transition-[color,transform] duration-200 hover:text-blue-ncs motion-safe:hover:-translate-y-0.5 ${
                pathname === item.href ? "text-blue-ncs" : "text-text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="inline-block whitespace-nowrap rounded-full border border-blue-ncs px-4 py-2 text-sm font-semibold text-blue-ncs transition-[background-color,color,transform] duration-200 hover:bg-blue-ncs-strong hover:text-white motion-safe:hover:scale-105 motion-safe:active:scale-95 xl:px-5"
          >
            Client Login
          </Link>
          <Link
            href={CONTACT_HREF}
            aria-current={pathname === CONTACT_HREF ? "page" : undefined}
            className="inline-block whitespace-nowrap rounded-full bg-blue-ncs-strong px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-lapis-lazuli motion-safe:hover:scale-105 motion-safe:active:scale-95 xl:px-5"
          >
            Contact
          </Link>
        </div>

        {/* Mobile menu toggle. Sits above the drawer so it can also close it. */}
        <button
          ref={toggleRef}
          type="button"
          className="relative z-[60] md:hidden p-2 text-text-primary hover:text-blue-ncs transition-colors"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls={MOBILE_MENU_ID}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              aria-hidden="true"
            />

            <motion.nav
              id={MOBILE_MENU_ID}
              ref={drawerRef}
              aria-label="Mobile"
              className="fixed top-0 right-0 h-dvh w-72 max-w-[85vw] overflow-y-auto overscroll-contain bg-oxford-blue/95 backdrop-blur-xl border-l border-penn-blue z-50 md:hidden shadow-2xl pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex min-h-full flex-col pt-24 px-8 pb-8 gap-6">
                {pageNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`text-xl font-semibold block py-2 ${
                      pathname === item.href
                        ? "text-blue-ncs"
                        : "text-text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="mt-4 block w-full py-4 rounded-xl border border-blue-ncs text-blue-ncs font-bold text-lg text-center"
                >
                  Client Login
                </Link>
                <Link
                  href={CONTACT_HREF}
                  onClick={closeMobileMenu}
                  aria-current={pathname === CONTACT_HREF ? "page" : undefined}
                  className="block w-full py-4 rounded-xl bg-blue-ncs-strong text-white font-bold text-lg text-center"
                >
                  Contact
                </Link>
                <a
                  href={PHONE_HREF}
                  onClick={() => trackPhoneClick("mobile_menu")}
                  className="block py-2 text-center text-base font-semibold text-text-primary hover:text-blue-ncs"
                >
                  Call {PHONE_DISPLAY}
                </a>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
