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

function getSafeNext(next?: string, fallback = "/portal") {
  return next && next.startsWith("/") ? next : fallback;
}

export default function LoginForm({ next, initialError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function completeInviteSignIn() {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;

      if (!hash) {
        return;
      }

      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const authType = params.get("type");

      if (!accessToken || !refreshToken) {
        return;
      }

      setIsSubmitting(true);
      setError("");

      try {
        const supabase = createBrowserSupabaseClient();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }

        // Clear the auth fragment so refreshes do not repeat the flow.
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search,
        );

        if (authType === "invite") {
          const destination = getSafeNext(next);
          const inviteUrl = new URL("/reset-password", window.location.origin);
          inviteUrl.searchParams.set("mode", "invite");
          inviteUrl.searchParams.set("next", destination);
          router.replace(`${inviteUrl.pathname}${inviteUrl.search}`);
          router.refresh();
          return;
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
          next && next.startsWith("/") ? next : getDefaultRouteForRole(payload.profile.role);

        router.replace(destination);
        router.refresh();
      } catch (inviteError) {
        if (!isActive) {
          return;
        }

        const message =
          inviteError instanceof Error
            ? inviteError.message
            : authType === "invite"
              ? "Unable to start password setup from your invite."
              : "Unable to sign in.";

        setError(message);
        setIsSubmitting(false);
      }
    }

    void completeInviteSignIn();

    return () => {
      isActive = false;
    };
  }, [next, router]);

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
