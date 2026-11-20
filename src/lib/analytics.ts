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
