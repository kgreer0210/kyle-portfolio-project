"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Breadcrumb } from "../../components";
import CallAndMessageCtas from "../../components/CallAndMessageCtas";
import { useReveal } from "../../lib/motionPresets";

const HOW_I_WORK = [
  {
    title: "You work directly with me.",
    desc: "From the first call to launch day and beyond, you’re talking to the person actually building your site—not an account manager passing notes.",
  },
  {
    title: "Built around your workflow.",
    desc: "I don’t force every client into the same template. I take the time to understand what’s slowing you down and build software that fits.",
  },
  {
    title: "Plain English, no surprises.",
    desc: "Clear scope, honest timelines, and straightforward communication—no jargon and no hidden fees.",
  },
  {
    title: "Still here after launch.",
    desc: "A site shouldn’t be handed off and forgotten. I stick around to keep things running smoothly and grow it as your business does.",
  },
];

const WHAT_I_CARE_ABOUT = [
  {
    title: "Craftsmanship.",
    desc: "Clean code, fast load times, and thoughtful design—even on the small details most people never notice.",
  },
  {
    title: "Honesty.",
    desc: "If a simpler or cheaper option makes more sense for you, I’ll tell you.",
  },
  {
    title: "Lasting relationships.",
    desc: "Most of my best work comes from clients who come back when they’re ready for the next phase.",
  },
];

const CARD_CLASS =
  "p-8 rounded-2xl bg-oxford-blue/30 border border-penn-blue hover:border-blue-ncs/50 transition-colors";

export default function AboutClient() {
  const { section } = useReveal();
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb />
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-headings mb-12">
            About <span className="text-blue-ncs">KYGR Solutions</span>
          </h1>
        </div>

        {/* Section 1: Who I am. Above the fold on load, so it renders
            visible instead of revealing: it is the mobile LCP. */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-text-headings mb-6">
                Who I am
              </h2>
              <div className="space-y-6 text-lg text-text-primary leading-relaxed">
                <p>
                  I’m Kyle Greer, a software developer based in Middle Georgia
                  and the founder of KYGR Solutions. I build custom websites and
                  web apps for small businesses, realtors, and organizations
                  that want something tailored to how they actually
                  work—without getting stuck in agency handoffs or
                  cookie-cutter templates.
                </p>
                <p>
                  Outside of work, I’m a husband, a dad of three, and a man of
                  faith. That shapes how I run this business: be honest about
                  what you need, price things fairly, sweat the details, and
                  stand behind the work long after launch.
                </p>
              </div>
            </div>

            {/* Family Photo Section */}
            <div className="w-full">
              <Image
                src="/FamilyPortrait.png"
                alt="Kyle Greer with his wife and three children"
                width={1024}
                height={819}
                className="w-full h-auto rounded-3xl shadow-xl"
                priority
              />
            </div>
          </div>
        </section>

        {/* Section 2: How I work */}
        <section className="mb-20">
          <motion.div {...section}>
            <h2 className="text-3xl font-bold text-text-headings mb-10">
              How I work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {HOW_I_WORK.map((item) => (
                <div key={item.title} className={CARD_CLASS}>
                  <h3 className="text-xl font-bold text-blue-ncs mb-3">
                    {item.title}
                  </h3>
                  <p className="text-text-primary text-lg leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Section 3: What I care about */}
        <section className="mb-20">
          <motion.div {...section}>
            <h2 className="text-3xl font-bold text-text-headings mb-10">
              What I care about
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {WHAT_I_CARE_ABOUT.map((item) => (
                <div key={item.title} className={CARD_CLASS}>
                  <h3 className="text-xl font-bold text-blue-ncs mb-3">
                    {item.title}
                  </h3>
                  <p className="text-text-primary text-lg leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <motion.div
          className="text-center bg-blue-ncs/10 p-12 rounded-3xl border border-blue-ncs/20"
          {...section}
        >
          <h2 className="text-3xl font-bold text-text-headings mb-6">
            Got an idea you’ve been carrying around?
          </h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Let’s talk about it. I’ll help you figure out what it
            would take to make it real.
          </p>
          <CallAndMessageCtas location="about" className="justify-center" />
        </motion.div>
      </div>
    </div>
  );
}
