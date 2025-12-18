"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { projects } from "../data/projects";

export default function Projects() {

  return (
    <motion.section
      id="projects"
      className="mb-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.h2
        className="text-2xl sm:text-3xl font-bold text-text-headings mb-6 md:mb-8 text-center drop-shadow-lg"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
      >
        Featured Projects
      </motion.h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            className="card bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue rounded-2xl overflow-hidden shadow-xl flex flex-col"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
              scale: 1.05,
              y: -10,
              borderColor: "#0094c6",
              boxShadow: "0 25px 50px -12px rgba(0, 148, 198, 0.25)",
            }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            viewport={{ once: true }}
          >
            <motion.div
              className="h-40 sm:h-48 bg-penn-blue/50 backdrop-blur-sm relative overflow-hidden"
              whileHover={{ backgroundColor: "rgba(0, 18, 66, 0.7)" }}
            >
              {project.image ? (
                <Image
                  src={project.image}
                  alt={`${project.title} screenshot`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <motion.div className="h-full flex items-center justify-center">
                  <motion.span
                    className="text-text-secondary"
                    whileHover={{ scale: 1.1, color: "#e0e6f0" }}
                  >
                    Project Image
                  </motion.span>
                </motion.div>
              )}
              {project.status && (
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      project.status === "completed"
                        ? "bg-green-500/80 text-white"
                        : project.status === "in-progress"
                        ? "bg-yellow-500/80 text-white"
                        : "bg-blue-500/80 text-white"
                    }`}
                  >
                    {project.status === "in-progress"
                      ? "In Progress"
                      : project.status === "completed"
                      ? "Completed"
                      : "Planned"}
                  </span>
                </div>
              )}
            </motion.div>
            <div className="p-4 sm:p-6 flex flex-col grow">
              <motion.h3
                className="text-lg sm:text-xl font-semibold text-text-headings mb-2 sm:mb-3"
                whileHover={{ color: "#0094c6" }}
              >
                {project.title}
              </motion.h3>
              <motion.div
                className="relative group grow"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.p className="text-text-secondary text-sm sm:text-base mb-3 sm:mb-4 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                  {project.description}
                </motion.p>
              </motion.div>
              {project.outcome && (
                <motion.div
                  className="mb-3 sm:mb-4 p-3 rounded-xl bg-rich-black/30 border border-blue-ncs/20 text-left"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <p className="text-blue-ncs text-xs sm:text-sm font-semibold mb-1">
                    Outcome
                  </p>
                  <p className="text-text-primary text-sm sm:text-base leading-relaxed">
                    {project.outcome}
                  </p>
                </motion.div>
              )}
              {project.role && (
                <p className="text-text-secondary text-xs sm:text-sm mb-3 sm:mb-4">
                  Role: {project.role}
                </p>
              )}
              <motion.div
                className="flex flex-wrap gap-2 mb-3 sm:mb-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                viewport={{ once: true }}
              >
                {project.technologies.map((tech, techIndex) => (
                  <motion.span
                    key={techIndex}
                    className="px-2 sm:px-3 py-1 bg-penn-blue/70 backdrop-blur-sm text-text-primary text-xs sm:text-sm rounded-full"
                    whileHover={{
                      scale: 1.1,
                      backgroundColor: "rgba(0, 148, 198, 0.3)",
                    }}
                  >
                    {tech}
                  </motion.span>
                ))}
              </motion.div>
              <motion.div
                className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                viewport={{ once: true }}
              >
                {project.liveUrl && (
                  <motion.a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-ncs hover:text-lapis-lazuli transition-colors duration-300 font-medium text-sm sm:text-base py-2 sm:py-0"
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Site
                  </motion.a>
                )}
                {project.backendShowcase &&
                  project.backendShowcase.available && (
                    <motion.a
                      href={`/projects/${project.id}`}
                      className="text-blue-ncs hover:text-lapis-lazuli transition-colors duration-300 font-medium text-sm sm:text-base py-2 sm:py-0"
                      whileHover={{ scale: 1.1, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Backend
                    </motion.a>
                  )}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
