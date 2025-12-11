"use client";

import { motion, useScroll, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ScrollHeader() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      // Show header almost immediately when starting to scroll
      setIsVisible(latest > 100);
    });

    return () => unsubscribe();
  }, [scrollY]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-oxford-blue/90 backdrop-blur-md border-b border-penn-blue shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <nav className="max-w-6xl mx-auto flex justify-between items-center px-4 md:px-6 py-3 md:py-4">
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center text-lg md:text-xl font-bold text-blue-ncs hover:text-text-primary transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/logo.svg"
              alt="KYGR Solutions logo"
              width={150}
              height={150}
              className="object-contain drop-shadow-sm"
              priority
            />
          </motion.button>

          {/* Desktop Navigation */}
          <motion.div
            className="hidden md:flex gap-6"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <motion.button
              onClick={() => scrollToSection("about")}
              className="nav-link hover:text-text-primary transition-all duration-300"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              About
            </motion.button>
            <motion.button
              onClick={() => scrollToSection("projects")}
              className="nav-link hover:text-text-primary transition-all duration-300"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Projects
            </motion.button>
            <motion.button
              onClick={() => scrollToSection("contact")}
              className="nav-link hover:text-text-primary transition-all duration-300"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact
            </motion.button>
          </motion.div>

          {/* Mobile Hamburger Button */}
          <motion.button
            className="md:hidden p-2 text-text-primary hover:text-blue-ncs transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
          </motion.button>
        </nav>
      </motion.header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-64 bg-oxford-blue/95 backdrop-blur-md border-l border-penn-blue z-50 md:hidden shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex flex-col h-full pt-20 px-6">
                <motion.button
                  onClick={() => scrollToSection("about")}
                  className="text-left py-4 text-lg text-text-primary hover:text-blue-ncs transition-colors border-b border-penn-blue"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  About
                </motion.button>
                <motion.button
                  onClick={() => scrollToSection("projects")}
                  className="text-left py-4 text-lg text-text-primary hover:text-blue-ncs transition-colors border-b border-penn-blue"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Projects
                </motion.button>
                <motion.button
                  onClick={() => scrollToSection("contact")}
                  className="text-left py-4 text-lg text-text-primary hover:text-blue-ncs transition-colors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Contact
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
