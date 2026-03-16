"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { BlogPost } from "../../types";

const CATEGORIES = ["All", "Technical Tutorial", "Case Study", "Industry Insights", "General"] as const;

function CategoryBadge({ category }: { category: BlogPost["category"] }) {
  const styles: Record<string, string> = {
    "Technical Tutorial": "text-blue-ncs bg-blue-ncs/10 border-blue-ncs/30",
    "Case Study": "text-lapis-lazuli bg-lapis-lazuli/10 border-lapis-lazuli/30",
    "Industry Insights": "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    General: "text-text-secondary bg-penn-blue/50 border-penn-blue",
  };
  return (
    <span
      className={`self-start px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${styles[category] ?? styles.General}`}
    >
      {category}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface Props {
  posts: BlogPost[];
}

export default function BlogClient({ posts }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [subMessage, setSubMessage] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setSubStatus("loading");
    try {
      const res = await fetch("/api/blog/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubStatus("success");
        setSubMessage(data.message || "Subscribed successfully!");
        setEmail("");
      } else {
        setSubStatus("error");
        setSubMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setSubStatus("error");
      setSubMessage("Something went wrong. Please try again.");
    }
  }

  const filtered =
    activeCategory === "All"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  const hasNoPosts = posts.length === 0;

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
          <motion.h1
            className="text-5xl sm:text-7xl font-bold text-text-headings mb-5 tracking-tight leading-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            The <span className="text-blue-ncs">KYGR</span> Blog
          </motion.h1>

          <motion.p
            className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            Insights, tutorials, and case studies from building software for
            real businesses in middle Georgia.
          </motion.p>
        </motion.div>

        {/* ── Category Filter ── */}
        {!hasNoPosts && (
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-all duration-300 ${
                  activeCategory === cat
                    ? "border-blue-ncs text-blue-ncs bg-blue-ncs/10"
                    : "border-penn-blue text-text-secondary hover:border-blue-ncs hover:text-blue-ncs"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── Posts Grid ── */}
        {hasNoPosts ? (
          <motion.div
            className="text-center py-20 text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-lg">No posts yet — check back soon.</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="text-center py-20 text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>No posts in this category yet.</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 + i * 0.1 }}
                whileHover={{ y: -6, borderColor: "#0094c6", transition: { duration: 0.25 } }}
                className="bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue rounded-2xl overflow-hidden flex flex-col transition-colors duration-300"
              >
                <Link href={`/blog/${post.slug}`} className="flex flex-col grow p-6">
                  <CategoryBadge category={post.category} />

                  <h2 className="text-text-headings font-semibold text-lg mb-3 leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-text-secondary text-sm leading-relaxed mb-5 grow">
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

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-text-secondary pt-3 border-t border-penn-blue/50">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span className="font-medium">{post.readTime}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Subscribe ── */}
        <motion.div
          className="flex items-center gap-4 mt-20 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex-1 h-px bg-penn-blue" />
          <span className="text-text-secondary text-xs tracking-widest uppercase">
            Stay in the loop
          </span>
          <div className="flex-1 h-px bg-penn-blue" />
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-text-secondary mb-7 text-base max-w-lg mx-auto leading-relaxed">
            Get notified when new posts are published — tutorials, case studies,
            and insights from building software for real businesses.
          </p>

          {subStatus === "success" ? (
            <p className="text-green-400 font-medium mb-7">{subMessage}</p>
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
                disabled={subStatus === "loading"}
                className="flex-1 px-5 py-3 rounded-full bg-oxford-blue border border-penn-blue text-text-headings placeholder:text-text-secondary focus:outline-none focus:border-blue-ncs disabled:opacity-50 transition-colors duration-200"
              />
              <motion.button
                type="submit"
                disabled={subStatus === "loading"}
                className="px-8 py-3 rounded-full bg-blue-ncs text-white font-semibold hover:bg-lapis-lazuli transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: subStatus === "loading" ? 1 : 1.05 }}
                whileTap={{ scale: subStatus === "loading" ? 1 : 0.95 }}
              >
                {subStatus === "loading" ? "Subscribing..." : "Subscribe"}
              </motion.button>
            </form>
          )}

          {subStatus === "error" && (
            <p className="text-red-400 text-sm mb-5">{subMessage}</p>
          )}
        </motion.div>

        {/* ── Back link ── */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Link href="/">
            <motion.button
              className="px-8 py-3 rounded-full border border-penn-blue text-text-secondary hover:border-blue-ncs hover:text-text-primary transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Home
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
