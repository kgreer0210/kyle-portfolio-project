import { sendGAEvent } from "@next/third-parties/google";

/**
 * GA4 is limited to the public marketing site. The admin CRM, client portal,
 * and their auth pages never load or report to Google Analytics.
 */
export const ANALYTICS_EXCLUDED_PREFIXES = [
  "/admin",
  "/portal",
  "/login",
  "/auth",
  "/reset-password",
] as const;

/** True for an excluded prefix itself or any nested route under it. */
export function isAnalyticsExcludedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return ANALYTICS_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Google's documented per-property opt-out flag: window['ga-disable-<ID>']. */
export function gaDisableKey(measurementId: string): string {
  return `ga-disable-${measurementId}`;
}

export function setGaDisabled(measurementId: string, disabled: boolean): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>)[gaDisableKey(measurementId)] =
    disabled;
}

/** Where on the site a tracked CTA lives. Sent to GA4 as `cta_location`. */
export const CTA_LOCATIONS = [
  "header",
  "mobile_menu",
  "hero",
  "home_tech_review",
  "home_final",
  "services",
  "about",
  "contact_page",
  "footer",
  "chat",
  "idx",
  "local_landing",
] as const;

export type CtaLocation = (typeof CTA_LOCATIONS)[number];

// The only place GA4 event names exist. Every event goes through here so the
// analytics exclusion applies to all of them.
function trackEvent(name: string, params: Record<string, string>): void {
  if (typeof window === "undefined") return;
  if (isAnalyticsExcludedPath(window.location.pathname)) return;
  // Analytics must never break the action it reports on, such as a sent
  // contact form.
  try {
    sendGAEvent("event", name, params);
  } catch {
    // Ignore: a blocked or broken gtag is not the visitor's problem.
  }
}

/**
 * A Lead: fire only after a Message has sent successfully. Clicks that show
 * intent (call, phone, email) are tracked separately and are not Leads.
 */
export function trackLead({
  subject,
  ctaLocation,
}: {
  subject: string;
  ctaLocation: CtaLocation;
}): void {
  trackEvent("generate_lead", { subject, cta_location: ctaLocation });
}

/** A click on a Book a 30-min call (Consult call) link. */
export function trackBookCallClick(ctaLocation: CtaLocation): void {
  trackEvent("book_call_click", { cta_location: ctaLocation });
}

/** A click on a tel: link. */
export function trackPhoneClick(ctaLocation: CtaLocation): void {
  trackEvent("phone_click", { cta_location: ctaLocation });
}

/** A click on a mailto: link. */
export function trackEmailClick(ctaLocation: CtaLocation): void {
  trackEvent("email_click", { cta_location: ctaLocation });
}
