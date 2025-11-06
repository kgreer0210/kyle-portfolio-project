"use client";

import { motion } from "motion/react";

export default function About() {
  const skills = [
    {
      title: "Frontend",
      skills: "React, Next.js, TypeScript, Tailwind CSS",
    },
    {
      title: "Backend",
      skills: "Node.js, Express, PostgreSQL, Vite",
    },
    {
      title: "Infrastructure & Tools",
      skills: "Git, Docker, Vercel, Supabase, Convex",
    },
  ];

  return (
    <motion.section
      id="about"
      className="py-20 mb-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.div
        className="card p-4 sm:p-6 md:p-8 rounded-2xl bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue shadow-xl w-full overflow-x-hidden"
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-text-headings mb-6"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          About Me
        </motion.h2>

        <motion.div
          className="space-y-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-text-primary text-base sm:text-lg leading-relaxed">
            Running a business in Middle Georgia is demanding. You&apos;re an
            expert in your field, but maybe the digital side of things feels
            like a whole other job you didn&apos;t sign up for. You know you
            need professional software solutions, but you want more than just a
            pretty website. You need something that actually drives growth and
            streamlines your operations.
          </p>

          <p className="text-text-primary text-base sm:text-lg leading-relaxed">
            That&apos;s where I come in. My name is Kyle, and I run a software
            consulting business focused on helping businesses like yours succeed
            through custom software development, automation solutions, and
            modern web applications. I believe in building with integrity and
            serving clients with excellence—creating digital solutions that
            become your most effective employees, working 24/7 to grow your
            business.
          </p>

          <p className="text-text-primary text-base sm:text-lg leading-relaxed">
            Whether you need a custom web application, automation to streamline
            repetitive tasks, or mobile app development, I approach every
            project with a focus on solving real problems. We&apos;ll start by
            understanding your unique challenges and goals, then build strategic
            solutions using the best modern technology—delivering results that
            matter, not just code.
          </p>
        </motion.div>

        <motion.h3
          className="text-2xl font-semibold text-blue-ncs mb-4"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          Services I Offer
        </motion.h3>

        <motion.p
          className="text-text-primary text-lg leading-relaxed mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          viewport={{ once: true }}
        >
          I offer comprehensive software solutions tailored to your needs:
        </motion.p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="text-center p-4 rounded-2xl bg-rich-black/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            viewport={{ once: true }}
          >
            <motion.h4
              className="text-xl font-semibold text-blue-ncs mb-2"
              whileHover={{ scale: 1.1 }}
            >
              Web Development
            </motion.h4>
            <p className="text-text-secondary text-sm">
              Custom websites and web applications built to drive results
            </p>
          </motion.div>
          <motion.div
            className="text-center p-4 rounded-2xl bg-rich-black/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            viewport={{ once: true }}
          >
            <motion.h4
              className="text-xl font-semibold text-blue-ncs mb-2"
              whileHover={{ scale: 1.1 }}
            >
              App Development
            </motion.h4>
            <p className="text-text-secondary text-sm">
              Mobile and desktop applications that solve real business problems
            </p>
          </motion.div>
          <motion.div
            className="text-center p-4 rounded-2xl bg-rich-black/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            viewport={{ once: true }}
          >
            <motion.h4
              className="text-xl font-semibold text-blue-ncs mb-2"
              whileHover={{ scale: 1.1 }}
            >
              Automation Consulting
            </motion.h4>
            <p className="text-text-secondary text-sm">
              Identify and automate repetitive processes to save time and money
            </p>
          </motion.div>
        </motion.div>

        <motion.h3
          className="text-2xl font-semibold text-blue-ncs mb-4"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          viewport={{ once: true }}
        >
          Technologies I Build With
        </motion.h3>

        <motion.p
          className="text-text-primary text-lg leading-relaxed mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          viewport={{ once: true }}
        >
          I choose modern, proven technologies that deliver performance,
          security, and scalability for your business.
        </motion.p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          {skills.map((skill, index) => (
            <motion.div
              key={skill.title}
              className="text-center p-4 rounded-2xl bg-rich-black/30 backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{
                duration: 0.6,
                delay: 1.0 + index * 0.2,
              }}
              viewport={{ once: true }}
            >
              <motion.h3
                className="text-xl font-semibold text-blue-ncs mb-2"
                whileHover={{ scale: 1.1 }}
              >
                {skill.title}
              </motion.h3>
              <p className="text-text-secondary">{skill.skills}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="text-text-primary text-lg leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          viewport={{ once: true }}
        >
          But technology is only part of the story. My process is simple and
          always starts with understanding your goals, not writing code.
          We&apos;ll figure out what you want to achieve, and then I&apos;ll
          build the strategic, high-performance solution to get you
          there—explaining everything in plain English along the way. I believe
          in doing work that matters, with honesty and care for your success.
        </motion.p>
      </motion.div>
    </motion.section>
  );
}
