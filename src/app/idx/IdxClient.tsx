"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumb } from "../../components";
import { IDX_CONTACT_HREF, idxOffering } from "../../data/idx";
import {
  DEXTER_LIVE_URL,
  DEXTER_PROJECT_PATH,
  GAMLS_LISTING_DATA_URL,
  GAMLS_WEBSITE_URL,
  IDX_PAGE_H1,
  LISA_LIVE_URL,
  LISA_PROJECT_PATH,
  WEBSITE_DESIGN_LINK_TOKEN,
  idxBothMls,
  idxBuildExtrasIntro,
  idxBuildIntro,
  idxDifferent,
  idxFaqHeading,
  idxFaqs,
  idxFinalCta,
  idxPageExtraFeatures,
  idxPageIntro,
  idxSteps,
  idxWhatIs,
  idxWhyCustom,
  idxWork,
} from "../../data/idxPage";
import {
  BUSINESS_EMAIL,
  CONSULT_CALL_URL,
  EMAIL_HREF,
  PHONE_DISPLAY,
  PHONE_HREF,
} from "../../data/contact";
import {
  WEBSITE_DESIGN_MG_PATH,
} from "../../data/websiteDesignMiddleGeorgia";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs";
const textLink = `text-blue-ncs underline underline-offset-4 hover:text-lapis-lazuli ${focusRing} rounded-sm`;

const primaryButton = `inline-flex w-full items-center justify-center rounded-[10px] bg-blue-ncs px-7 py-4 text-center text-base font-semibold text-white shadow-lg transition-colors hover:bg-lapis-lazuli focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto`;
const secondaryButton = `inline-flex w-full items-center justify-center rounded-[10px] border border-white/25 bg-transparent px-7 py-4 text-center text-base font-semibold text-text-headings transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto`;

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true },
} as const;

function ExternalLink({
  href,
  className = textLink,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
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

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 text-lg leading-relaxed text-text-primary">
      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-ncs/40 bg-blue-ncs/10">
        <svg
          className="h-3 w-3 text-blue-ncs"
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
      <span>{children}</span>
    </div>
  );
}

const cardClass =
  "rounded-2xl border border-penn-blue bg-oxford-blue/40 p-6 md:p-8";
const bodyText = "max-w-3xl text-lg leading-relaxed text-text-primary";

/** Renders an FAQ answer, turning the Middle Georgia path into a link. */
function FaqAnswer({ answer }: { answer: string }) {
  const [before, after] = answer.split(WEBSITE_DESIGN_LINK_TOKEN);
  if (after === undefined) return <>{answer}</>;
  return (
    <>
      {before}
      <Link href={WEBSITE_DESIGN_MG_PATH} className={textLink}>
        {WEBSITE_DESIGN_LINK_TOKEN}
      </Link>
      {after}
    </>
  );
}

