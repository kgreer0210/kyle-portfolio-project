"use client";

import { motion } from "motion/react";
import { Breadcrumb, Contact } from "../../components";

export default function ContactPage() {
  return (
    <main className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb />
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-text-headings mb-4">
            Let&apos;s <span className="text-blue-ncs">Talk Business</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Ready to reclaim your time and scale your operations? Reach out
            today for a free consultation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-text-headings mb-6">
                Contact Information
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-ncs/10 flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-blue-ncs"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-headings">Email</h3>
                    <a
                      href="mailto:kylegreer@kygrsolutions.com"
                      className="text-text-secondary"
                    >
                      kylegreer@kygrsolutions.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-ncs/10 flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-blue-ncs"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-headings">
                      Location
                    </h3>
                    <p className="text-text-secondary">Middle Georgia Area</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-8 rounded-2xl bg-oxford-blue/50 border border-penn-blue"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-xl font-bold text-text-headings mb-4">
                What happens next?
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-ncs text-white flex items-center justify-center text-xs shrink-0">
                    1
                  </span>
                  <p className="text-sm text-text-secondary">
                    I&apos;ll review your message and business details.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-ncs text-white flex items-center justify-center text-xs shrink-0">
                    2
                  </span>
                  <p className="text-sm text-text-secondary">
                    We&apos;ll schedule a brief 30-minute intro call.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-ncs text-white flex items-center justify-center text-xs shrink-0">
                    3
                  </span>
                  <p className="text-sm text-text-secondary">
                    I&apos;ll provide a custom strategy and proposal.
                  </p>
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Contact />
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
