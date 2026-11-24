"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { CONSULT_CALL_URL } from "../data/contact";
import { projects } from "../data/projects";
import { trackBookCallClick, trackMessageClick } from "../lib/analytics";
import { useHoverMotion, useReveal } from "../lib/motionPresets";

const MotionLink = motion.create(Link);

// The H1 is the mobile LCP element, so it and the copy around it render
// visible in the server HTML. Only the CTA row and the highlights get one
// short shared reveal: the on-mount preset from useReveal.

const serviceHighlights = [
  "Conversion-focused websites",
  "Web & mobile apps",
  "Automation & integrations",
];

const lexisProject = projects.find(
  (project) => project.id === "lexisFreshSlateCleanings",
);

export default function Hero() {
  const { mount: secondaryReveal } = useReveal();
  const ctaPress = useHoverMotion({ scale: 1.03, y: -2 }, { scale: 0.98 });
  return (
    <section className="px-4 pt-32 pb-16 sm:px-6 md:pt-40 md:pb-24 xl:pb-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 xl:flex-row xl:items-center xl:gap-16">
        <div className="flex w-full max-w-[620px] flex-col items-start gap-7 xl:max-w-none xl:flex-1">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-ncs/35 bg-blue-ncs/10 py-1.5 pr-3 pl-3 font-mono text-[11px] leading-snug font-medium tracking-[0.04em] text-[#7fd3f0]! uppercase sm:py-2 sm:pr-4 sm:pl-3.5 sm:text-xs sm:tracking-[0.08em]">
            <span
              className="size-2 shrink-0 rounded-full bg-[#7fd3f0]"
              aria-hidden="true"
            />
            Strategic Software & Automation Partner
          </p>

          <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-balance text-text-headings! sm:text-5xl xl:text-6xl">
            Websites, web & mobile apps, and automations for businesses ready
            to grow
          </h1>

          <p className="max-w-[580px] text-base leading-relaxed text-text-secondary! sm:text-lg">
            Have an idea you’ve been carrying around? I’ll turn it
            into a website, app, or automation that does exactly what you
            pictured, and then some, so you get your time back. Down the street
            or across the country.
          </p>

          <motion.div
            className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row"
            {...secondaryReveal}
          >
            <MotionLink
              href={CONSULT_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackBookCallClick("hero")}
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-blue-ncs-strong px-7 py-4 text-center text-base font-semibold text-white shadow-lg transition-colors hover:bg-lapis-lazuli focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              {...ctaPress}
            >
              Book a 30-min call
              <span className="sr-only"> (opens in a new tab)</span>
            </MotionLink>
            <MotionLink
              href="/contact"
              onClick={() => trackMessageClick("hero")}
              className="inline-flex w-full items-center justify-center rounded-[10px] border border-white/25 bg-transparent px-7 py-4 text-center text-base font-semibold text-text-headings transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              {...ctaPress}
            >
              Send me a message
            </MotionLink>
          </motion.div>

          <motion.ul
            className="flex flex-wrap gap-x-6 gap-y-3"
            {...secondaryReveal}
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
          <figure className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1824] shadow-[0_24px_64px_rgba(0,148,198,0.25)] xl:w-[516px] xl:max-w-[516px] xl:shrink-0">
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
                alt="Screenshot of the Lexi’s Fresh Slate Cleanings website homepage"
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
                Portals + one-button text reminders
              </span>
            </figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
