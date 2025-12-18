"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Breadcrumb } from "../../components";
import { services } from "../../data/services";

export default function ServicesPage() {
  return (
    <main className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb />
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-text-headings mb-6">
            Strategic <span className="text-blue-ncs">Services</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            I offer comprehensive software solutions tailored to the unique
            needs of local businesses.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-12 mb-20">
          {services.map((service, index) => (
            <motion.section
              key={service.title}
              className={`flex flex-col md:flex-row gap-8 items-center p-8 md:p-12 rounded-3xl bg-oxford-blue/40 border border-penn-blue shadow-2xl ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex-1">
                <div className="inline-block px-4 py-1 rounded-full bg-blue-ncs/10 text-blue-ncs text-sm font-bold mb-4">
                  Service 0{index + 1}
                </div>
                <h2 className="text-3xl font-bold text-text-headings mb-4">
                  {service.title}
                </h2>
                <p className="text-lg text-text-primary mb-6 leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.points.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-text-secondary text-lg"
                    >
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-ncs shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full flex justify-center items-center">
                <div className="w-full aspect-square max-w-sm rounded-2xl bg-linear-to-br from-penn-blue/40 to-blue-ncs/10 border border-blue-ncs/20 flex items-center justify-center p-12">
                  {/* Placeholder for service-specific illustration or icon */}
                  <div className="text-blue-ncs/20 font-bold text-9xl opacity-20">
                    {index === 0 ? "WEB" : index === 1 ? "APP" : "AUTO"}
                  </div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-text-headings mb-8">
            Not sure which service you need?
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact">
              <motion.button
                className="px-8 py-4 bg-blue-ncs text-white font-bold rounded-full text-lg hover:bg-lapis-lazuli transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Request a Business Audit
              </motion.button>
            </Link>
            <Link href="/projects">
              <motion.button
                className="px-8 py-4 bg-rich-black border border-penn-blue text-text-primary font-bold rounded-full text-lg hover:border-blue-ncs transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                See Our Work
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
