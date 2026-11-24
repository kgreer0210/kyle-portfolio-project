"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Breadcrumb, ServiceIllustration } from "../../components";
import CallAndMessageCtas from "../../components/CallAndMessageCtas";
import { IDX_PATH, idxOffering } from "../../data/idx";
import { services } from "../../data/services";
import { useHoverMotion, useReveal } from "../../lib/motionPresets";

const MotionLink = motion.create(Link);

export default function ServicesClient() {
  const { section } = useReveal();
  const linkPress = useHoverMotion({ scale: 1.03, y: -2 }, { scale: 0.98 });
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb />
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-text-headings mb-6">
            Strategic <span className="text-blue-ncs">Services</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            A site that brings in leads, a portal your team actually uses, or
            an automation that takes the busywork off your plate. Whatever
            you&apos;ve been picturing, here&apos;s how I can help.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 mb-20">
          {services.map((service, index) => (
            <motion.section
              key={service.title}
              className={`flex flex-col md:flex-row gap-8 items-center p-8 md:p-12 rounded-3xl bg-oxford-blue/40 border border-penn-blue shadow-2xl ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
              {...section}
            >
              <div className="flex-1">
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
                {index === 0 ? (
                  <p className="mt-6 text-text-secondary text-lg">
                    If you&apos;re looking for a web designer in Warner Robins,
                    Macon, Perry, or Byron,{" "}
                    <Link
                      href="/website-design-middle-georgia"
                      className="text-blue-ncs underline underline-offset-4 hover:text-lapis-lazuli focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs rounded-sm"
                    >
                      here&apos;s how I work with Middle Georgia owners
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
              <div className="flex-1 w-full flex justify-center items-center">
                <div className="w-full aspect-square max-w-sm rounded-2xl bg-linear-to-br from-penn-blue/40 to-blue-ncs/10 border border-blue-ncs/20 flex items-center justify-center p-6 md:p-8">
                  <ServiceIllustration
                    type={
                      index === 0 ? "web" : index === 1 ? "app" : "automation"
                    }
                  />
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.section
          className="mb-20 p-8 md:p-12 rounded-3xl bg-oxford-blue/40 border border-blue-ncs/30"
          {...section}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-ncs/10 text-blue-ncs border border-blue-ncs/30 mb-6">
            IDX for Real Estate
          </span>
          <h2 className="text-3xl font-bold text-text-headings mb-4">
            {idxOffering.headline}
          </h2>
          <p className="text-lg text-text-primary font-medium mb-4">
            {idxOffering.subhead}
          </p>
          <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-3xl">
            {idxOffering.body}
          </p>
          <MotionLink
            href={IDX_PATH}
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-ncs-strong text-white font-bold rounded-full text-lg hover:bg-lapis-lazuli transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            {...linkPress}
          >
            See the IDX offering
          </MotionLink>
        </motion.section>

        <motion.div
          className="text-center py-16"
          {...section}
        >
          <h2 className="text-3xl font-bold text-text-headings mb-8">
            Not sure which service you need?
          </h2>
          <CallAndMessageCtas location="services" className="justify-center" />
          <p className="mt-6 text-lg text-text-secondary">
            Want to see what I&apos;ve built first?{" "}
            <Link
              href="/projects"
              className="text-blue-ncs underline underline-offset-4 hover:text-lapis-lazuli focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-ncs rounded-sm"
            >
              See my work
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}
