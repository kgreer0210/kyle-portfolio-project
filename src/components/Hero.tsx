"use client";

import { motion } from "motion/react";

export default function Hero() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.section
      className="min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Main heading section */}
      <motion.div
        className="flex-1 flex flex-col justify-center items-center w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {/* Name */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-text-headings mb-6 md:mb-8 drop-shadow-lg px-2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Kyle Greer
        </motion.h1>

        {/* JSON Developer title */}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 1.0 }}
            >
              {"{ "}
            </motion.span>
            <motion.span
              className="text-text-secondary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 1.2 }}
            >
              title:
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 1.3 }}
            >
              {' "'}
            </motion.span>
            <motion.span
              className="text-lapis-lazuli font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.4 }}
              whileHover={{ scale: 1.05 }}
            >
              Software Consultant & Developer
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 1.6 }}
            >
              {'" }'}
            </motion.span>
          </motion.pre>
        </motion.div>

        <motion.p
          className="text-base sm:text-lg md:text-xl text-text-secondary mb-6 md:mb-8 max-w-2xl mx-auto drop-shadow-md px-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
        >
          Helping businesses grow through custom software solutions, automation
          consulting, and modern web applications built with purpose and
          excellence.
        </motion.p>
      </motion.div>

      {/* Button section */}
      <motion.div
        className="flex gap-3 sm:gap-4 justify-center flex-col sm:flex-row mb-12 md:mb-16 w-full px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.0 }}
      >
        <motion.button
          onClick={() => scrollToSection("projects")}
          className="btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-lapis-lazuli transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          View My Work
        </motion.button>
        <motion.button
          onClick={() => scrollToSection("contact")}
          className="btn-secondary px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg border border-blue-ncs hover:bg-penn-blue hover:text-text-headings transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Get In Touch
        </motion.button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.2 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-blue-ncs rounded-full flex justify-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-1 h-3 bg-blue-ncs rounded-full mt-2"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
