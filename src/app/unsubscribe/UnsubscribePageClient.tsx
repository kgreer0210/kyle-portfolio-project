"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";

type Status = "loading" | "success" | "error";

export default function UnsubscribePageClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No unsubscribe token provided.");
      return;
    }

    fetch(`/api/blog/unsubscribe?token=${encodeURIComponent(token)}`, {
      method: "POST",
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error || "Something went wrong.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [token]);

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <motion.div
          className="bg-oxford-blue/90 backdrop-blur-sm border border-penn-blue rounded-2xl p-10 text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-blue-ncs border-t-transparent rounded-full animate-spin" />
              <p className="text-text-secondary text-sm">Processing your request…</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <svg
                className="w-12 h-12 text-blue-ncs"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h1 className="text-text-headings font-bold text-3xl">
                You&apos;re unsubscribed
              </h1>
              <p className="text-text-secondary text-sm">
                You won&apos;t receive any more blog notifications.
              </p>
              <Link
                href="/blog"
                className="mt-4 px-5 py-2 rounded-full border border-penn-blue text-text-secondary text-sm hover:border-blue-ncs hover:text-text-primary transition-colors"
              >
                Back to Blog
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <svg
                className="w-12 h-12 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              <h1 className="text-text-headings font-bold text-3xl">
                Something went wrong
              </h1>
              <p className="text-text-secondary text-sm">{message}</p>
              <Link
                href="/"
                className="mt-4 px-5 py-2 rounded-full border border-penn-blue text-text-secondary text-sm hover:border-blue-ncs hover:text-text-primary transition-colors"
              >
                Back to Home
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
