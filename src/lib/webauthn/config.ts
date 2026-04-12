export const webAuthnConfig = {
  rpID: process.env.WEBAUTHN_RP_ID ?? "localhost",
  rpName: process.env.WEBAUTHN_RP_NAME ?? "Kyle Greer Portal",
  origin: process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000",
} as const;
