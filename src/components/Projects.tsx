"use client";

import { motion } from "motion/react";
import Image from "next/image";

// Define the project data structure
interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  status?: "completed" | "in-progress" | "planned";
}

export default function Projects() {
  // Replace this array with your actual project data
  const projects: Project[] = [
    {
      id: "tacosAndMariscosOfelia",
      title: "Tacos and Mariscos Ofelia",
      description:
        "A website for a local restaurant that allows customers to view the menu, place orders, and view the restaurant's information. This project was a collaboration with a local restaurant owner to create a website that would help them reach more customers and increase their sales.",
      image: "/tacosAndMariscosOfeliaScreenshot.png",
      technologies: [
        "Next.js",
        "Tailwind CSS",
        "Convex",
        "Motion",
        "Vercel",
        "React",
        "TypeScript",
      ],
      liveUrl: "https://tacos-and-mariscos-ofelia.vercel.app/",
      githubUrl: "https://github.com/kgreer0210/tacos-and-mariscos-ofelia",
      status: "in-progress",
    },
    {
      id: "lexisFreshSlateCleanings",
      title: "Lexis Fresh Slate Cleanings",
      description:
        "A website for a local cleaning company that allows customers to view the services they offer, view the company's information, and contact the company.",
      image: "/lexisFreshSlateCleaningsScreenshot.png",
      technologies: [
        "Next.js",
        "Tailwind CSS",
        "Vercel",
        "React",
        "TypeScript",
        "Convex",
      ],
      liveUrl: "https://lexis-fresh-slate-cleaning.vercel.app/",
      githubUrl: "https://github.com/kgreer0210/lexis-fresh-slate-cleaning",
      status: "in-progress",
    },
  ];

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
            key={project.id}
            className="card bg-(--color-oxford-blue)/90 backdrop-blur-sm border border-(--color-penn-blue) rounded-2xl overflow-hidden shadow-xl flex flex-col"
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
              className="h-48 bg-(--color-penn-blue)/50 backdrop-blur-sm relative overflow-hidden"
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
                    className="text-(--color-text-secondary)"
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
            <div className="p-6 flex flex-col flex-grow">
              <motion.h3
                className="text-xl font-semibold text-(--color-text-headings) mb-3"
                whileHover={{ color: "#0094c6" }}
              >
                {project.title}
              </motion.h3>
              <motion.div
                className="relative group flex-grow"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
                viewport={{ once: true }}
              >
                <motion.p className="text-(--color-text-secondary) mb-4 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                  {project.description}
                </motion.p>
              </motion.div>
              <motion.div
                className="flex flex-wrap gap-2 mb-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.2 }}
                viewport={{ once: true }}
              >
                {project.technologies.map((tech, techIndex) => (
                  <motion.span
                    key={techIndex}
                    className="px-3 py-1 bg-(--color-penn-blue)/70 backdrop-blur-sm text-(--color-text-primary) text-sm rounded-full"
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
                className="flex gap-3 mt-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.2 }}
                viewport={{ once: true }}
              >
                {project.liveUrl && (
                  <motion.a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--color-blue-ncs) hover:text-(--color-lapis-lazuli) transition-colors duration-300 font-medium"
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Site
                  </motion.a>
                )}
                {project.githubUrl && (
                  <motion.a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--color-blue-ncs) hover:text-(--color-lapis-lazuli) transition-colors duration-300 font-medium"
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Code
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
