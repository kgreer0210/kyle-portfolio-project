"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { CONSULT_CALL_URL } from "../data/contact";
import { trackBookCallClick, type CtaLocation } from "../lib/analytics";
import { useHoverMotion } from "../lib/motionPresets";

const MotionLink = motion.create(Link);

const hover = { scale: 1.03, y: -2 };
const tap = { scale: 0.98 };

/**
 * The standard CTA pair: "Book a 30-min call" (Calendly, primary) and
 * "Send me a message" (the contact form, secondary). Each is a single link
 * styled as a button, and the Calendly click is tracked for `location`.
 */
export default function CallAndMessageCtas({
  location,
  className = "",
}: {
  location: CtaLocation;
  className?: string;
}) {
  const press = useHoverMotion(hover, tap);
  return (
    <div className={`flex flex-col gap-4 sm:flex-row ${className}`}>
      <MotionLink
        href={CONSULT_CALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackBookCallClick(location)}
        className="inline-flex w-full items-center justify-center rounded-full bg-blue-ncs-strong px-8 py-4 text-center text-lg font-bold text-white shadow-lg transition-colors hover:bg-lapis-lazuli focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
        {...press}
      >
        Book a 30-min call
        <span className="sr-only"> (opens in a new tab)</span>
      </MotionLink>
      <MotionLink
        href="/contact"
        className="inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-transparent px-8 py-4 text-center text-lg font-bold text-text-headings transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
        {...press}
      >
        Send me a message
      </MotionLink>
    </div>
  );
}
