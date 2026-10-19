"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Breadcrumb } from "../../components";
import { IDX_CONTACT_HREF, idxOffering } from "../../data/idx";

export default function IdxClient() {
  return (
    <main className="pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb />

        <motion.div
          className="max-w-3xl mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-ncs/10 text-blue-ncs border border-blue-ncs/30 mb-6">
            IDX for Real Estate
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-text-headings mb-6">
            Custom IDX for{" "}
            <span className="text-blue-ncs">Central Georgia agents</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-primary font-medium mb-6">
            {idxOffering.subhead}
          </p>
          <p className="text-lg text-text-secondary leading-relaxed">
            {idxOffering.body}
          </p>
        </motion.div>

        <section className="mb-16" aria-labelledby="idx-features-heading">
          <motion.h2
            id="idx-features-heading"
            className="text-3xl font-bold text-text-headings mb-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            What&apos;s included
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {idxOffering.features.map((feature, index) => (
              <motion.div
                key={feature}
                className="p-6 md:p-8 rounded-2xl bg-oxford-blue/40 border border-penn-blue"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="flex gap-3 text-text-primary text-lg leading-relaxed">
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
                  {feature}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section
          className="mb-16 p-8 md:p-12 rounded-3xl bg-oxford-blue/50 border border-penn-blue"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          aria-labelledby="idx-eligibility-heading"
        >
          <h2
            id="idx-eligibility-heading"
            className="text-2xl font-bold text-text-headings mb-4"
          >
            Who it&apos;s for
          </h2>
          <p className="text-lg text-text-primary leading-relaxed">
            {idxOffering.note}
          </p>
        </motion.section>

        <motion.section
          className="text-center bg-blue-ncs/10 p-10 md:p-16 rounded-3xl border border-blue-ncs/20"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-bold uppercase tracking-wide text-blue-ncs mb-3">
            Pricing
          </p>
          <p className="text-3xl font-bold text-text-headings mb-8">
            {idxOffering.pricing}
          </p>
          <Link href={IDX_CONTACT_HREF}>
            <motion.button
              className="px-8 py-4 bg-blue-ncs text-white font-bold rounded-full text-lg hover:bg-lapis-lazuli transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {idxOffering.cta}
            </motion.button>
          </Link>
        </motion.section>
      </div>
    </main>
  );
}
