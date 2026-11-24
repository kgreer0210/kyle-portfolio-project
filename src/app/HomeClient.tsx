"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Hero, HowItWorks, Testimonials } from "../components";
import { CONSULT_CALL_URL } from "../data/contact";
import { IDX_PATH, idxOffering } from "../data/idx";
import { getFeaturedProjects } from "../data/projects";
import { services } from "../data/services";
import { trackBookCallClick, type CtaLocation } from "../lib/analytics";
import { useHoverMotion, useReveal } from "../lib/motionPresets";

const MotionLink = motion.create(Link);

const LINK_HOVER = { scale: 1.05 };
const LINK_TAP = { scale: 0.95 };

const outlineLinkClass =
  "inline-flex items-center justify-center px-6 py-3 rounded-xl border border-blue-ncs text-blue-ncs font-bold hover:bg-blue-ncs-strong hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs";

const primaryLinkClass =
  "inline-flex items-center justify-center px-8 py-4 bg-blue-ncs-strong text-white font-bold rounded-full hover:bg-lapis-lazuli transition-colors shadow-lg shadow-blue-ncs/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Primary CTA: opens the Consult call on Calendly and tracks the click. */
function BookCallLink({
  ctaLocation,
  className,
}: {
  ctaLocation: CtaLocation;
  className: string;
}) {
  const linkPress = useHoverMotion(LINK_HOVER, LINK_TAP);
  return (
    <MotionLink
      href={CONSULT_CALL_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackBookCallClick(ctaLocation)}
      className={className}
      {...linkPress}
    >
      Book a 30-min call
      <span className="sr-only"> (opens in a new tab)</span>
    </MotionLink>
  );
}

/** Secondary CTA: a text link to the contact form. */
function SendMessageLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/contact"
      className={`font-bold text-blue-ncs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs rounded-sm ${className}`}
    >
      Send me a message
    </Link>
  );
}

