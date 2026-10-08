"use client";

import { motion } from "motion/react";
import Particles, { homepageParticleProps } from "@/Particles/Particles";

const steps = [
  {
    number: "01",
    title: "Free consult",
    body: "Book a 30-minute call. Tell me how your business runs today and where it's getting stuck.",
  },
  {
    number: "02",
    title: "Plan the right fit",
    body: "I map out the website, app, or automation that fits how you work — no one-size-fits-all software.",
  },
  {
    number: "03",
    title: "Build with care",
    body: "Clean code, thoughtful design, and regular check-ins so you always know where things stand.",
  },
  {
    number: "04",
    title: "Launch & partner",
    body: "Go live with confidence, then keep improving with a partner who understands your goals.",
  },
] as const;

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative isolate scroll-mt-24 overflow-hidden border-y border-white/10 bg-oxford-blue py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <Particles {...homepageParticleProps} className="opacity-50" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <motion.header
          className="max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          viewport={{ once: true }}
        >
          <p className="font-mono text-[13px] font-medium tracking-[0.1em] text-blue-ncs! uppercase">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-4 text-3xl leading-[1.15] font-bold tracking-tight text-text-headings sm:text-4xl md:text-[2.75rem]"
          >
            From first call to launch
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-[1.5] text-text-secondary!">
            A simple, collaborative process built around how your business
            actually works.
          </p>
        </motion.header>

        <ol className="grid list-none grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <motion.li
              key={step.number}
              className="relative flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-[#0c1830] p-7"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
            >
              <span
                className="h-[3px] w-10 rounded-full bg-blue-ncs"
                aria-hidden="true"
              />
              <span
                className="font-mono text-4xl leading-none font-medium text-blue-ncs"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <h3 className="text-xl font-semibold text-text-headings">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-text-secondary!">
                {step.body}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
