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
      skills: "Node.js, Express, PostgreSQL",
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
        className="card p-8 rounded-2xl bg-(--color-oxford-blue)/90 backdrop-blur-sm border border-(--color-penn-blue) shadow-xl"
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.h2
          className="text-3xl font-bold text-(--color-text-headings) mb-6"
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
          <p className="text-(--color-text-primary) text-lg leading-relaxed">
            Running a business in Middle Georgia is demanding. You&apos;re an
            expert in your field, but maybe the digital side of things feels
            like a whole other job you didn&apos;t sign up for. You know you
            need a professional website, but you want more than just a pretty
            design. You need something that actually brings in customers.
          </p>

          <p className="text-(--color-text-primary) text-lg leading-relaxed">
            That&apos;s where I come in. My name is Kyle, and I&apos;m a
            passionate web developer who believes your website should be your
            most effective employee—one that works 24/7 to grow your business.
          </p>

          <p className="text-(--color-text-primary) text-lg leading-relaxed">
            I love creating user-friendly applications that solve real-world
            problems. For me, that means using my expertise in responsive design
            and full-stack development to build a strategic asset that works for
            you. We&apos;ll combine a deep understanding of your business goals
            with the best modern technology to build a site that not only looks
            great but delivers tangible results.
          </p>
        </motion.div>

        <motion.h3
          className="text-2xl font-semibold text-(--color-blue-ncs) mb-4"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          My Toolkit for Building Your Growth Engine
        </motion.h3>

        <motion.p
          className="text-(--color-text-primary) text-lg leading-relaxed mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          viewport={{ once: true }}
        >
          To bring our strategy to life, I use a modern and robust set of
          technologies chosen for their performance, security, and scalability.
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
              className="text-center p-4 rounded-2xl bg-(--color-rich-black)/30 backdrop-blur-sm"
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
                className="text-xl font-semibold text-(--color-blue-ncs) mb-2"
                whileHover={{ scale: 1.1 }}
              >
                {skill.title}
              </motion.h3>
              <p className="text-(--color-text-secondary)">{skill.skills}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="text-(--color-text-primary) text-lg leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          viewport={{ once: true }}
        >
          But technology is only part of the story. My process is simple and
          always starts with your goals, not with code. We&apos;ll figure out
          what you want to achieve, and then I&apos;ll build the strategic,
          high-performance website to get you there, explaining everything in
          plain English along the way.
        </motion.p>
      </motion.div>
    </motion.section>
  );
}
