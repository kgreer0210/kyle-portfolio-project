"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Breadcrumb } from "../../components";
import CallAndMessageCtas from "../../components/CallAndMessageCtas";
import { useReveal } from "../../lib/motionPresets";

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

        {/* Section 1: About Me. Above the fold on load, so it renders
            visible instead of revealing: it is the mobile LCP. */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-text-headings mb-6">
                Who I am
              </h2>
              <div className="space-y-6 text-lg text-text-primary leading-relaxed">
                <p>
                  I’m Kyle Greer, a husband, a father of three, a man of
                  faith, and the founder of KYGR Solutions. My peace comes from
                  the Lord, so hard problems don’t scare me. They’re
                  how I grow. I started this business to serve people well,
                  honor God, and be a faithful steward of the skills I’ve
                  been given.
                </p>
                <p>
                  I love taking the idea you’ve been carrying around and
                  guiding it all the way to finished software that does exactly
                  what you pictured, and then some. I don’t settle for
                  “good enough.” I sweat the small details nobody else
                  would notice, because the work should be right. My favorite
                  part is the moment a client sees it working and realizes their
                  life just got easier.
                </p>
              </div>
            </div>

            {/* Family Photo Section */}
            <div
              className="w-full"
            >
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

        {/* Section: Why I Build */}
        <section className="mb-20">
          <motion.div
            {...section}
          >
            <h2 className="text-3xl font-bold text-text-headings mb-6">
              Why I build
            </h2>
            <p className="text-xl text-text-primary leading-relaxed max-w-3xl mb-10">
              Because my peace comes from the Lord, hard things don’t scare
              me. I turn the ideas people carry around into something real, and
              serving people that way brings me joy.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "$138,000 in 18 months",
                  desc: "In 2024, my wife and I paid off $138,000 of debt in 18 months. Every month we asked what else we could do, and we even sold a van we’d bought a year earlier. That season taught me one question: “If I had to, what would it take?” Hard things aren’t blockers. They’re there to be overcome, and they help me grow. I bring that same question to every project.",
                },
                {
                  title: "The page nobody complained about",
                  desc: "While showing a new client a site I’d built for Lexi’s Fresh Slate Cleanings, I noticed the admin calendar page loading slowly. A loading animation covered it, so nobody else would have noticed, but it wasn’t up to my standard. I fixed the slow queries without anyone asking. I could do better, so I did.",
                },
              ].map((story) => (
                <div
                  key={story.title}
                  className="p-8 rounded-2xl bg-oxford-blue/30 border border-penn-blue hover:border-blue-ncs/50 transition-colors"
                >
                  <h3 className="text-xl font-bold text-blue-ncs mb-3">
                    {story.title}
                  </h3>
                  <p className="text-text-primary text-lg leading-relaxed">
                    {story.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Section 2: Mission */}
        <motion.section className="mb-20" {...section}>
          <div
            className="bg-blue-ncs/5 p-8 md:p-12 rounded-3xl border border-blue-ncs/10"
          >
            <h2 className="text-3xl font-bold text-blue-ncs mb-6">Mission</h2>
            <p className="text-2xl text-text-primary leading-relaxed font-medium">
              To help businesses and organizations use technology as a tool —
              not a burden — by delivering honest, high-quality software
              solutions that improve efficiency, clarity, and trust.
            </p>
          </div>
          <div
            className="mt-8 bg-blue-ncs/5 p-8 md:p-12 rounded-3xl border border-blue-ncs/10"
          >
            <h2 className="text-3xl font-bold text-blue-ncs mb-6">
              Where I’m headed
            </h2>
            <p className="text-2xl text-text-primary leading-relaxed font-medium">
              In five years, I want KYGR Solutions known for lasting
              relationships built by serving people well, with websites and apps
              that make their lives easier. A business that never settles for
              mediocre, keeps pushing the envelope, holds firm to its values,
              and honors the Lord in everything it does.
            </p>
          </div>
        </motion.section>

        {/* Section 3: Values */}
        <section className="mb-20">
          <motion.div
            {...section}
          >
            <h2 className="text-3xl font-bold text-text-headings mb-10">
              Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Built with Purpose",
                  desc: "My work is guided by faith, integrity, and stewardship. I want to honor the Lord in how I build, how I price, and how I treat people. Technology should do what it claims to do.",
                },
                {
                  title: "People Over Platforms",
                  desc: "I don’t push one-size-fits-all software. I focus on understanding how you work and building solutions that fit your needs.",
                },
                {
                  title: "Clarity & Craftsmanship",
                  desc: "Clean code, thoughtful design, and a strong user experience matter. I don’t settle for “good enough.” If something can be better, even if no one would notice, I make it better.",
                },
                {
                  title: "Trust Through Partnership",
                  desc: "I want more than a project. I want a lasting relationship, built by serving you well long after launch.",
                },
              ].map((value, idx) => (
                <div
                  key={idx}
                  className="p-8 rounded-2xl bg-oxford-blue/30 border border-penn-blue hover:border-blue-ncs/50 transition-colors"
                >
                  <h3 className="text-xl font-bold text-blue-ncs mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-primary text-lg leading-relaxed">
                    {value.desc}
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
