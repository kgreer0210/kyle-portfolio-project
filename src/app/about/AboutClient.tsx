"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "../../components";

export default function AboutClient() {
  return (
    <main className="pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-text-headings mb-12">
            About <span className="text-blue-ncs">KYGR Solutions</span>
          </h1>
        </motion.div>

        {/* Section 1: About Me */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-text-headings mb-6">
                About
              </h2>
              <div className="space-y-6 text-lg text-text-primary leading-relaxed">
                <p>
                  I&apos;m Kyle Greer, a husband, a father of three, a man of
                  faith, and the founder of KYGR Solutions. My peace comes from
                  the Lord, so hard problems don&apos;t scare me. They&apos;re
                  how I grow. I started this business to serve people well,
                  honor God, and be a faithful steward of the skills I&apos;ve
                  been given.
                </p>
                <p>
                  I love taking the idea you&apos;ve been carrying around and
                  guiding it all the way to finished software that does exactly
                  what you pictured, and then some. I don&apos;t settle for
                  &quot;good enough.&quot; I sweat the small details nobody else
                  would notice, because the work should be right. My favorite
                  part is the moment a client sees it working and realizes their
                  life just got easier.
                </p>
              </div>
            </motion.div>

            {/* Family Photo Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
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
            </motion.div>
          </div>
        </section>

        {/* Section: Why I Build */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-text-headings mb-6">
              Why I build
            </h2>
            <p className="text-xl text-text-primary leading-relaxed max-w-3xl mb-10">
              Because my peace comes from the Lord, hard things don&apos;t scare
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
              ].map((story, idx) => (
                <motion.div
                  key={story.title}
                  className="p-8 rounded-2xl bg-oxford-blue/30 border border-penn-blue hover:border-blue-ncs/50 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-xl font-bold text-blue-ncs mb-3">
                    {story.title}
                  </h3>
                  <p className="text-text-primary text-lg leading-relaxed">
                    {story.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Section 2: Mission */}
        <section className="mb-20">
          <motion.div
            className="bg-blue-ncs/5 p-8 md:p-12 rounded-3xl border border-blue-ncs/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-blue-ncs mb-6">Mission</h2>
            <p className="text-2xl text-text-primary leading-relaxed font-medium">
              To help businesses and organizations use technology as a tool —
              not a burden — by delivering honest, high-quality software
              solutions that improve efficiency, clarity, and trust.
            </p>
          </motion.div>
          <motion.div
            className="mt-8 bg-blue-ncs/5 p-8 md:p-12 rounded-3xl border border-blue-ncs/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-blue-ncs mb-6">
              Where we&apos;re headed
            </h2>
            <p className="text-2xl text-text-primary leading-relaxed font-medium">
              In five years, I want KYGR Solutions known for lasting
              relationships built by serving people well, with websites and apps
              that make their lives easier. A business that never settles for
              mediocre, keeps pushing the envelope, holds firm to its values,
              and honors the Lord in everything it does.
            </p>
          </motion.div>
        </section>

        {/* Section 3: Values */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
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
                <motion.div
                  key={idx}
                  className="p-8 rounded-2xl bg-oxford-blue/30 border border-penn-blue hover:border-blue-ncs/50 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-xl font-bold text-blue-ncs mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-primary text-lg leading-relaxed">
                    {value.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <motion.div
          className="text-center bg-blue-ncs/10 p-12 rounded-3xl border border-blue-ncs/20"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-text-headings mb-6">
            Got an idea you&apos;ve been carrying around?
          </h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Let&apos;s talk about it. I&apos;ll help you figure out what it
            would take to make it real.
          </p>
          <Link href="/contact">
            <motion.button
              className="px-10 py-4 bg-blue-ncs text-white font-bold rounded-full text-lg hover:bg-lapis-lazuli transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get a Free Consult
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
