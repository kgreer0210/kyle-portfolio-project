"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { BlogPost } from "../../../types";

interface Props {
  post: BlogPost;
  related: BlogPost[];
}

function CategoryBadge({ category }: { category: BlogPost["category"] }) {
  const styles: Record<string, string> = {
    "Technical Tutorial": "text-blue-ncs bg-blue-ncs/10 border-blue-ncs/30",
    "Case Study": "text-lapis-lazuli bg-lapis-lazuli/10 border-lapis-lazuli/30",
    "Industry Insights": "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    General: "text-text-secondary bg-penn-blue/50 border-penn-blue",
  };
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${styles[category] ?? styles.General}`}
    >
      {category}
    </span>
  );
}

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-text-headings">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return <Link key={i} href={linkMatch[2]} className="text-blue-ncs hover:underline">{linkMatch[1]}</Link>;
    }
    return part;
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderContentBlock(block: string, index: number) {
  if (block.startsWith("## ")) {
    return (
      <h2
        key={index}
        className="text-2xl font-bold text-text-headings mt-10 mb-4"
      >
        {block.slice(3)}
      </h2>
    );
  }
  if (block.startsWith("### ")) {
    return (
      <h3
        key={index}
        className="text-xl font-semibold text-text-headings mt-8 mb-3"
      >
        {block.slice(4)}
      </h3>
    );
  }
  if (block.startsWith("```")) {
    const code = block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "");
    return (
      <pre
        key={index}
        className="bg-penn-blue/60 border border-penn-blue rounded-xl p-5 my-6 overflow-x-auto text-sm text-text-primary font-mono"
      >
        <code>{code.trim()}</code>
      </pre>
    );
  }
  return (
    <p key={index} className="text-text-primary leading-relaxed mb-5">
      {parseInline(block)}
    </p>
  );
}

export default function BlogPostClient({ post, related }: Props) {
  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Link
            href="/blog"
            className="text-text-secondary hover:text-blue-ncs transition-colors duration-300 text-sm flex items-center gap-2"
          >
            <span>←</span> All Posts
          </Link>
        </motion.div>

        {/* Article header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <CategoryBadge category={post.category} />

          <h1 className="text-4xl sm:text-5xl font-bold text-text-headings mb-5 leading-tight tracking-tight">
            {post.title}
          </h1>

          <p className="text-text-secondary text-lg leading-relaxed mb-6">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary pb-6 border-b border-penn-blue">
            <span>{formatDate(post.publishedAt)}</span>
            <span>·</span>
            <span>{post.readTime}</span>
            <div className="flex flex-wrap gap-2 ml-auto">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-penn-blue/70 text-text-secondary text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Author */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center gap-4 mb-10 p-4 rounded-xl bg-oxford-blue/60 border border-penn-blue"
        >
          <div className="w-10 h-10 rounded-full bg-blue-ncs/20 border border-blue-ncs/40 flex items-center justify-center shrink-0">
            <span className="text-blue-ncs font-bold text-sm">KG</span>
          </div>
          <div>
            <p className="text-text-headings text-sm font-semibold">Kyle Greer</p>
            <p className="text-text-secondary text-xs">Owner, KYGR Solutions · Software Developer</p>
          </div>
        </motion.div>

        {/* Article body */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose-custom"
        >
          {post.content.map((block, i) => renderContentBlock(block, i))}
        </motion.article>

        {/* Related posts */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 pt-10 border-t border-penn-blue"
          >
            <h2 className="text-xl font-bold text-text-headings mb-6">
              Related Posts
            </h2>
            <div className="grid gap-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 rounded-xl bg-oxford-blue/90 border border-penn-blue hover:border-blue-ncs transition-all duration-300 group"
                >
                  <div className="grow">
                    <p className="text-text-headings font-medium group-hover:text-blue-ncs transition-colors duration-300">
                      {p.title}
                    </p>
                    <p className="text-text-secondary text-sm mt-0.5">{p.readTime}</p>
                  </div>
                  <span className="text-blue-ncs text-sm shrink-0">Read →</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back to blog */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link href="/blog">
            <motion.button
              className="px-8 py-3 rounded-full border border-penn-blue text-text-secondary hover:border-blue-ncs hover:text-text-primary transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Blog
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
