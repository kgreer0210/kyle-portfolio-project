"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function AboutPage() {
  return (
    <main className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-text-headings mb-12">
            About <span className="text-blue-ncs">KYGR Solutions</span>
          </h1>
        </motion.div>

        {/* Section 1: About Me */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-text-headings mb-6">
                About
              </h2>
              <div className="space-y-6 text-lg text-text-primary leading-relaxed">
                <p>
                  My name is Kyle Greer, and I’m the founder of KYGR Solutions.
                  I’m a software developer, husband, and father of three young
                  children. I started this business with a clear goal in mind: to
                  build something meaningful that serves others well and to build
                  a business that honors God, supports my family, and allows me to
                  be a faithful steward of the skills I’ve been given.
                </p>
                <p>
                  KYGR Solutions was born out of a desire to use technology
                  responsibly and purposefully — not just to build software, but
                  to solve real problems for real people. I work closely with
                  businesses and organizations to understand what they actually
                  need, then design solutions that are simple, reliable, and easy
                  to use.
                </p>
              </div>
            </motion.div>

            {/* Photo Placeholder Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative aspect-[4/3] w-full bg-blue-ncs/5 rounded-3xl border-2 border-dashed border-blue-ncs/20 flex items-center justify-center overflow-hidden group hover:border-blue-ncs/40 transition-colors"
            >
              <div className="text-center p-6">
                <div className="text-blue-ncs/30 group-hover:text-blue-ncs/50 mb-4 flex justify-center transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-headings mb-2">
                  Family Photo
                </h3>
                <p className="text-text-secondary">Coming Soon</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Mission */}
        <section className="mb-20">
          <motion.div
            className="bg-blue-ncs/5 p-8 md:p-12 rounded-3xl border border-blue-ncs/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-blue-ncs mb-6">Mission</h2>
            <p className="text-2xl text-text-primary leading-relaxed font-medium">
              To help businesses and organizations use technology as a tool —
              not a burden — by delivering honest, high-quality software
              solutions that improve efficiency, clarity, and trust.
            </p>
          </motion.div>
        </section>

        {/* Section 3: Values */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-text-headings mb-10">
              Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Built with Purpose",
                  desc: "My work is guided by faith, integrity, and stewardship. I believe technology should do what it claims to do and be built with care and intention.",
                },
                {
                  title: "People Over Platforms",
                  desc: "I don’t push one-size-fits-all software. I focus on understanding how you work and building solutions that fit your needs.",
                },
                {
                  title: "Clarity & Craftsmanship",
                  desc: "Clean code, thoughtful design, and a strong user experience matter. Good software should feel intuitive, not frustrating.",
                },
                {
                  title: "Trust Through Partnership",
                  desc: "I aim to be more than just a developer. I want to be a trusted partner who understands your goals and helps you move forward with confidence.",
                },
              ].map((value, idx) => (
                <motion.div
                  key={idx}
                  className="p-8 rounded-2xl bg-oxford-blue/30 border border-penn-blue hover:border-blue-ncs/50 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-xl font-bold text-blue-ncs mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-primary text-lg leading-relaxed">
                    {value.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <motion.div
          className="text-center bg-blue-ncs/10 p-12 rounded-3xl border border-blue-ncs/20"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-text-headings mb-6">
            Ready to streamline your business?
          </h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Let&apos;s discuss how we can build the digital tools your business
            needs to grow and thrive.
          </p>
          <Link href="/contact">
            <motion.button
              className="px-10 py-4 bg-blue-ncs text-white font-bold rounded-full text-lg hover:bg-lapis-lazuli transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get a Free Consult
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
