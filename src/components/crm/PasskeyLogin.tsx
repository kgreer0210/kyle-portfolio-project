"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";

interface PasskeyLoginProps {
  next?: string;
}

export default function PasskeyLogin({ next }: PasskeyLoginProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePasskeySignIn() {
    setIsLoading(true);
    setError("");

    try {
      // 1. Get authentication options from server (discoverable-credential flow — no email needed)
      const optionsRes = await fetch("/api/auth/passkey/authenticate/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!optionsRes.ok) {
        throw new Error("Failed to start passkey authentication.");
      }

      const options = await optionsRes.json();

      // 2. Prompt the browser authenticator
      const assertion = await startAuthentication({ optionsJSON: options });

      // 3. Verify on the server
      const verifyRes = await fetch("/api/auth/passkey/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });

      const result = await verifyRes.json();

      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error ?? "Passkey verification failed.");
      }

      const destination =
        next && next.startsWith("/") ? next : result.redirectTo ?? "/portal";

      router.replace(destination);
      router.refresh();
    } catch (err) {
      // AbortError means the user cancelled the browser prompt — don't show an error
      if (err instanceof Error && err.name === "AbortError") {
        setIsLoading(false);
        return;
      }
      setError(
        err instanceof Error ? err.message : "Passkey sign-in failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handlePasskeySignIn}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-penn-blue bg-rich-black px-4 py-3 font-semibold text-text-primary transition hover:border-blue-ncs hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PasskeyIcon />
        {isLoading ? "Waiting for passkey..." : "Sign in with a passkey"}
      </button>
    </div>
  );
}

function PasskeyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="4" />
      <path d="M16 19v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}
