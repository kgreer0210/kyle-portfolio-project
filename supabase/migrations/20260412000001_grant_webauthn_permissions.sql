-- Grant PostgREST roles access to the webauthn schema
GRANT USAGE ON SCHEMA webauthn TO authenticator;
GRANT USAGE ON SCHEMA webauthn TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA webauthn TO service_role;

-- Ensure future tables in this schema are also covered
ALTER DEFAULT PRIVILEGES IN SCHEMA webauthn GRANT ALL ON TABLES TO service_role;
