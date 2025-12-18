"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "../../components";
import { projects } from "../../data/projects";

export default function ProjectsPage() {
  return (
    <main className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb />
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-text-headings mb-6 text-center">
            Case <span className="text-blue-ncs">Studies</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto text-center">
            A look at the strategic solutions I&apos;ve built to help local businesses streamline operations and grow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              className="group relative bg-oxford-blue/30 border border-penn-blue rounded-3xl overflow-hidden hover:border-blue-ncs transition-colors duration-500"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rich-black via-transparent to-transparent opacity-60" />
              </div>
              <div className="p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.slice(0, 4).map((tech, idx) => (
                    <span key={idx} className="px-3 py-1 bg-penn-blue/50 text-xs rounded-full text-text-secondary">
                      {tech}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl font-bold text-text-headings mb-3 group-hover:text-blue-ncs transition-colors">
                  {project.title}
                </h2>
                <p className="text-text-secondary mb-6 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex items-center justify-between">
                  <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-blue-ncs font-bold group/link">
                    View Case Study
                    <motion.svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </motion.svg>
                  </Link>
                  {project.status === "completed" && (
                    <span className="text-xs font-bold text-green-500/80 bg-green-500/10 px-2 py-1 rounded">Live</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}

