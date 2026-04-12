-- WebAuthn passkey credentials storage
-- All access goes through service-role admin client in API routes; no direct user access.

CREATE SCHEMA IF NOT EXISTS webauthn;

CREATE TABLE webauthn.credentials (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT        NOT NULL UNIQUE,    -- base64url-encoded device credential ID
  public_key    TEXT        NOT NULL,           -- base64url-encoded COSE public key
  counter       BIGINT      NOT NULL DEFAULT 0, -- signature counter for replay-attack protection
  device_type   TEXT        NOT NULL,           -- 'singleDevice' | 'multiDevice'
  backed_up     BOOLEAN     NOT NULL DEFAULT false,
  transports    TEXT[],                         -- e.g. ['internal', 'hybrid', 'usb']
  friendly_name TEXT,                           -- user-set label, e.g. "MacBook Touch ID"
  aaguid        TEXT,                           -- authenticator model UUID
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at  TIMESTAMPTZ
);

CREATE INDEX ON webauthn.credentials (user_id);
CREATE INDEX ON webauthn.credentials (credential_id);

-- RLS on: deny all direct access; service-role bypasses RLS automatically.
ALTER TABLE webauthn.credentials ENABLE ROW LEVEL SECURITY;
