/**
 * Canonical public origin for SEO surfaces (metadataBase, sitemap, robots,
 * JSON-LD). Intentionally a constant rather than NEXT_PUBLIC_SITE_URL so
 * preview deployments never publish a preview host or a stale value in the
 * sitemap. Matches the getSiteUrl() fallback in src/lib/crm.ts.
 */
export const CANONICAL_SITE_URL = "https://www.kygrsolutions.com";
