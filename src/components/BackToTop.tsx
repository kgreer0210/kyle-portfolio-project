"use client";

import { motion, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { FLOATING_ABOVE_CHAT } from "./floatingControls";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      // Show button when scrolled past 50% of viewport height
      setIsVisible(latest > window.innerHeight * 0.8);
    });

    return () => unsubscribe();
  }, [scrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Clear hash from URL without adding to history
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  };

  if (!isVisible) return null;

  return (
    <motion.button
      onClick={scrollToTop}
      className={`${FLOATING_ABOVE_CHAT} z-40 h-12 w-12 bg-blue-ncs-strong hover:bg-lapis-lazuli text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center`}
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      whileHover={{
        scale: 1.1,
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 17 },
      }}
      whileTap={{
        scale: 0.9,
        transition: { type: "spring", stiffness: 400, damping: 17 },
      }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      aria-label="Back to top"
    >
      <svg
        aria-hidden="true"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </motion.button>
  );
}
