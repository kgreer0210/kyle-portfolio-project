"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const signOutFailedMessage =
  "Sign out did not finish. You are still signed in. Try again.";

type BrowserAuth = ReturnType<typeof createBrowserSupabaseClient>["auth"];

/**
 * supabase-js 2.119 clears this browser only after a global sign-out is
 * accepted. A returned error or a throw leaves the local session in place, so
 * the same call with `{ scope: "local" }` removes it. The local call can
 * itself fail; that is the only case where this browser stays signed in.
 */
async function signOutThisBrowser(auth: BrowserAuth): Promise<boolean> {
  try {
    const { error: globalError } = await auth.signOut();
    if (!globalError) {
      return true;
    }
  } catch {
    // Global sign-out threw before clearing this browser.
  }

  try {
    const { error: localError } = await auth.signOut({ scope: "local" });
    return !localError;
  } catch {
    return false;
  }
}

export default function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setError("");
    setIsSigningOut(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const signedOut = await signOutThisBrowser(supabase.auth);
      if (!signedOut) {
        setError(signOutFailedMessage);
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setError(signOutFailedMessage);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="rounded-full border border-penn-blue px-4 py-2 text-sm font-medium text-text-primary transition hover:border-blue-ncs hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
      {error ? (
        <p className="max-w-56 text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
