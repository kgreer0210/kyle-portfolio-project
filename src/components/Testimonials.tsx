"use client";

import { useRef, useState, type TouchEvent } from "react";
import { motion } from "motion/react";
import { testimonials } from "../data/testimonials";
import TestimonialAuthor from "./TestimonialAuthor";

// Horizontal distance (px) a touch must travel to count as a swipe.
const SWIPE_THRESHOLD = 50;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs";

const arrowButtonClass = `p-2 md:p-3 rounded-full bg-oxford-blue/80 border border-penn-blue text-blue-ncs hover:bg-oxford-blue hover:border-blue-ncs transition-colors duration-300 shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center ${focusRing}`;

function QuoteMark({ side }: { side: "open" | "close" }) {
  return (
    <span
      aria-hidden="true"
      className={`text-blue-ncs text-2xl md:text-3xl font-serif leading-none align-top ${
        side === "open" ? "mr-2" : "ml-2"
      }`}
    >
      {side === "open" ? "\u201C" : "\u201D"}
    </span>
  );
}

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const total = testimonials.length;

  const goToSlide = (index: number) => {
    setCurrentIndex(((index % total) + total) % total);
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
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-text-headings mb-4 drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          What Clients Say
        </motion.h2>
        <motion.p
          className="text-text-secondary text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Here&apos;s what my clients have to say. I&apos;m happy to share more on a
          call.
        </motion.p>
      </motion.div>

      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <div
          className="relative w-full max-w-3xl mx-auto"
          role="region"
          aria-roledescription="carousel"
          aria-label="Client testimonials"
        >
          {/*
            Every slide sits in the same grid cell, so the track is always as
            tall as the longest quote and switching slides never changes the
            section height. Inactive slides use visibility:hidden, which keeps
            them out of the tab order and accessibility tree.
          */}
          <div
            className="grid overflow-hidden"
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
              const lastIndex = paragraphs.length - 1;

              return (
                <figure
                  key={testimonial.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${total}`}
                  aria-hidden={!isActive}
                  className={`col-start-1 row-start-1 min-w-0 card p-5 sm:p-6 md:p-8 rounded-2xl bg-oxford-blue/90 border border-penn-blue shadow-xl flex flex-col transition-[opacity,visibility] duration-300 motion-reduce:transition-none ${
                    isActive ? "visible opacity-100" : "invisible opacity-0"
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 md:w-10 md:h-10 mb-4 shrink-0 text-blue-ncs opacity-50"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h3.983v10h-9.984z" />
                  </svg>

                  <blockquote className="text-text-primary text-base leading-relaxed md:leading-loose mb-6 grow">
                    {paragraphs.map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className={pIndex > 0 ? "mt-3 md:mt-4" : undefined}
                      >
                        {pIndex === 0 && <QuoteMark side="open" />}
                        {paragraph}
                        {pIndex === lastIndex && <QuoteMark side="close" />}
                      </p>
                    ))}
                  </blockquote>

                  <figcaption className="mt-auto pt-5 md:pt-6 border-t border-penn-blue">
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

          {/* Controls row: mt-6 + 44px buttons = 4.25rem; desktop arrows offset by half of it to center on the card. */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={prevSlide}
                className={`${arrowButtonClass} lg:absolute lg:-left-16 lg:top-[calc(50%_-_2.125rem)] lg:-translate-y-1/2`}
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
                        className={`block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
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
                className={`${arrowButtonClass} lg:absolute lg:-right-16 lg:top-[calc(50%_-_2.125rem)] lg:-translate-y-1/2`}
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
        </div>
      </motion.div>
    </motion.section>
  );
}
