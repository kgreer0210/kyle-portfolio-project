export const webAuthnConfig = {
  rpID: process.env.WEBAUTHN_RP_ID ?? "kygrsolutions.com",
  rpName: process.env.WEBAUTHN_RP_NAME ?? "Kyle Greer Portal",
  origin: process.env.WEBAUTHN_ORIGIN ?? "https://kygrsolutions.com",
} as const;
