"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getDefaultRouteForRole } from "@/lib/crm";

interface AuthCallbackHandlerProps {
  code?: string;
  next?: string;
  type?: string;
}

type CallbackStatus = "processing" | "error";

const TIMEOUT_MS = 15_000;

export default function AuthCallbackHandler({
  code,
  next,
  type,
}: AuthCallbackHandlerProps) {
  const hasRun = useRef(false);
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const timeout = setTimeout(() => {
      setStatus("error");
      setErrorMessage(
        "Sign-in is taking too long. The link may have expired — please request a new one.",
      );
    }, TIMEOUT_MS);

    async function handleCallback() {
      const supabase = createBrowserSupabaseClient();

      // --- Attempt PKCE flow (code in query params) ---
      if (code) {
        const { error: codeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (codeError) {
          throw new Error("Unable to complete sign-in. The link may have expired.");
        }

        await resolveSessionAndRedirect(supabase, type);
        return;
      }

      // --- Attempt implicit flow (tokens in hash fragment) ---
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;

      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const hashAuthType = params.get("type");

        // Clear the hash immediately to prevent re-processing.
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search,
        );

        if (!accessToken || !refreshToken) {
          throw new Error("Invalid sign-in link — missing credentials.");
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw new Error("Unable to complete sign-in. The link may have expired.");
        }

        await resolveSessionAndRedirect(supabase, hashAuthType || type);
        return;
      }

      // --- Neither flow detected ---
      window.location.href = "/login";
    }

    async function resolveSessionAndRedirect(
      supabase: ReturnType<typeof createBrowserSupabaseClient>,
      authType?: string | null,
    ) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No active session was created.");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .maybeSingle();

      const role =
        (profile as { role?: "admin" | "client" } | null)?.role || "client";
      const profileStatus =
        (profile as { status?: string } | null)?.status;
      const safeNext =
        next && next.startsWith("/") ? next : getDefaultRouteForRole(role);
      const isInviteFlow =
        authType === "invite" || profileStatus === "invited";

      // Sync the profile server-side (updates status from invited → active, etc.)
      await fetch("/api/auth/profile", { method: "POST" });

      if (isInviteFlow) {
        const url = new URL("/reset-password", window.location.origin);
        url.searchParams.set("mode", "invite");
        url.searchParams.set("next", safeNext);
        window.location.href = url.toString();
        return;
      }

      window.location.href = safeNext;
    }

    handleCallback().catch((err) => {
      clearTimeout(timeout);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to complete sign-in.",
      );
    });

    return () => {
      clearTimeout(timeout);
    };
  }, [code, next, type]);

  if (status === "error") {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </p>
        <Link
          href="/login"
          className="inline-flex text-sm font-medium text-blue-ncs transition hover:text-white"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-penn-blue bg-rich-black/50 px-4 py-4 text-sm text-text-secondary">
        Completing sign-in...
      </div>
    </div>
  );
}
