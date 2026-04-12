"use client";

import { useCallback, useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

interface StoredCredential {
  id: string;
  friendly_name: string | null;
  device_type: string;
  backed_up: boolean;
  aaguid: string | null;
  created_at: string;
  last_used_at: string | null;
}

export default function PasskeyRegistration() {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCredentials = useCallback(async () => {
    const res = await fetch("/api/auth/passkey/credentials");
    if (res.ok) {
      const data = await res.json();
      setCredentials(data.credentials ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  async function handleAddPasskey() {
    setIsRegistering(true);
    setError("");
    setSuccess("");

    try {
      // 1. Get registration options
      const optionsRes = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });
      if (!optionsRes.ok) throw new Error("Failed to start passkey registration.");
      const options = await optionsRes.json();

      // 2. Prompt the browser authenticator
      const attestation = await startRegistration({ optionsJSON: options });

      // 3. Verify + store on server
      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });
      const result = await verifyRes.json();

      if (!verifyRes.ok || !result.verified) {
        throw new Error(result.error ?? "Registration failed.");
      }

      setSuccess("Passkey added successfully.");
      await fetchCredentials();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this passkey? You will no longer be able to use it to sign in.")) {
      return;
    }
    const res = await fetch(`/api/auth/passkey/credentials/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    } else {
      setError("Failed to remove passkey.");
    }
  }

  async function handleRename(id: string) {
    const res = await fetch(`/api/auth/passkey/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendly_name: editName }),
    });
    if (res.ok) {
      setCredentials((prev) =>
        prev.map((c) => (c.id === id ? { ...c, friendly_name: editName } : c)),
      );
      setEditingId(null);
    } else {
      setError("Failed to rename passkey.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Passkeys</h2>
          <p className="text-sm text-text-secondary">
            Sign in with Face ID, Touch ID, or a hardware security key.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddPasskey}
          disabled={isRegistering}
          className="rounded-2xl bg-blue-ncs px-4 py-2 text-sm font-semibold text-white transition hover:bg-lapis-lazuli disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRegistering ? "Adding..." : "Add passkey"}
        </button>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-2xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {success}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading passkeys...</p>
      ) : credentials.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No passkeys registered yet.
        </p>
      ) : (
        <ul className="divide-y divide-penn-blue rounded-2xl border border-penn-blue">
          {credentials.map((cred) => (
            <li key={cred.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                {editingId === cred.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="rounded-xl border border-penn-blue bg-rich-black px-3 py-1 text-sm text-text-primary"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleRename(cred.id)}
                      className="text-sm text-blue-ncs hover:text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-sm text-text-secondary hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="truncate text-sm font-medium text-text-primary">
                    {cred.friendly_name ?? "Passkey"}
                    {cred.backed_up ? (
                      <span className="ml-2 text-xs text-text-secondary">(synced)</span>
                    ) : null}
                  </p>
                )}
                <p className="text-xs text-text-secondary">
                  Added {new Date(cred.created_at).toLocaleDateString()}
                  {cred.last_used_at
                    ? ` · Last used ${new Date(cred.last_used_at).toLocaleDateString()}`
                    : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(cred.id);
                    setEditName(cred.friendly_name ?? "");
                  }}
                  className="text-sm text-text-secondary transition hover:text-white"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cred.id)}
                  className="text-sm text-red-400 transition hover:text-red-200"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
