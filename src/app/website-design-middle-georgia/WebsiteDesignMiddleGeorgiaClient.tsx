"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumb } from "../../components";
import { useReveal } from "../../lib/motionPresets";
import { IDX_PATH } from "../../data/idx";
import {
  BUSINESS_EMAIL,
  CONSULT_CALL_URL,
  EMAIL_HREF,
  PHONE_DISPLAY,
  PHONE_HREF,
} from "../../data/contact";
import {
  websiteDesignMgFaqs,
  websiteDesignMgH1,
  websiteDesignMgIntro,
  websiteDesignMgSteps,
} from "../../data/websiteDesignMiddleGeorgia";
import {
  trackBookCallClick,
  trackEmailClick,
  trackPhoneClick,
} from "@/lib/analytics";

const trackPhone = () => trackPhoneClick("local_landing");
const trackEmail = () => trackEmailClick("local_landing");

const LEXI_PATH = "/projects/lexisFreshSlateCleanings";
const DEXTER_PATH = "/projects/dexter-gordy-realtor";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs";
const textLink = `text-blue-ncs underline underline-offset-4 hover:text-lapis-lazuli ${focusRing} rounded-sm`;

const primaryButton = `inline-flex w-full items-center justify-center rounded-[10px] bg-blue-ncs-strong px-7 py-4 text-center text-base font-semibold text-white shadow-lg transition-colors hover:bg-lapis-lazuli focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto`;
const secondaryButton = `inline-flex w-full items-center justify-center rounded-[10px] border border-white/25 bg-transparent px-7 py-4 text-center text-base font-semibold text-text-headings transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto`;

