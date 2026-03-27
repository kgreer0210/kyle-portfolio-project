"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Hero, Testimonials } from "../components";
import { projects } from "../data/projects";
import { services } from "../data/services";

export default function HomeClient() {
  // Handle page refresh - always start at top and clear hash
  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  const featuredProjects = projects.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Hero Section */}
      <div className="relative z-10">
        <Hero />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Value Proposition / Intro */}
        <section className="py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-text-headings mb-6">
              Digital Tools That{" "}
              <span className="text-blue-ncs">Work for You</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              I build conversion-focused websites, web & mobile apps, and
              automations for businesses ready to grow—helping you win more
              leads, streamline operations, and reclaim your time.
            </p>
          </motion.div>
        </section>

        {/* Services Summary */}
        <section className="py-20 border-t border-penn-blue/30">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-text-headings mb-4">
                Core Services
              </h2>
              <p className="text-lg text-text-secondary">
                Custom-built solutions to solve your specific business
                bottlenecks.
              </p>
            </div>
            <Link href="/services">
              <motion.button
                className="px-6 py-3 rounded-xl border border-blue-ncs text-blue-ncs font-bold hover:bg-blue-ncs hover:text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View All Services
              </motion.button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                className="p-8 rounded-2xl bg-oxford-blue/40 border border-penn-blue hover:border-blue-ncs/50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-blue-ncs mb-3">
                  {service.title}
                </h3>
                <p className="text-text-secondary mb-4 line-clamp-2">
                  {service.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {service.points.slice(0, 2).map((point, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-text-primary flex gap-2"
                    >
                      <span className="text-blue-ncs">•</span> {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tech Stack Review Spotlight */}
        <section className="py-20 border-t border-penn-blue/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-ncs/10 text-blue-ncs border border-blue-ncs/30 mb-6">
                New Service
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-headings mb-5">
                Is Your Tech Stack{" "}
                <span className="text-blue-ncs">Working for You?</span>
              </h2>
              <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                Most businesses are paying for tools they barely use, missing
                automations that could save hours each week, and patching
                together workflows that should just work. A Tech Stack Review
                gives you a clear picture of where you stand — and exactly what
                to do next.
              </p>
              <Link href="/contact">
                <motion.button
                  className="px-8 py-4 bg-blue-ncs text-white font-bold rounded-full hover:bg-lapis-lazuli transition-all shadow-lg shadow-blue-ncs/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Schedule Your Tech Audit
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              className="p-8 rounded-2xl bg-oxford-blue/60 border border-blue-ncs/30"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold text-blue-ncs mb-6">
                What&apos;s Included
              </h3>
              <ul className="space-y-4">
                {[
                  "Audit your current tools, software, and workflows",
                  "Identify redundancies, gaps, and hidden costs",
                  "Get a prioritized action plan you can act on immediately",
                  "No jargon — just clear, honest recommendations",
                ].map((point, idx) => (
                  <motion.li
                    key={idx}
                    className="flex gap-3 text-text-primary"
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
                    viewport={{ once: true }}
                  >
                    <span className="mt-1 w-5 h-5 rounded-full bg-blue-ncs/10 border border-blue-ncs/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-blue-ncs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {point}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="py-20 border-t border-penn-blue/30">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-text-headings mb-4">
                Featured Work
              </h2>
              <p className="text-lg text-text-secondary">
                See how I&apos;ve helped businesses like yours succeed.
              </p>
            </div>
            <Link href="/projects">
              <motion.button
                className="px-6 py-3 rounded-xl border border-blue-ncs text-blue-ncs font-bold hover:bg-blue-ncs hover:text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View All Projects
              </motion.button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                className="group relative bg-oxford-blue/30 border border-penn-blue rounded-3xl overflow-hidden"
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-rich-black via-transparent to-transparent opacity-60" />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-text-headings mb-2">
                    {project.title}
                  </h3>
                  <p className="text-text-secondary mb-6 line-clamp-2">
                    {project.description}
                  </p>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-blue-ncs font-bold inline-flex items-center gap-2"
                  >
                    View Project
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 border-t border-penn-blue/30">
          <Testimonials />
        </section>

        {/* Final CTA */}
        <section className="py-20 border-t border-penn-blue/30 text-center">
          <motion.div
            className="bg-linear-to-br from-oxford-blue to-rich-black p-12 md:p-20 rounded-[3rem] border border-blue-ncs/20 shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-ncs/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-lapis-lazuli/10 blur-[100px] rounded-full -ml-32 -mb-32" />

            <h2 className="text-4xl md:text-5xl font-bold text-text-headings mb-8 relative z-10">
              Ready to grow your <br />
              <span className="text-blue-ncs">business?</span>
            </h2>
            <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">
              Stop fighting with manual tasks and messy workflows. Let&apos;s
              build the digital systems that give you your time back.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
              <Link href="/contact">
                <motion.button
                  className="w-full sm:w-auto px-10 py-4 bg-blue-ncs text-white font-bold rounded-full text-lg hover:bg-lapis-lazuli transition-all shadow-xl shadow-blue-ncs/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Schedule Your Free Consult
                </motion.button>
              </Link>
              <Link href="/about">
                <motion.button
                  className="w-full sm:w-auto px-10 py-4 bg-transparent border border-penn-blue text-text-primary font-bold rounded-full text-lg hover:border-blue-ncs transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Meet the Developer
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </motion.div>
  );
}

