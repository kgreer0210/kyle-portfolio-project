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
      className="bg-(--color-rich-black)/80 backdrop-blur-sm border-b border-(--color-penn-blue) p-6"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <nav className="max-w-6xl mx-auto flex justify-between items-center">
        <motion.h1
          className="text-2xl font-bold text-(--color-blue-ncs)"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
        >
          Kyle&apos;s Portfolio
        </motion.h1>
        <motion.div
          className="flex gap-6"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            onClick={() => scrollToSection("about")}
            className="nav-link hover:text-(--color-text-primary) transition-all duration-300"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            About
          </motion.button>
          <motion.button
            onClick={() => scrollToSection("projects")}
            className="nav-link hover:text-(--color-text-primary) transition-all duration-300"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Projects
          </motion.button>
          <motion.button
            onClick={() => scrollToSection("contact")}
            className="nav-link hover:text-(--color-text-primary) transition-all duration-300"
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
