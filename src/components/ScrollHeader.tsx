"use client";

import { motion, useScroll } from "motion/react";
import { useEffect, useState } from "react";

export default function ScrollHeader() {
  const [isVisible, setIsVisible] = useState(false);
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
  };

  if (!isVisible) return null;

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-(--color-oxford-blue)/90 backdrop-blur-md border-b border-(--color-penn-blue) shadow-lg"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <nav className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-xl font-bold text-(--color-blue-ncs) hover:text-(--color-text-primary) transition-colors duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Kyle&apos;s Portfolio
        </motion.button>
        <motion.div
          className="flex gap-6"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
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
