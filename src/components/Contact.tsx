"use client";

import { motion } from "motion/react";

export default function Contact() {
  return (
    <motion.section
      id="contact"
      className="py-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.div
        className="card bg-(--color-oxford-blue)/90 backdrop-blur-sm border border-(--color-penn-blue) p-8 rounded-2xl text-center shadow-xl"
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.h2
          className="text-3xl font-bold text-(--color-text-headings) mb-6 drop-shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Let&apos;s Work Together
        </motion.h2>
        <motion.p
          className="text-(--color-text-secondary) text-lg mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          I&apos;m always interested in new opportunities and exciting projects.
          Let&apos;s discuss how we can bring your ideas to life.
        </motion.p>
        <motion.div
          className="flex gap-6 justify-center flex-col sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.a
            href="mailto:kylegreer.kg@gmail.com"
            className="btn-primary px-8 py-4 rounded-lg font-medium text-lg hover:bg-(--color-lapis-lazuli) transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Send Email
          </motion.a>
          <motion.a
            href="https://www.linkedin.com/in/kyle-greer-9201a3115/"
            className="btn-secondary px-8 py-4 rounded-lg font-medium text-lg border border-(--color-blue-ncs) hover:bg-(--color-penn-blue) hover:text-(--color-text-headings) transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            LinkedIn
          </motion.a>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