export default function IdxClient() {
  return (
    <main className="pt-32 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Breadcrumb />

        <motion.div
          className="mb-16 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-6 inline-block rounded-full border border-blue-ncs/30 bg-blue-ncs/10 px-3 py-1 text-xs font-bold text-blue-ncs">
            IDX for Real Estate
          </span>
          <h1 className="mb-6 text-4xl font-bold text-text-headings md:text-5xl">
            {IDX_PAGE_H1}
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-text-primary md:text-xl">
            {idxPageIntro}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href={IDX_CONTACT_HREF} className={primaryButton}>
              {idxOffering.cta}
            </Link>
            <ExternalLink href={CONSULT_CALL_URL} className={secondaryButton}>
              Book a 30-min call
            </ExternalLink>
          </div>
          <p className="mt-4 text-base text-text-secondary">
            Or call{" "}
            <a href={PHONE_HREF} className={textLink}>
              {PHONE_DISPLAY}
            </a>{" "}
            or email{" "}
            <a href={EMAIL_HREF} className={textLink}>
              {BUSINESS_EMAIL}
            </a>
            .
          </p>
        </motion.div>

        <Section id="idx-what-i-build" heading="What I build">
          <p className={`${bodyText} mb-6`}>{idxBuildIntro}</p>
          <ul className="mb-10 grid list-none grid-cols-1 gap-4 md:grid-cols-2">
            {idxOffering.features.map((feature) => (
              <li key={feature} className={cardClass}>
                <CheckItem>{feature}</CheckItem>
              </li>
            ))}
          </ul>
          <p className={`${bodyText} mb-4`}>{idxBuildExtrasIntro}</p>
          <ul className="mb-6 grid list-none grid-cols-1 gap-4 md:grid-cols-2">
            {idxPageExtraFeatures.map((feature) => (
              <li key={feature} className={cardClass}>
                <CheckItem>{feature}</CheckItem>
              </li>
            ))}
          </ul>
          <p className="text-text-secondary">
            See them on the{" "}
            <Link href={DEXTER_PROJECT_PATH} className={textLink}>
              Dexter Gordy project
            </Link>{" "}
            and the{" "}
            <Link href={LISA_PROJECT_PATH} className={textLink}>
              Lisa Dunn project
            </Link>
            .
          </p>
        </Section>

        <Section id="idx-do-you-need-custom" heading={idxWhyCustom.heading}>
          <div className="space-y-4">
            <p className={bodyText}>
              {idxWhyCustom.intro} Details are on the{" "}
              <ExternalLink href={GAMLS_WEBSITE_URL}>
                {idxWhyCustom.linkLabel}
              </ExternalLink>{" "}
              page.
            </p>
            <p className={bodyText}>{idxWhyCustom.outro}</p>
          </div>
          <ul className="mt-6 grid max-w-3xl list-none grid-cols-1 gap-4">
            {idxWhyCustom.reasons.map((reason) => (
              <li key={reason} className={cardClass}>
                <CheckItem>{reason}</CheckItem>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="idx-both-mls" heading={idxBothMls.heading}>
          <div className="space-y-4">
            <p className={bodyText}>{idxBothMls.intro}</p>
            <p className={bodyText}>
              {idxBothMls.dexter}{" "}
              <Link href={DEXTER_PROJECT_PATH} className={textLink}>
                See the Dexter Gordy project
              </Link>
              .
            </p>
            <p className={bodyText}>
              {idxBothMls.cgmlsOnly}{" "}
              <Link href={LISA_PROJECT_PATH} className={textLink}>
                See the Lisa Dunn project
              </Link>
              .
            </p>
          </div>
        </Section>

        <Section id="idx-what-is" heading={idxWhatIs.heading}>
          <p className={bodyText}>
            {idxWhatIs.body} See how{" "}
            <ExternalLink href={GAMLS_LISTING_DATA_URL}>
              {idxWhatIs.linkLabel}
            </ExternalLink>
            . {idxWhatIs.after}
          </p>
        </Section>

        <Section id="idx-different" heading={idxDifferent.heading}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {idxDifferent.points.map((point) => (
              <div key={point.title} className={cardClass}>
                <h3 className="mb-3 text-xl font-bold text-text-headings">
                  {point.title}
                </h3>
                <p className="leading-relaxed text-text-secondary">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="idx-work" heading={idxWork.heading}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className={cardClass}>
              <h3 className="mb-3 text-xl font-bold text-text-headings">
                <Link
                  href={DEXTER_PROJECT_PATH}
                  className={`${textLink} no-underline`}
                >
                  {idxWork.dexter.title}
                </Link>
              </h3>
              <p className="mb-4 leading-relaxed text-text-primary">
                {idxWork.dexter.body}
              </p>
              <p className="flex flex-wrap gap-x-6 gap-y-2">
                <Link href={DEXTER_PROJECT_PATH} className={textLink}>
                  See the Dexter Gordy project
                </Link>
                <ExternalLink href={DEXTER_LIVE_URL}>Visit the live site</ExternalLink>
              </p>
            </article>

            <article className={cardClass}>
              <h3 className="mb-3 text-xl font-bold text-text-headings">
                <Link
                  href={LISA_PROJECT_PATH}
                  className={`${textLink} no-underline`}
                >
                  {idxWork.lisa.title}
                </Link>
              </h3>
              <p className="mb-4 leading-relaxed text-text-primary">
                {idxWork.lisa.body}
              </p>
              <p className="flex flex-wrap gap-x-6 gap-y-2">
                <Link href={LISA_PROJECT_PATH} className={textLink}>
                  See the Lisa Dunn project
                </Link>
                <ExternalLink href={LISA_LIVE_URL}>Visit the live site</ExternalLink>
              </p>
            </article>
          </div>
          <p className="mt-6 text-text-secondary">
            {idxWork.more}{" "}
            <Link href="/projects" className={textLink}>
              projects page
            </Link>
            .
          </p>
        </Section>

        <motion.section
          className="mb-16"
          aria-labelledby="idx-how-a-project-works"
          {...reveal}
        >
          <h2
            id="idx-how-a-project-works"
            className="mb-6 text-3xl font-bold text-text-headings md:text-4xl"
          >
            How a project works
          </h2>
          <ol className="grid list-none grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {idxSteps.map((step) => (
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
                  {"linkUrl" in step && (
                    <>
                      {" "}
                      <ExternalLink href={step.linkUrl}>
                        {step.linkLabel}
                      </ExternalLink>
                      .
                    </>
                  )}
                </p>
              </li>
            ))}
          </ol>
        </motion.section>

        <Section id="idx-faq" heading={idxFaqHeading}>
          <div className="max-w-3xl space-y-4">
            {idxFaqs.map((faq) => (
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
                  <FaqAnswer answer={faq.answer} />
                </p>
              </details>
            ))}
          </div>
        </Section>

        <motion.section
          className="rounded-3xl border border-blue-ncs/20 bg-blue-ncs/10 p-8 text-center md:p-14"
          aria-labelledby="idx-talk-to-me"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2
            id="idx-talk-to-me"
            className="mb-4 text-3xl font-bold text-text-headings md:text-4xl"
          >
            {idxFinalCta.heading}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-text-primary">
            {idxFinalCta.body}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href={IDX_CONTACT_HREF} className={primaryButton}>
              {idxOffering.cta}
            </Link>
            <ExternalLink href={CONSULT_CALL_URL} className={secondaryButton}>
              Book a 30-min call
            </ExternalLink>
            <a href={PHONE_HREF} className={secondaryButton}>
              Call {PHONE_DISPLAY}
            </a>
          </div>
          <p className="mt-6 text-text-secondary">
            Or email{" "}
            <a href={EMAIL_HREF} className={textLink}>
              {BUSINESS_EMAIL}
            </a>
            . Related pages:{" "}
            <Link href={WEBSITE_DESIGN_MG_PATH} className={textLink}>
              website design in Middle Georgia
            </Link>
            ,{" "}
            <Link href="/services" className={textLink}>
              my services
            </Link>
            ,{" "}
            <Link href="/projects" className={textLink}>
              projects
            </Link>
            , and{" "}
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
