"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";

const teaserPosts = [
  {
    category: "Technical Tutorial",
    title: "Why I Build Every Client Site with Next.js",
    description:
      "After years of trying different frameworks, here's why Next.js became my go-to for local business websites — and why the framework choice matters more than most people realize.",
    readTime: "4 min read",
    tags: ["Next.js", "Small Business", "Web Dev"],
    icon: "⚙️",
  },
  {
    category: "Case Study",
    title: "Digitizing a Cleaning Company: The Lexis Fresh Slate Story",
    description:
      "From paper schedules to automated booking and SMS confirmations — how I helped a local cleaning company reclaim hours every week and win more clients.",
    readTime: "6 min read",
    tags: ["Case Study", "Automation", "Local Business"],
    icon: "📊",
  },
  {
    category: "Technical Tutorial",
    title: "Building a Voice AI Agent with Retell, Supabase & Twilio",
    description:
      "A complete walkthrough of setting up an AI voice agent webhook that logs calls, stores data in Supabase, and sends instant SMS alerts to your phone.",
    readTime: "8 min read",
    tags: ["AI", "Retell", "Twilio"],
    icon: "🎙️",
  },
];

const contentTypes = [
  {
    icon: "⚙️",
    label: "Technical Tutorials",
    desc: "Code walkthroughs & how-tos",
  },
  {
    icon: "📊",
    label: "Case Studies",
    desc: "Real projects, real results",
  },
  {
    icon: "💡",
    label: "Industry Insights",
    desc: "Thoughts on tools & trends",
  },
];

function CategoryBadge({ category }: { category: string }) {
  if (category === "Case Study") {
    return (
      <span className="self-start px-3 py-1 rounded-full text-xs font-semibold border mb-3 text-lapis-lazuli bg-lapis-lazuli/10 border-lapis-lazuli/30">
        {category}
      </span>
    );
  }
  return (
    <span className="self-start px-3 py-1 rounded-full text-xs font-semibold border mb-3 text-blue-ncs bg-blue-ncs/10 border-blue-ncs/30">
      {category}
    </span>
  );
}

export default function BlogClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/blog/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Subscribed successfully!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ── Hero ── */}
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Pulsing "Coming Soon" pill */}
          <motion.div
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-blue-ncs/30 bg-blue-ncs/5 mb-7"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-blue-ncs"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span className="text-blue-ncs text-xs font-bold tracking-[0.2em] uppercase">
              Coming Soon
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-7xl font-bold text-text-headings mb-5 tracking-tight leading-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            The <span className="text-blue-ncs">KYGR</span> Blog
          </motion.h1>

          <motion.p
            className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Insights, tutorials, and case studies from building software for
            real businesses in middle Georgia.
          </motion.p>
        </motion.div>

        {/* ── Content Type Pills ── */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {contentTypes.map((type, i) => (
            <motion.div
              key={type.label}
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-oxford-blue/90 border border-penn-blue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              whileHover={{ borderColor: "#0094c6", y: -2 }}
            >
              <span className="text-xl">{type.icon}</span>
              <div className="text-left">
                <p className="text-text-headings text-sm font-semibold">
                  {type.label}
                </p>
                <p className="text-text-secondary text-xs">{type.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Preview Cards ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.65 }}
        >
          {teaserPosts.map((post, i) => (
            <motion.div
              key={post.title}
              className="relative bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue rounded-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 30 }}
              animate={{
                opacity: 1,
                y: 0,
                boxShadow: [
                  "0 0 0px rgba(0,148,198,0)",
                  "0 0 28px rgba(0,148,198,0.07)",
                  "0 0 0px rgba(0,148,198,0)",
                ],
              }}
              transition={{
                opacity: { duration: 0.5, delay: 0.75 + i * 0.15 },
                y: { duration: 0.5, delay: 0.75 + i * 0.15 },
                boxShadow: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5 + i * 0.4,
                },
              }}
              whileHover={{
                borderColor: "#0094c6",
                y: -6,
                transition: { duration: 0.3 },
              }}
            >
              {/* Card image area */}
              <div className="h-36 bg-penn-blue/40 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-blue-ncs/5 via-transparent to-lapis-lazuli/5" />

                {/* Decorative grid pattern */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,148,198,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,148,198,0.3) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* Icon */}
                <motion.span
                  className="text-4xl relative z-10 select-none"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.6,
                  }}
                >
                  {post.icon}
                </motion.span>

                {/* Coming soon ribbon */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-ncs/15 text-blue-ncs border border-blue-ncs/25">
                    Coming Soon
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 flex flex-col grow">
                <CategoryBadge category={post.category} />

                <h3 className="text-text-headings font-semibold text-base mb-2.5 leading-snug">
                  {post.title}
                </h3>

                <p className="text-text-secondary text-sm leading-relaxed mb-4 grow">
                  {post.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-penn-blue/70 text-text-secondary text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between text-xs text-text-secondary mt-auto pt-3 border-t border-penn-blue/50">
                  <span className="font-medium">{post.readTime}</span>
                  <span className="text-blue-ncs/50 italic">Drafting...</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Divider ── */}
        <motion.div
          className="flex items-center gap-4 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <div className="flex-1 h-px bg-penn-blue" />
          <span className="text-text-secondary text-xs tracking-widest uppercase">
            Stay in the loop
          </span>
          <div className="flex-1 h-px bg-penn-blue" />
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <p className="text-text-secondary mb-7 text-base max-w-lg mx-auto leading-relaxed">
            Want to know when the blog goes live? Drop your email and I&apos;ll
            notify you the moment new posts are published.
          </p>

          {status === "success" ? (
            <p className="text-green-400 font-medium mb-7">{message}</p>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row justify-center gap-3 mb-7 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === "loading"}
                className="flex-1 px-5 py-3 rounded-full bg-oxford-blue border border-penn-blue text-text-headings placeholder:text-text-secondary focus:outline-none focus:border-blue-ncs disabled:opacity-50 transition-colors duration-200"
              />
              <motion.button
                type="submit"
                disabled={status === "loading"}
                className="px-8 py-3 rounded-full bg-blue-ncs text-white font-semibold hover:bg-lapis-lazuli transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: status === "loading" ? 1 : 1.05 }}
                whileTap={{ scale: status === "loading" ? 1 : 0.95 }}
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </motion.button>
            </form>
          )}

          {status === "error" && (
            <p className="text-red-400 text-sm mb-5">{message}</p>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <motion.button
                className="px-8 py-3 rounded-full border border-penn-blue text-text-secondary hover:border-blue-ncs hover:text-text-primary transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Home
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