function ConsultButton({ className }: { className: string }) {
  return (
    <a
      href={CONSULT_CALL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackBookCallClick("local_landing")}
    >
      Book a 30-min call
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function Section({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: ReactNode;
}) {
  const { section: reveal } = useReveal();
  return (
    <motion.section className="mb-16" aria-labelledby={id} {...reveal}>
      <h2
        id={id}
        className="mb-6 text-3xl font-bold text-text-headings md:text-4xl"
      >
        {heading}
      </h2>
      {children}
    </motion.section>
  );
}

export default function WebsiteDesignMiddleGeorgiaClient() {
  const { section: reveal, mount } = useReveal();
  return (
    <main className="pt-32 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Breadcrumb />

        <motion.div
          className="mb-16 max-w-3xl"
          {...mount}
        >
          <h1 className="mb-6 text-4xl font-bold text-text-headings md:text-5xl">
            {websiteDesignMgH1}
          </h1>
          {websiteDesignMgIntro.map((paragraph) => (
            <p
              key={paragraph}
              className="mb-4 text-lg leading-relaxed text-text-primary"
            >
              {paragraph}
            </p>
          ))}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <ConsultButton className={primaryButton} />
            <a
              href={PHONE_HREF}
              className={secondaryButton}
              onClick={trackPhone}
            >
              Call {PHONE_DISPLAY}
            </a>
          </div>
          <p className="mt-4 text-base text-text-secondary">
            Prefer to write?{" "}
            <Link href="/contact" className={textLink}>
              Send me a message
            </Link>
            .
          </p>
        </motion.div>

        <Section id="what-i-build" heading="What I build for local businesses">
          <p className="mb-6 max-w-3xl text-lg leading-relaxed text-text-primary">
            The core of this work is a conversion-focused marketing site: a
            clear offer, fast load times, a layout that works on a phone, easy
            editing, and an obvious way to call or inquire.
          </p>
          <ul className="max-w-3xl space-y-3">
            {[
              <>
                Customer or staff portals and web apps. See{" "}
                <Link href="/services" className={textLink}>
                  my services
                </Link>{" "}
                and the{" "}
                <Link href={LEXI_PATH} className={textLink}>
                  Lexi&apos;s Fresh Slate Cleanings project
                </Link>
                .
              </>,
              <>
                Automations such as one-button appointment text reminders, like
                the ones in the{" "}
                <Link href={LEXI_PATH} className={textLink}>
                  Lexi project
                </Link>
                .
              </>,
              <>
                Custom IDX property search for Georgia agents. Details are on
                the{" "}
                <Link href={IDX_PATH} className={textLink}>
                  IDX page
                </Link>
                .
              </>,
            ].map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-lg text-text-secondary"
              >
                <span
                  className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-blue-ncs"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="who-this-is-for" heading="Who this is for">
          <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-text-primary">
            <p>
              If you own a service business in Warner Robins and your site
              doesn&apos;t match the quality of your work, I can fix that. If
              you run a shop in Macon and you&apos;re tired of looking like
              every other template, I can build something that is yours. If
              you&apos;re an owner in Perry or Byron who wants someone you can
              actually talk to, you&apos;ll be talking to me.
            </p>
            <p className="text-text-secondary">
              It may not be for you if all you need is a one-page placeholder.
              A simple site builder may be enough for that, and I will tell
              you so.
            </p>
          </div>
        </Section>

        <Section id="how-different" heading="How working with me is different">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                title: "You work with me",
                body: "One person, from the first call through launch and after.",
              },
              {
                title: "I don't settle for “good enough”",
                body: "While showing a new client the admin calendar I'd built for Lexi's Fresh Slate Cleanings, I noticed it loading slowly behind a loading animation. Nobody had complained, but it wasn't up to my standard, so I fixed the slow queries anyway.",
              },
              {
                title: "I don't stop until it works the way you expect",
                body: "That means regular check-ins, fixing what feels off, and staying with the work after launch.",
              },
              {
                title: "I will tell you if you need more than a website, or less",
                body: (
                  <>
                    A Tech Stack Review and custom apps exist for a reason (see{" "}
                    <Link href="/services" className={textLink}>
                      services
                    </Link>
                    ), but I won&apos;t push them on you.
                  </>
                ),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-penn-blue bg-oxford-blue/40 p-6 md:p-8"
              >
                <h3 className="mb-3 text-xl font-bold text-text-headings">
                  {item.title}
                </h3>
                <p className="leading-relaxed text-text-secondary">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="work-done"
          heading="Work I've done for Middle Georgia clients"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-penn-blue bg-oxford-blue/40 p-6 md:p-8">
              <h3 className="mb-3 text-xl font-bold text-text-headings">
                <Link href={LEXI_PATH} className={`${textLink} no-underline`}>
                  Lexi&apos;s Fresh Slate Cleanings
                </Link>
              </h3>
              <p className="mb-4 leading-relaxed text-text-primary">
                A local cleaning company. I built a web app with customer and
                employee portals, booking, scheduling, estimate requests, and
                one-button text reminders tied to her calendar, which replaced
                hours of weekend copy-and-paste.
              </p>
              <blockquote className="border-l-2 border-blue-ncs pl-4 text-text-secondary">
                <p className="leading-relaxed">
                  “Working with Kyle Greer on my company&apos;s customized
                  website has truly transformed the way I run my business. The
                  website he created didn&apos;t just improve our online
                  presence—it completely streamlined our daily operations.”
                </p>
                <footer className="mt-2 text-sm">
                  Alexis Baker, Owner, Lexi&apos;s Fresh Slate Cleanings
                </footer>
              </blockquote>
              <p className="mt-4">
                <Link href={LEXI_PATH} className={textLink}>
                  See the Lexi project
                </Link>
              </p>
            </article>

            <article className="rounded-2xl border border-penn-blue bg-oxford-blue/40 p-6 md:p-8">
              <h3 className="mb-3 text-xl font-bold text-text-headings">
                <Link href={DEXTER_PATH} className={`${textLink} no-underline`}>
                  Dexter Gordy Realtor
                </Link>
              </h3>
              <p className="mb-4 leading-relaxed text-text-primary">
                A custom website for a Middle Georgia realtor, with IDX home
                search across Central Georgia MLS and Georgia MLS, his featured
                listings, and easy ways for buyers to reach him.
              </p>
              <p className="leading-relaxed text-text-secondary">
                I&apos;m an approved IDX vendor with access to both MLSs. If
                you&apos;re an agent who needs that work, start on the{" "}
                <Link href={IDX_PATH} className={textLink}>
                  IDX page
                </Link>
                .
              </p>
              <p className="mt-4">
                <Link href={DEXTER_PATH} className={textLink}>
                  See the Dexter Gordy project
                </Link>
              </p>
            </article>
          </div>
          <p className="mt-6 text-text-secondary">
            More work lives on the{" "}
            <Link href="/projects" className={textLink}>
              projects page
            </Link>
            .
          </p>
        </Section>

        <Section id="towns" heading="Towns I work with in Middle Georgia">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                town: "Warner Robins",
                body: "I work with owners here, and your site needs to hold up when a neighbor Googles you.",
              },
              {
                town: "Macon",
                body: "I work with Macon owners who want a site that reflects the business, not a template.",
              },
              {
                town: "Perry",
                body: "I work with Perry owners who want a direct line to the person building the site.",
              },
              {
                town: "Byron",
                body: "I work with Byron owners who want a site that holds up and a person they can reach.",
              },
            ].map((item) => (
              <div
                key={item.town}
                className="rounded-2xl border border-penn-blue bg-oxford-blue/40 p-6"
              >
                <h3 className="mb-2 text-xl font-bold text-text-headings">
                  {item.town}
                </h3>
                <p className="leading-relaxed text-text-secondary">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-text-secondary">
            {PHONE_DISPLAY} is a real local line, and I also work with clients
            farther away. This is one page for all four towns, and the way I
            work is the same wherever you are.
          </p>
        </Section>

        <motion.section
          className="mb-16"
          aria-labelledby="how-a-project-works"
          {...reveal}
        >
          <h2
            id="how-a-project-works"
            className="mb-6 text-3xl font-bold text-text-headings md:text-4xl"
          >
            How a project works
          </h2>
          <ol className="grid list-none grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {websiteDesignMgSteps.map((step) => (
              <li
                key={step.number}
                className="flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-[#0c1830] p-7"
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
                <p className="text-[15px] leading-relaxed text-text-secondary">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </motion.section>

        <Section id="faq" heading="Questions owners usually ask">
          <div className="max-w-3xl space-y-4">
            {websiteDesignMgFaqs.map((faq) => (
              <details
                key={faq.question}
                className="mg-faq rounded-2xl border border-penn-blue bg-oxford-blue/40 transition-colors open:border-blue-ncs/40"
              >
                <summary className="px-5 py-4 md:px-6">
                  <h3 className="text-lg font-semibold text-text-headings md:text-xl">
                    {faq.question}
                  </h3>
                  <svg
                    className="mg-faq-chevron h-5 w-5 text-blue-ncs"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 leading-relaxed text-text-secondary md:px-6">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </Section>

        <motion.section
          className="rounded-3xl border border-blue-ncs/20 bg-blue-ncs/10 p-8 text-center md:p-14"
          aria-labelledby="lets-talk"
          {...reveal}
        >
          <h2
            id="lets-talk"
            className="mb-4 text-3xl font-bold text-text-headings md:text-4xl"
          >
            Let&apos;s talk about the site you&apos;ve been picturing
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-text-primary">
            Hard problems welcome. I work with owners across Middle Georgia, or
            farther away. Book a call, phone me, or send a message through the
            contact form.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <ConsultButton className={primaryButton} />
            <a
              href={PHONE_HREF}
              className={secondaryButton}
              onClick={trackPhone}
            >
              Call {PHONE_DISPLAY}
            </a>
            <Link href="/contact" className={secondaryButton}>
              Send me a message
            </Link>
          </div>
          <p className="mt-6 text-text-secondary">
            Or email{" "}
            <a href={EMAIL_HREF} className={textLink} onClick={trackEmail}>
              {BUSINESS_EMAIL}
            </a>
            . Want the longer story first? Read{" "}
            <Link href="/about" className={textLink}>
              about me
            </Link>
            .
          </p>
        </motion.section>
      </div>
    </main>
  );
}
