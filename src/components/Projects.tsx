"use client";

import { motion } from "motion/react";

export default function Projects() {
  const projects = [1, 2, 3];

  return (
    <motion.section
      id="projects"
      className="py-20 mb-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.h2
        className="text-3xl font-bold text-(--color-text-headings) mb-8 text-center drop-shadow-lg"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        Featured Projects
      </motion.h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
      >
        {projects.map((project, index) => (
          <motion.div
            key={project}
            className="card bg-(--color-oxford-blue)/90 backdrop-blur-sm border border-(--color-penn-blue) rounded-2xl overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
              scale: 1.05,
              y: -10,
              borderColor: "#0094c6",
              boxShadow: "0 25px 50px -12px rgba(0, 148, 198, 0.25)",
            }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            viewport={{ once: true }}
          >
            <motion.div
              className="h-48 bg-(--color-penn-blue)/50 backdrop-blur-sm flex items-center justify-center"
              whileHover={{ backgroundColor: "rgba(0, 18, 66, 0.7)" }}
            >
              <motion.span
                className="text-(--color-text-secondary)"
                whileHover={{ scale: 1.1, color: "#e0e6f0" }}
              >
                Project Image
              </motion.span>
            </motion.div>
            <div className="p-6">
              <motion.h3
                className="text-xl font-semibold text-(--color-text-headings) mb-3"
                whileHover={{ color: "#0094c6" }}
              >
                Project {project}
              </motion.h3>
              <motion.p
                className="text-(--color-text-secondary) mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
                viewport={{ once: true }}
              >
                A brief description of this amazing project and the technologies
                used to build it.
              </motion.p>
              <motion.div
                className="flex gap-2 mb-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.2 }}
                viewport={{ once: true }}
              >
                <motion.span
                  className="px-3 py-1 bg-(--color-penn-blue)/70 backdrop-blur-sm text-(--color-text-primary) text-sm rounded-full"
                  whileHover={{
                    scale: 1.1,
                    backgroundColor: "rgba(0, 148, 198, 0.3)",
                  }}
                >
                  React
                </motion.span>
                <motion.span
                  className="px-3 py-1 bg-(--color-penn-blue)/70 backdrop-blur-sm text-(--color-text-primary) text-sm rounded-full"
                  whileHover={{
                    scale: 1.1,
                    backgroundColor: "rgba(0, 148, 198, 0.3)",
                  }}
                >
                  TypeScript
                </motion.span>
              </motion.div>
              <motion.div
                className="flex gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.2 }}
                viewport={{ once: true }}
              >
                <motion.a
                  href="#"
                  className="text-(--color-blue-ncs) hover:text-(--color-lapis-lazuli) transition-colors duration-300 font-medium"
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Live Demo
                </motion.a>
                <motion.a
                  href="#"
                  className="text-(--color-blue-ncs) hover:text-(--color-lapis-lazuli) transition-colors duration-300 font-medium"
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  GitHub
                </motion.a>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
