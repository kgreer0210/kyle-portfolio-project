"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const signOutFailedMessage =
  "Sign out did not finish. You are still signed in. Try again.";

export default function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setError("");
    setIsSigningOut(true);
    try {
      const supabase = createBrowserSupabaseClient();
      // Default scope is global: every device signs out only after the server
      // accepts it. A network or server failure keeps this session.
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
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
