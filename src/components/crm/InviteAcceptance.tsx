"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import ResetPasswordForm from "@/components/crm/ResetPasswordForm";

type View = "choose" | "password-fallback";

interface InviteAcceptanceProps {
  next?: string;
}

export default function InviteAcceptance({ next }: InviteAcceptanceProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("choose");
  const [supportsPasskey, setSupportsPasskey] = useState<boolean | null>(null);
  const [autoFellBack, setAutoFellBack] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hasWebAuthn =
      typeof window !== "undefined" && !!window.PublicKeyCredential;

    if (!hasWebAuthn) {
      setSupportsPasskey(false);
      setAutoFellBack(true);
      setView("password-fallback");
      return;
    }

    setSupportsPasskey(true);
  }, []);

  async function handleCreatePasskey() {
    setIsRegistering(true);
    setError("");

    try {
      const optionsRes = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });
      if (!optionsRes.ok) {
        throw new Error("Failed to start passkey registration.");
      }
      const options = await optionsRes.json();

      const attestation = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });
      const result = await verifyRes.json();

      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error ?? "Registration failed.");
      }

      const destination = next && next.startsWith("/") ? next : "/portal/onboarding";
      router.replace(destination);
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setIsRegistering(false);
        return;
      }
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError(
          "Passkey setup was cancelled. Try again, or use a password instead.",
        );
        setIsRegistering(false);
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your passkey. Try again or use a password instead.",
      );
      setIsRegistering(false);
    }
  }

  if (view === "password-fallback") {
    return (
      <div className="space-y-4">
        {autoFellBack ? (
          <p className="rounded-2xl border border-blue-ncs/40 bg-blue-ncs/10 px-4 py-3 text-sm text-text-secondary">
            Your browser doesn&apos;t support passkeys. Create a password to
            finish setting up your portal account.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setView("choose");
              setError("");
            }}
            className="text-sm font-medium text-blue-ncs transition hover:text-white"
          >
            ← Back to passkey setup
          </button>
        )}
        <ResetPasswordForm initialMode="invite" next={next} />
      </div>
    );
  }

  const isChecking = supportsPasskey === null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleCreatePasskey}
          disabled={isChecking || isRegistering}
          className="w-full rounded-2xl bg-blue-ncs px-4 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRegistering ? "Waiting for your device..." : "Create a passkey"}
        </button>
        <p className="text-xs text-text-secondary">
          Use Face ID, Touch ID, Windows Hello, or a hardware security key.
          Nothing to remember — and nothing to forget.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-text-secondary">
        <span className="h-px flex-1 bg-penn-blue" />
        or
        <span className="h-px flex-1 bg-penn-blue" />
      </div>

      <button
        type="button"
        onClick={() => {
          setView("password-fallback");
          setError("");
        }}
        disabled={isRegistering}
        className="w-full rounded-2xl border border-penn-blue bg-rich-black/50 px-4 py-3 text-sm font-medium text-text-primary transition hover:border-blue-ncs hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Use a password instead
      </button>

      <p className="rounded-2xl border border-penn-blue bg-rich-black/50 px-4 py-3 text-xs leading-5 text-text-secondary">
        Lost your device later? We&apos;ll always email a sign-in link to the
        address that received this invite, so you can recover access.
      </p>
    </div>
  );
}
