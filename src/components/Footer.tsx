"use client";

import { motion } from "motion/react";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <motion.footer
      className="bg-(--color-oxford-blue)/80 backdrop-blur-sm border-t border-(--color-penn-blue) py-8 mt-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        <motion.p
          className="text-(--color-text-secondary)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          whileHover={{ color: "#e0e6f0" }}
        >
          © {currentYear} Kyle&apos;s Portfolio. Built with Next.js, Motion, and
          Tailwind CSS.
        </motion.p>
      </div>
    </motion.footer>
  );
}
