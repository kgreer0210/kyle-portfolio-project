"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import { isAnalyticsExcludedPath, setGaDisabled } from "@/lib/analytics";

// useLayoutEffect warns during SSR; this component only needs it in the browser.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Loads GA4 on public routes only. On excluded routes (admin, portal, auth) it
 * never mounts the tag, and if gtag is already running from an earlier public
 * page it sets Google's `ga-disable-<ID>` flag so Enhanced Measurement's
 * history-change page_view is dropped.
 */
export default function GoogleAnalyticsGate({
  measurementId,
}: {
  measurementId: string;
}) {
  const pathname = usePathname();
  const excluded = isAnalyticsExcludedPath(pathname);

  // Set during render on purpose: the App Router writes history (pushState)
  // in a commit-phase insertion effect, which gtag's history listener reacts
  // to. Updating the flag here guarantees it is current before that event.
  setGaDisabled(measurementId, excluded);

  // Re-assert the committed route's value after each route change commits.
  // (A discarded render is corrected the next time this component renders.)
  useIsomorphicLayoutEffect(() => {
    setGaDisabled(measurementId, excluded);
  }, [measurementId, excluded]);

  // Back/forward: the browser updates location and fires popstate before
  // React re-renders. This listener is registered at hydration, before gtag
  // loads and adds its own, so it runs first.
  useEffect(() => {
    const syncFromLocation = () => {
      setGaDisabled(
        measurementId,
        isAnalyticsExcludedPath(window.location.pathname),
      );
    };
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [measurementId]);

  return excluded ? null : <GoogleAnalytics gaId={measurementId} />;
}
