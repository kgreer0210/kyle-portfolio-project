"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { projects } from "../data/projects";

const MotionLink = motion.create(Link);

const consultLink = "https://calendly.com/kylegreer-kygrsolutions/30min";

const serviceHighlights = [
  "Conversion-focused websites",
  "Web & mobile apps",
  "Automation & integrations",
];

const lexisProject = projects.find(
  (project) => project.id === "lexisFreshSlateCleanings",
);

export default function Hero() {
  return (
    <motion.section
      className="relative overflow-hidden bg-[linear-gradient(148deg,var(--color-penn-blue)_14%,#03203a_54%,var(--color-rich-black)_86%)] px-4 pt-32 pb-16 sm:px-6 md:pt-40 md:pb-24 xl:pb-28"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 xl:flex-row xl:items-center xl:gap-16">
        <div className="flex w-full max-w-[620px] flex-col items-start gap-7 xl:max-w-none xl:flex-1">
          <motion.p
            className="inline-flex items-center gap-2 rounded-full border border-blue-ncs/35 bg-blue-ncs/10 py-2 pr-4 pl-3.5 font-mono text-xs font-medium tracking-[0.08em] text-[#7fd3f0]! uppercase"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <span
              className="size-2 shrink-0 rounded-full bg-[#7fd3f0]"
              aria-hidden="true"
            />
            Strategic Software & Automation Partner
          </motion.p>

          <motion.h1
            className="text-4xl leading-[1.08] font-bold tracking-tight text-balance text-text-headings! sm:text-5xl xl:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35 }}
          >
            Websites, web & mobile apps, and automations for businesses ready
            to grow
          </motion.h1>

          <motion.p
            className="max-w-[580px] text-base leading-relaxed text-text-secondary! sm:text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            We help businesses convert more visitors, streamline operations, and
            reclaim time with custom websites, modern web/mobile apps, and
            practical automations — whether you&apos;re down the street or
            across the country.
          </motion.p>

          <motion.div
            className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <MotionLink
              href={consultLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-blue-ncs px-7 py-4 text-center text-base font-semibold text-white shadow-lg transition-colors hover:bg-lapis-lazuli focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Book a 30-min call
              <span className="sr-only"> (opens in a new tab)</span>
            </MotionLink>
            <MotionLink
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-[10px] border border-white/25 bg-transparent px-7 py-4 text-center text-base font-semibold text-text-headings transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Send us an email
            </MotionLink>
          </motion.div>

          <motion.ul
            className="flex flex-wrap gap-x-6 gap-y-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
          >
            {serviceHighlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-center gap-2.5 text-sm font-medium text-text-primary"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full bg-blue-ncs"
                  aria-hidden="true"
                />
                {highlight}
              </li>
            ))}
          </motion.ul>
        </div>

        {lexisProject ? (
          <motion.figure
            className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1824] shadow-[0_24px_64px_rgba(0,148,198,0.25)] xl:w-[516px] xl:max-w-[516px] xl:shrink-0"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.35 }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              aria-hidden="true"
            >
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="relative mx-3 h-56 overflow-hidden rounded-lg sm:h-72 xl:h-[340px]">
              <Image
                src={lexisProject.image}
                alt="Screenshot of the Lexis Fresh Slate Cleanings website homepage"
                fill
                preload
                sizes="(min-width: 1280px) 516px, (min-width: 640px) 620px, 100vw"
                className="object-cover object-top"
              />
            </div>
            <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5">
              <span className="text-sm font-semibold text-text-headings">
                {lexisProject.title}
              </span>
              <span className="text-[13px] text-text-secondary">
                Client & staff portals
              </span>
            </figcaption>
          </motion.figure>
        ) : null}
      </div>
    </motion.section>
  );
}