export default function HomeClient() {
  // Handle page refresh - always start at top and clear hash
  useEffect(() => {
    // If Supabase auth tokens land here (e.g. an invite/recovery link whose
    // redirect fell back to the Site URL), hand them off to the dedicated
    // callback handler instead of wiping them below.
    if (window.location.hash.includes("access_token")) {
      window.location.href = "/auth/callback" + window.location.hash;
      return;
    }
    window.scrollTo(0, 0);
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  const featuredProjects = getFeaturedProjects();
  const { section } = useReveal();
  const linkPress = useHoverMotion(LINK_HOVER, LINK_TAP);

  return (
    <div>
      <main className="relative z-10">
        {/* Hero Section */}
        <Hero />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Value Proposition / Intro */}
        <section className="py-20 text-center">
          <motion.div
            {...section}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-text-headings mb-6">
              Digital Tools That{" "}
              <span className="text-blue-ncs">Work for You</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              I build websites, web & mobile apps, and automations that win
              you more leads and take work off your plate. And I don’t
              settle for “good enough.” I sweat the details nobody
              else would notice, because the work should be right.
            </p>
            <p className="text-lg text-text-secondary max-w-3xl mx-auto leading-relaxed mt-4">
              Based in Middle Georgia? See{" "}
              <Link
                href="/website-design-middle-georgia"
                className="text-blue-ncs underline underline-offset-4 hover:text-lapis-lazuli focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs rounded-sm"
              >
                website design for Warner Robins, Macon, Perry, and Byron
              </Link>
              .
            </p>
          </motion.div>
        </section>

        {/* Services Summary */}
        <motion.section className="py-20" {...section}>
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
            <MotionLink
              href="/services"
              className={outlineLinkClass}
              {...linkPress}
            >
              View All Services
            </MotionLink>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="p-8 rounded-2xl bg-oxford-blue/40 border border-penn-blue hover:border-blue-ncs/50 transition-colors"
              >
                <h3 className="text-xl font-bold text-blue-ncs mb-3">
                  {service.title}
                </h3>
                <p className="text-text-secondary mb-4">
                  {service.description}
                </p>
                {/* Bullet 1 restates the description, so show bullets 2–3. */}
                <ul className="space-y-2 mb-6">
                  {service.points.slice(1, 3).map((point, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-text-primary flex gap-2"
                    >
                      <span className="text-blue-ncs">•</span> {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack Review Spotlight */}
        <motion.section className="py-20" {...section}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
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
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
                <BookCallLink
                  ctaLocation="home_tech_review"
                  className={primaryLinkClass}
                />
                <SendMessageLink />
              </div>
            </div>

            <div
              className="p-8 rounded-2xl bg-oxford-blue/60 border border-blue-ncs/30"
            >
              <h3 className="text-xl font-bold text-blue-ncs mb-6">
                What’s Included
              </h3>
              <ul className="space-y-4">
                {[
                  "Audit your current tools, software, and workflows",
                  "Identify redundancies, gaps, and hidden costs",
                  "Get a prioritized action plan you can act on immediately",
                  "No jargon — just clear, honest recommendations",
                ].map((point, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-text-primary"
                  >
                    <span className="mt-1 w-5 h-5 rounded-full bg-blue-ncs/10 border border-blue-ncs/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-blue-ncs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        <motion.section className="py-20" aria-labelledby="idx-home-heading" {...section}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-ncs/10 text-blue-ncs border border-blue-ncs/30 mb-6">
                IDX for Real Estate
              </span>
              <h2
                id="idx-home-heading"
                className="text-3xl md:text-4xl font-bold text-text-headings mb-5"
              >
                {idxOffering.headline}
              </h2>
              <p className="text-lg text-text-primary font-medium mb-4">
                {idxOffering.subhead}
              </p>
              <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                {idxOffering.body}
              </p>
              <MotionLink
                href={IDX_PATH}
                className={primaryLinkClass}
                {...linkPress}
              >
                See the IDX offering
              </MotionLink>
            </div>

            <div
              className="p-8 rounded-2xl bg-oxford-blue/60 border border-blue-ncs/30"
            >
              <h3 className="text-xl font-bold text-blue-ncs mb-6">
                Built into your site
              </h3>
              <ul className="space-y-4">
                {idxOffering.features.slice(0, 4).map((point) => (
                  <li key={point} className="flex gap-3 text-text-primary">
                    <span className="mt-1 w-5 h-5 rounded-full bg-blue-ncs/10 border border-blue-ncs/40 flex items-center justify-center shrink-0">
                      <svg
                        className="w-3 h-3 text-blue-ncs"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm font-semibold text-blue-ncs">
                {idxOffering.pricing}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Story: first client */}
        <motion.section className="py-20" aria-labelledby="weekends-story-heading" {...section}>
          <div
            className="rounded-3xl border border-blue-ncs/10 bg-blue-ncs/5 p-8 md:p-12"
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-ncs/10 text-blue-ncs border border-blue-ncs/30 mb-6">
              A story from my first client
            </span>
            <h2
              id="weekends-story-heading"
              className="text-3xl md:text-4xl font-bold text-text-headings mb-5"
            >
              Her weekends back
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-3xl">
              Lexi runs Lexi’s Fresh Slate Cleanings. She was spending
              hours every weekend copying and pasting reminder texts to her
              customers. I built a system tied to her calendar that sends them
              all with one button. The carrier registration paperwork for
              texting was the least fun part of the build, but I pushed
              through. She’s told me it gave her weekends back. That’s
              the kind of work I love.
            </p>
            <Link
              href="/projects/lexisFreshSlateCleanings"
              className="text-blue-ncs font-bold inline-flex items-center gap-2"
            >
              See the project
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </motion.section>
        </div>

        <HowItWorks />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Featured Projects */}
        <motion.section className="py-20" {...section}>
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-text-headings mb-4">
                Featured Work
              </h2>
              <p className="text-lg text-text-secondary">
                Real projects for real people, from a Realtor’s home
                search to a cleaning business owner who got her weekends back.
              </p>
            </div>
            <MotionLink
              href="/projects"
              className={outlineLinkClass}
              {...linkPress}
            >
              View All Projects
            </MotionLink>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-oxford-blue/30 border border-penn-blue rounded-3xl overflow-hidden"
              >
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(min-width: 1200px) 532px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
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
              </div>
            ))}
          </div>
        </motion.section>

        {/* Testimonials */}
        <section className="py-20">
          <Testimonials />
        </section>

        {/* Final CTA */}
        <section className="py-20 text-center">
          <motion.div
            className="relative overflow-hidden rounded-[3rem] border border-blue-ncs/20 bg-oxford-blue/70 p-12 shadow-2xl backdrop-blur-sm md:p-20"
            {...section}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-ncs/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-lapis-lazuli/10 blur-[100px] rounded-full -ml-32 -mb-32" />

            <h2 className="text-4xl md:text-5xl font-bold text-text-headings mb-8 relative z-10">
              Ready to grow your <br />
              <span className="text-blue-ncs">business?</span>
            </h2>
            <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">
              Let’s build the thing you’ve been picturing, and give
              you your time back. Hard problems welcome.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 relative z-10">
              <BookCallLink
                ctaLocation="home_final"
                className="inline-flex w-full items-center justify-center rounded-full bg-blue-ncs-strong px-10 py-4 text-lg font-bold text-white shadow-xl shadow-blue-ncs/20 transition-colors hover:bg-lapis-lazuli focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              />
              <MotionLink
                href="/about"
                className="inline-flex w-full items-center justify-center rounded-full border border-penn-blue bg-transparent px-10 py-4 text-lg font-bold text-text-primary transition-colors hover:border-blue-ncs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs sm:w-auto"
                {...linkPress}
              >
                About me
              </MotionLink>
            </div>
            <p className="relative z-10 mt-8 text-lg text-text-secondary">
              Prefer to write? <SendMessageLink />
            </p>
          </motion.div>
        </section>
        </div>
      </main>
    </div>
  );
}

