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

  const servicesAtGlance = [
    {
      title: "Website Development",
      points: [
        "Conversion-focused marketing sites that capture local leads",
        "Clear offers, fast load times, and easy editing",
      ],
    },
    {
      title: "Web & Mobile Apps",
      points: [
        "Customer and staff portals that streamline service delivery",
        "Mobile-friendly experiences for teams and clients on the go",
      ],
    },
    {
      title: "Automation & Integrations",
      points: [
        "Remove manual busywork with workflows and integrations",
        "Fewer errors, faster handoffs, and better visibility",
      ],
    },
  ];

  const processSteps = [
    {
      title: "Assess",
      detail: "Understand your goals, bottlenecks, and the outcomes you want.",
    },
    {
      title: "Build",
      detail: "Design and develop the site/app/automation with clear milestones.",
    },
    {
      title: "Launch & Optimize",
      detail: "Deploy, measure, and tune so it keeps delivering results.",
    },
  ];

  return (
    <motion.section
      id="about"
      className="py-12 md:py-20 mb-12 md:mb-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.div
        className="card p-4 sm:p-6 md:p-8 rounded-2xl bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue shadow-xl"
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-text-headings mb-4 md:mb-6"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          About Me
        </motion.h2>

        <motion.p
          className="text-blue-ncs text-base sm:text-lg font-medium mb-4"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          viewport={{ once: true }}
        >
          I build conversion-focused websites, web & mobile apps, and automations for local service businesses.
        </motion.p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {servicesAtGlance.map((service, index) => (
            <motion.div
              key={service.title}
              className="p-4 rounded-2xl bg-rich-black/40 border border-blue-ncs/20 shadow-md h-full"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ duration: 0.5, delay: 0.35 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg sm:text-xl font-semibold text-text-headings mb-2">
                {service.title}
              </h4>
              <ul className="space-y-2 text-text-secondary text-sm sm:text-base list-disc list-inside">
                {service.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="space-y-4 md:space-y-6 mb-6 md:mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-text-primary text-base sm:text-lg leading-relaxed">
            Running a service business in Middle Georgia is demanding. You need
            digital tools that win more local leads, keep clients informed, and
            remove manual work. I focus on outcomes first, not just a pretty
            site.
          </p>

          <p className="text-text-primary text-base sm:text-lg leading-relaxed">
            I run a software consulting business focused on building
            conversion-focused websites, modern web/mobile applications, and
            automation solutions for local service companies. I build with
            integrity and clarity so your digital tools feel like reliable
            employees working 24/7.
          </p>

          <p className="text-text-primary text-base sm:text-lg leading-relaxed">
            Whether you need a marketing site that converts, a customer or team
            portal, or an automation that removes repetitive tasks, we&apos;ll
            start by understanding your goals and build the strategic solution
            to match—explained in plain English.
          </p>
        </motion.div>

        <motion.h3
          className="text-xl sm:text-2xl font-semibold text-blue-ncs mb-3 md:mb-4"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          Services I Offer
        </motion.h3>

        <motion.p
          className="text-text-primary text-base sm:text-lg leading-relaxed mb-4 md:mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          viewport={{ once: true }}
        >
          I offer comprehensive software solutions tailored to your needs:
        </motion.p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="text-center p-3 sm:p-4 rounded-2xl bg-rich-black/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            viewport={{ once: true }}
          >
            <motion.h4
              className="text-lg sm:text-xl font-semibold text-blue-ncs mb-2"
              whileHover={{ scale: 1.1 }}
            >
              Web Development
            </motion.h4>
            <p className="text-text-secondary text-xs sm:text-sm">
              Conversion-focused websites built to capture local leads
            </p>
          </motion.div>
          <motion.div
            className="text-center p-3 sm:p-4 rounded-2xl bg-rich-black/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            viewport={{ once: true }}
          >
            <motion.h4
              className="text-lg sm:text-xl font-semibold text-blue-ncs mb-2"
              whileHover={{ scale: 1.1 }}
            >
              App Development
            </motion.h4>
            <p className="text-text-secondary text-xs sm:text-sm">
              Web and mobile apps that streamline service delivery and support
            </p>
          </motion.div>
          <motion.div
            className="text-center p-3 sm:p-4 rounded-2xl bg-rich-black/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            viewport={{ once: true }}
          >
            <motion.h4
              className="text-lg sm:text-xl font-semibold text-blue-ncs mb-2"
              whileHover={{ scale: 1.1 }}
            >
              Automation Consulting
            </motion.h4>
            <p className="text-text-secondary text-xs sm:text-sm">
              Automations and integrations that remove repetitive work and errors
            </p>
          </motion.div>
        </motion.div>

        <motion.h3
          className="text-xl sm:text-2xl font-semibold text-blue-ncs mb-3 md:mb-4"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          viewport={{ once: true }}
        >
          Technologies I Build With
        </motion.h3>

        <motion.p
          className="text-text-primary text-base sm:text-lg leading-relaxed mb-4 md:mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          viewport={{ once: true }}
        >
          I choose modern, proven technologies that deliver performance,
          security, and scalability for your business.
        </motion.p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          {skills.map((skill, index) => (
            <motion.div
              key={skill.title}
              className="text-center p-3 sm:p-4 rounded-2xl bg-rich-black/30 backdrop-blur-sm"
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
                className="text-lg sm:text-xl font-semibold text-blue-ncs mb-2"
                whileHover={{ scale: 1.1 }}
              >
                {skill.title}
              </motion.h3>
              <p className="text-text-secondary text-sm sm:text-base">{skill.skills}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="text-text-primary text-base sm:text-lg leading-relaxed"
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

        {/* Simple process strip */}
        <motion.div
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {processSteps.map((step, index) => (
            <motion.div
              key={step.title}
              className="p-4 rounded-2xl bg-rich-black/30 backdrop-blur-sm border border-penn-blue shadow-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -3 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <p className="text-blue-ncs text-sm font-semibold mb-1">
                {index + 1}. {step.title}
              </p>
              <p className="text-text-primary text-sm sm:text-base leading-relaxed">
                {step.detail}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
