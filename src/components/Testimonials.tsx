"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Alexis Baker",
      role: "Owner, Lexis Fresh Slate Cleanings",
      quote: [
        "Working with Kyle Greer on my company's customized website has truly transformed the way I run my business. The website he created didn't just improve our online presence—it completely streamlined our daily operations. Kyle designed a platform that includes simple, effective protocols for everyday production, making it easier for my team to stay organized and productive.",
        'Since implementing the site, I\'ve been able to step back from the constant "busy work" and focus more on the strategic side of my business. Tasks that once demanded my personal presence are now handled efficiently through the systems Kyle put in place. This has given me the freedom to dedicate more time to background work and business growth—something I never imagined possible before.',
        "Kyle's attention to detail, understanding of my company's needs, and ability to deliver a solution that truly works for us has been invaluable. His work has helped my business flourish in ways I couldn't have anticipated, and I'm incredibly grateful for his expertise and vision.",
      ],
      company: "Lexis Fresh Slate Cleanings",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

  const goToSlide = (index: number) => {
    if (index < 0) {
      setCurrentIndex(testimonials.length - 1);
      setDirection(-1);
    } else if (index >= testimonials.length) {
      setCurrentIndex(0);
      setDirection(1);
    } else {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    }
  };

  const nextSlide = () => {
    goToSlide(currentIndex + 1);
  };

  const prevSlide = () => {
    goToSlide(currentIndex - 1);
  };

  // Auto-play functionality (optional - uncomment if desired)
  // useEffect(() => {
  //   if (testimonials.length <= 1) return;
  //   const interval = setInterval(() => {
  //     nextSlide();
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [currentIndex]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9,
    }),
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
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-headings mb-4 drop-shadow-lg px-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          What Clients Say
        </motion.h2>
        <motion.p
          className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Don&apos;t just take my word for it. Here&apos;s what clients have to
          say about working with me.
        </motion.p>
      </motion.div>

      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <div className="relative w-full max-w-3xl mx-auto px-4">
          {/* Carousel Container */}
          <div className="relative overflow-hidden min-h-[400px] md:min-h-[450px] w-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 },
                }}
                className="card p-4 sm:p-6 md:p-8 rounded-2xl bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue shadow-xl flex flex-col w-full overflow-x-hidden"
              >
                {/* Quote Icon */}
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-blue-ncs opacity-50"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h3.983v10h-9.984z" />
                  </svg>
                </motion.div>

                {/* Quote Text */}
                <motion.div
                  className="text-text-primary text-sm md:text-base leading-relaxed md:leading-loose mb-6 grow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  {Array.isArray(testimonials[currentIndex].quote) ? (
                    <>
                      <p>
                        <span className="text-blue-ncs text-2xl md:text-3xl font-serif leading-none mr-2 align-top">
                          &ldquo;
                        </span>
                        {testimonials[currentIndex].quote[0]}
                      </p>
                      {testimonials[currentIndex].quote
                        .slice(1, -1)
                        .map((paragraph, pIndex) => (
                          <p key={pIndex} className="mt-3 md:mt-4">
                            {paragraph}
                          </p>
                        ))}
                      {testimonials[currentIndex].quote.length > 1 && (
                        <p className="mt-3 md:mt-4">
                          {
                            testimonials[currentIndex].quote[
                              testimonials[currentIndex].quote.length - 1
                            ]
                          }
                          <span className="text-blue-ncs text-2xl md:text-3xl font-serif leading-none ml-2 align-top">
                            &rdquo;
                          </span>
                        </p>
                      )}
                      {testimonials[currentIndex].quote.length === 1 && (
                        <p>
                          <span className="text-blue-ncs text-2xl md:text-3xl font-serif leading-none ml-2 align-top">
                            &rdquo;
                          </span>
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-blue-ncs text-2xl md:text-3xl font-serif leading-none mr-2 align-top">
                        &ldquo;
                      </span>
                      {testimonials[currentIndex].quote}
                      <span className="text-blue-ncs text-2xl md:text-3xl font-serif leading-none ml-2 align-top">
                        &rdquo;
                      </span>
                    </>
                  )}
                </motion.div>

                {/* Author Info */}
                <motion.div
                  className="mt-auto pt-5 md:pt-6 border-t border-penn-blue"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <h3 className="text-base md:text-lg font-semibold text-text-headings mb-1">
                    {testimonials[currentIndex].name}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {testimonials[currentIndex].role}
                  </p>
                  <p className="text-blue-ncs text-sm mt-1">
                    {testimonials[currentIndex].company}
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          {testimonials.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-oxford-blue/80 backdrop-blur-sm border border-penn-blue text-blue-ncs hover:bg-oxford-blue hover:border-blue-ncs transition-all duration-300 shadow-lg hover:shadow-xl"
                aria-label="Previous testimonial"
              >
                <svg
                  className="w-6 h-6"
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

              {/* Next Button */}
              <button
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-oxford-blue/80 backdrop-blur-sm border border-penn-blue text-blue-ncs hover:bg-oxford-blue hover:border-blue-ncs transition-all duration-300 shadow-lg hover:shadow-xl"
                aria-label="Next testimonial"
              >
                <svg
                  className="w-6 h-6"
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

              {/* Dot Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentIndex
                        ? "w-8 h-2 bg-blue-ncs"
                        : "w-2 h-2 bg-penn-blue hover:bg-blue-ncs/50"
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.section>
  );
}
