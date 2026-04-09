"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getDefaultRouteForRole } from "@/lib/crm";

interface LoginFormProps {
  next?: string;
  initialError?: string;
}

export default function LoginForm({ next, initialError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If hash fragments with auth tokens arrive on the login page (e.g. from a
  // stale bookmark or unexpected redirect), hand them off to the dedicated
  // callback handler rather than processing them here.
  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      window.location.href = "/auth/callback" + window.location.hash;
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const response = await fetch("/api/auth/profile", {
        method: "POST",
      });

      const payload = (await response.json()) as {
        error?: string;
        profile?: { role: "admin" | "client" };
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Unable to load your portal profile.");
      }

      const destination =
        next && next.startsWith("/")
          ? next
          : getDefaultRouteForRole(payload.profile.role);

      router.replace(destination);
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label
            className="text-sm font-medium text-text-primary"
            htmlFor="password"
          >
            Password
          </label>
          <Link
            href="/reset-password"
            className="text-sm font-medium text-blue-ncs transition hover:text-white"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
          autoComplete="current-password"
          required
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-blue-ncs px-4 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
