"use client";

import { useId, useRef, useState, type TouchEvent } from "react";
import { motion } from "motion/react";
import { GOOGLE_REVIEWS_URL } from "../data/contact";
import { testimonials } from "../data/testimonials";
import TestimonialAuthor from "./TestimonialAuthor";

// Horizontal distance (px) a touch must travel to count as a swipe.
const SWIPE_THRESHOLD = 50;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs";

const arrowButtonClass = `p-2 md:p-3 rounded-full bg-oxford-blue/80 border border-penn-blue text-blue-ncs hover:bg-oxford-blue hover:border-blue-ncs transition-colors duration-300 shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center ${focusRing}`;

// One reveal for the whole section: short travel, strong ease-out.
const REVEAL_EASE = [0.23, 1, 0.32, 1] as const;

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const idPrefix = useId();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const total = testimonials.length;

  const goToSlide = (index: number) => {
    setCurrentIndex(((index % total) + total) % total);
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const nextSlide = () => goToSlide(currentIndex + 1);
  const prevSlide = () => goToSlide(currentIndex - 1);

  // Plain touch events (supported by every iOS Safari version) so a horizontal
  // swipe changes slides while vertical page scrolling is left untouched.
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch || total <= 1) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  };

  return (
    <motion.section
      id="testimonials"
      className="mb-20"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: REVEAL_EASE }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-text-headings mb-4 drop-shadow-lg">
          Reviews from Google
        </h2>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          These are reviews my clients left on Google, in their own words.
          I&apos;m happy to share more on a call.
        </p>
      </div>

      <div className="flex justify-center">
        <div
          className="relative w-full max-w-3xl mx-auto"
          role="region"
          aria-roledescription="carousel"
          aria-label="Google reviews"
        >
          {/*
            Controls sit above the card so their position never depends on
            the active card's height: repeated clicks land in the same spot.
          */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                type="button"
                onClick={prevSlide}
                className={arrowButtonClass}
                aria-label="Previous testimonial"
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex items-center">
                {testimonials.map((testimonial, index) => {
                  const isActive = index === currentIndex;
                  return (
                    <button
                      key={testimonial.id}
                      type="button"
                      onClick={() => goToSlide(index)}
                      className={`group flex items-center justify-center w-9 h-11 rounded-full ${focusRing}`}
                      aria-label={`Go to testimonial ${index + 1} of ${total}`}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span
                        aria-hidden="true"
                        className={`block h-2 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                          isActive
                            ? "w-6 bg-blue-ncs"
                            : "w-2 bg-penn-blue group-hover:bg-blue-ncs/50"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={nextSlide}
                className={arrowButtonClass}
                aria-label="Next testimonial"
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 md:w-6 md:h-6"
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
              </button>
            </div>
          )}

          {/*
            Only the active slide is displayed, so the card is exactly as tall
            as its own review. Inactive slides stay in the DOM with the hidden
            attribute (display:none), which also removes them from the tab
            order and accessibility tree.
          */}
          <div
            className="overflow-hidden"
            aria-live="polite"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => {
              touchStart.current = null;
            }}
          >
            {testimonials.map((testimonial, index) => {
              const isActive = index === currentIndex;
              const paragraphs = Array.isArray(testimonial.quote)
                ? testimonial.quote
                : [testimonial.quote];
              const { excerpt } = testimonial;
              const isExpanded = expandedIds.has(testimonial.id);
              const shownParagraphs =
                excerpt && !isExpanded ? [excerpt] : paragraphs;
              const quoteId = `${idPrefix}-review-${testimonial.id}`;

              return (
                <figure
                  key={testimonial.id}
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${total}`}
                  aria-hidden={!isActive}
                  hidden={!isActive}
                  className="testimonial-slide min-w-0 card p-5 sm:p-6 md:p-8 rounded-2xl bg-oxford-blue/90 border border-penn-blue shadow-xl flex flex-col"
                >
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 md:w-10 md:h-10 mb-4 shrink-0 text-blue-ncs opacity-50"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h3.983v10h-9.984z" />
                  </svg>

                  <div className="mb-6 flex flex-col">
                    <blockquote
                      id={quoteId}
                      className="text-text-primary text-base leading-relaxed md:leading-loose"
                    >
                      {shownParagraphs.map((paragraph, pIndex) => (
                        <p
                          key={pIndex}
                          className={pIndex > 0 ? "mt-3 md:mt-4" : undefined}
                        >
                          {paragraph}
                        </p>
                      ))}
                    </blockquote>

                    {excerpt ? (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(testimonial.id)}
                        aria-expanded={isExpanded}
                        aria-controls={quoteId}
                        className={`self-start mt-4 min-h-[44px] py-2 text-blue-ncs font-semibold underline underline-offset-4 decoration-blue-ncs/50 hover:decoration-blue-ncs rounded ${focusRing}`}
                      >
                        {isExpanded ? "Show less" : "Read the full review"}
                      </button>
                    ) : null}
                  </div>

                  <figcaption className="pt-5 md:pt-6 border-t border-penn-blue">
                    <TestimonialAuthor
                      name={testimonial.name}
                      role={testimonial.role}
                      company={testimonial.company}
                    />
                  </figcaption>
                </figure>
              );
            })}
          </div>

          <p className="mt-6 text-center">
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 min-h-[44px] text-blue-ncs font-semibold underline underline-offset-4 decoration-blue-ncs/50 hover:decoration-blue-ncs rounded ${focusRing}`}
            >
              See all reviews on Google
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        </div>
      </div>
    </motion.section>
  );
}
