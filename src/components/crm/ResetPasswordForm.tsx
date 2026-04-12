"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getDefaultRouteForRole, getSiteUrl } from "@/lib/crm";

type ResetMode = "request" | "update";
type PasswordFlowMode = "reset" | "invite";
type SupportedAuthType = "recovery" | "invite";

const invalidRecoveryMessage =
  "This password reset link is invalid or has expired. Request a new reset email to continue.";
const invalidInviteMessage =
  "This invite link is invalid or has expired. Request a password reset email or ask Kyle to send a new invite.";

function isRecoverySessionError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("session") ||
    normalized.includes("token") ||
    normalized.includes("jwt") ||
    normalized.includes("expired")
  );
}

function getPasswordFlowMode(mode?: string): PasswordFlowMode {
  return mode === "invite" ? "invite" : "reset";
}

function getSupportedAuthType(type?: string): SupportedAuthType | undefined {
  return type === "invite" || type === "recovery" ? type : undefined;
}

interface ResetPasswordFormProps {
  initialCode?: string;
  initialTokenHash?: string;
  initialType?: string;
  isRecoveryRedirect?: boolean;
  initialMode?: string;
  next?: string;
  initialErrorDescription?: string;
}

export default function ResetPasswordForm({
  initialCode,
  initialTokenHash,
  initialType,
  isRecoveryRedirect = false,
  initialMode,
  next,
  initialErrorDescription,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const initialStateRef = useRef({
    initialCode,
    initialTokenHash,
    initialType,
    isRecoveryRedirect,
    initialMode,
    next,
    initialErrorDescription,
  });
  const passwordFlow = getPasswordFlowMode(initialMode);
  const [mode, setMode] = useState<ResetMode>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function initializeRecoveryState() {
      const {
        initialCode: code,
        initialTokenHash: tokenHash,
        initialType: rawAuthType,
        isRecoveryRedirect: recoveryRedirect,
        initialMode: requestedMode,
        initialErrorDescription: errorDescription,
      } = initialStateRef.current;
      const flowMode = getPasswordFlowMode(requestedMode);
      const expectedAuthType: SupportedAuthType =
        flowMode === "invite" ? "invite" : "recovery";
      const supportedAuthType = getSupportedAuthType(rawAuthType);
      const invalidMessage =
        flowMode === "invite" ? invalidInviteMessage : invalidRecoveryMessage;
      const supabase = createBrowserSupabaseClient();
      const clearUrl = () => {
        const url = new URL(window.location.href);
        [
          "code",
          "token_hash",
          "type",
          "recovery",
          "error",
          "error_description",
        ].forEach((key) => url.searchParams.delete(key));
        url.hash = "";

        const nextUrl = `${url.pathname}${url.search}`;
        window.history.replaceState({}, document.title, nextUrl || "/");
      };

      if (errorDescription) {
        clearUrl();

        if (isActive) {
          setMode("request");
          setError(errorDescription);
          setIsInitializing(false);
        }

        return;
      }

      if (tokenHash && supportedAuthType === expectedAuthType) {
        try {
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: supportedAuthType,
          });

          if (otpError) {
            throw otpError;
          }

          clearUrl();

          if (isActive) {
            setMode("update");
            setError("");
            setSuccess("");
          }
        } catch {
          clearUrl();

          if (isActive) {
            setMode("request");
            setError(invalidMessage);
          }
        } finally {
          if (isActive) {
            setIsInitializing(false);
          }
        }

        return;
      }

      if (tokenHash && supportedAuthType && supportedAuthType !== expectedAuthType) {
        clearUrl();

        if (isActive) {
          setMode("request");
          setError(invalidMessage);
          setIsInitializing(false);
        }

        return;
      }

      if (code) {
        try {
          const { error: codeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (codeError) {
            throw codeError;
          }

          clearUrl();

          if (isActive) {
            setMode("update");
            setError("");
            setSuccess("");
          }
        } catch {
          clearUrl();

          if (isActive) {
            setMode("request");
            setError(invalidMessage);
          }
        } finally {
          if (isActive) {
            setIsInitializing(false);
          }
        }

        return;
      }

      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;

      if (!hash && (recoveryRedirect || flowMode === "invite")) {
        try {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          clearUrl();

          if (sessionError || !session) {
            throw sessionError || new Error("Missing recovery session.");
          }

          if (isActive) {
            setMode("update");
            setError("");
            setSuccess("");
          }
        } catch {
          if (isActive) {
            setMode("request");
            setError(invalidMessage);
          }
        } finally {
          if (isActive) {
            setIsInitializing(false);
          }
        }

        return;
      }

      if (!hash) {
        if (isActive) {
          setIsInitializing(false);
        }
        return;
      }

      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const authType = params.get("type");

      clearUrl();

      if (!accessToken || !refreshToken || authType !== expectedAuthType) {
        if (isActive) {
          setMode("request");
          setError(invalidMessage);
          setIsInitializing(false);
        }
        return;
      }

      try {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }

        if (isActive) {
          setMode("update");
          setError("");
          setSuccess("");
        }
      } catch {
        if (isActive) {
          setMode("request");
          setError(invalidMessage);
        }
      } finally {
        if (isActive) {
          setIsInitializing(false);
        }
      }
    }

    void initializeRecoveryState();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createBrowserSupabaseClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : getSiteUrl();
      const redirectTo = new URL("/auth/callback", origin);
      redirectTo.searchParams.set("next", "/reset-password?recovery=1");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: redirectTo.toString(),
        },
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(
        "If an account exists for that email, a password reset link has been sent.",
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to send a reset email right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Your password confirmation does not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
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
    } catch (updatePasswordError) {
      const message =
        updatePasswordError instanceof Error
          ? updatePasswordError.message
          : "Unable to update your password.";

      if (isRecoverySessionError(message)) {
        setMode("request");
        setPassword("");
        setConfirmPassword("");
        setError(
          passwordFlow === "invite" ? invalidInviteMessage : invalidRecoveryMessage,
        );
        return;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isInitializing) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-penn-blue bg-rich-black/50 px-4 py-4 text-sm text-text-secondary">
          Checking your reset link...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mode === "request" ? (
        passwordFlow === "invite" ? (
          <div className="space-y-4">
            <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error || invalidInviteMessage}
            </p>
            <Link
              href="/reset-password"
              className="inline-flex text-sm font-medium text-blue-ncs transition hover:text-white"
            >
              Use password reset instead
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRequestSubmit} className="space-y-5">
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

            {error ? (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-ncs px-4 py-3 font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-text-primary"
              htmlFor="confirm-password"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-penn-blue bg-rich-black px-4 py-3"
              autoComplete="new-password"
              minLength={8}
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
            {isSubmitting
              ? passwordFlow === "invite"
                ? "Saving password..."
                : "Updating password..."
              : passwordFlow === "invite"
                ? "Create password"
                : "Update password"}
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-penn-blue bg-rich-black/50 p-4 text-sm text-text-secondary">
        {mode === "request"
          ? passwordFlow === "invite"
            ? "Open the invite email that was sent to you to create your portal password. If the link is no longer valid, switch to password reset to regain access."
            : "Enter the email tied to your admin or client portal account. If it exists, we'll send a secure reset link."
          : passwordFlow === "invite"
            ? "Choose a password for your portal account. After saving it, you'll be routed into the correct dashboard automatically."
            : "Choose a new password for your portal account. After saving it, you'll be routed back into the correct dashboard automatically."}
      </div>

      <Link
        href="/login"
        className="inline-flex text-sm font-medium text-blue-ncs transition hover:text-white"
      >
        Back to login
      </Link>
    </div>
  );
}
