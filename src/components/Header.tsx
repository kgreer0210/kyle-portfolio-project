"use client";

import { motion } from "motion/react";

export default function Header() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      className="bg-rich-black/80 backdrop-blur-sm border-b border-penn-blue p-4 sm:p-6 w-full overflow-x-hidden"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <nav className="max-w-6xl mx-auto flex justify-between items-center px-4 sm:px-0 gap-2 sm:gap-6">
        <motion.h1
          className="text-lg sm:text-2xl font-bold text-blue-ncs whitespace-nowrap flex-shrink-0"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
        >
          Kyle&apos;s Portfolio
        </motion.h1>
        <motion.div
          className="flex gap-2 sm:gap-6 flex-shrink-0"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            onClick={() => scrollToSection("about")}
            className="nav-link hover:text-text-primary transition-all duration-300 text-sm sm:text-base whitespace-nowrap"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            About
          </motion.button>
          <motion.button
            onClick={() => scrollToSection("projects")}
            className="nav-link hover:text-text-primary transition-all duration-300 text-sm sm:text-base whitespace-nowrap"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Projects
          </motion.button>
          <motion.button
            onClick={() => scrollToSection("contact")}
            className="nav-link hover:text-text-primary transition-all duration-300 text-sm sm:text-base whitespace-nowrap"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact
          </motion.button>
        </motion.div>
      </nav>
    </motion.header>
  );
}
