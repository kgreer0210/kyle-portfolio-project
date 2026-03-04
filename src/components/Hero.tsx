"use client";

import { motion } from "motion/react";
import Link from "next/link";

export default function Hero() {
  const consultLink = "https://calendly.com/kylegreer-kygrsolutions/30min";

  const serviceChips = [
    "Conversion-focused websites",
    "Web & mobile apps",
    "Automation & integrations",
  ];

  return (
    <motion.section
      className="min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-32 pb-20"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Main heading section */}
      <motion.div
        className="flex flex-col justify-center items-center w-full mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {/* Company Name */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-text-headings mb-4 md:mb-5 drop-shadow-lg px-2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          KYGR Solutions
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-blue-ncs font-semibold mb-4 md:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Websites, web & mobile apps, and automations for local businesses
        </motion.p>

        {/* Strategic Tagline */}
        <motion.div
          className="mb-6 md:mb-8 w-full px-2 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }} // Faster timing
        >
          <motion.pre
            className="text-sm sm:text-lg md:text-xl lg:text-2xl font-mono text-blue-ncs bg-background-secondary px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 rounded-lg border border-blue-ncs/20 shadow-lg overflow-x-auto max-w-full md:max-w-2xl lg:max-w-3xl mx-auto"
            whileHover={{
              scale: 1.02,
              boxShadow: "0 10px 25px rgba(0, 94, 124, 0.2)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.span
              className="text-lapis-lazuli font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.4 }}
              whileHover={{ scale: 1.05 }}
            >
              Strategic Software & Automation Partner
            </motion.span>
          </motion.pre>
        </motion.div>

        {/* Quick service chips */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8 px-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          {serviceChips.map((chip) => (
            <span
              key={chip}
              className="px-3 py-2 rounded-full bg-penn-blue/60 text-text-primary text-xs sm:text-sm border border-blue-ncs/30"
            >
              {chip}
            </span>
          ))}
        </motion.div>

        <motion.p
          className="text-base sm:text-lg md:text-xl text-text-secondary mb-6 md:mb-8 max-w-2xl mx-auto drop-shadow-md px-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
        >
          We help local businesses convert more visitors, streamline operations,
          and reclaim time with custom websites, modern web/mobile apps, and
          practical automations.
        </motion.p>
      </motion.div>

      {/* Button section */}
      <motion.div
        className="flex gap-3 sm:gap-4 justify-center flex-col sm:flex-row mb-12 md:mb-16 w-full px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.0 }}
      >
        <Link
          href={consultLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto"
        >
          <motion.button
            className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-blue-ncs text-white rounded-lg font-medium text-base sm:text-lg hover:bg-lapis-lazuli transition-all duration-300 shadow-lg hover:shadow-xl text-center"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Book a 30-min call
          </motion.button>
        </Link>
        <Link href="/contact" className="w-full sm:w-auto">
          <motion.button
            className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-transparent border border-blue-ncs text-blue-ncs hover:bg-penn-blue hover:text-white rounded-lg font-medium text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Send us an email
          </motion.button>
        </Link>
      </motion.div>
    </motion.section>
  );
}
