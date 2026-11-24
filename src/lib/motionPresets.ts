"use client";

/**
 * Shared motion for the public site. Every section reveals once, quickly:
 * at most 300ms, 8-12px of travel and a strong ease-out. Hover scale only
 * runs on devices that can hover, and reduced-motion visitors get neither.
 * The hero H1 and the header never use these: they render visible.
 */

import { useSyncExternalStore } from "react";
import { useReducedMotion, type TargetAndTransition } from "motion/react";

export const REVEAL_EASE = [0.23, 1, 0.32, 1] as const;
export const REVEAL_DURATION = 0.28;
export const REVEAL_DISTANCE = 10;

const HIDDEN = { opacity: 0, y: REVEAL_DISTANCE };
const SHOWN = { opacity: 1, y: 0 };

function transitionFor(reduced: boolean) {
  return { duration: reduced ? 0 : REVEAL_DURATION, ease: REVEAL_EASE };
}

/**
 * Props for the one reveal a section gets. Spread `section` on a motion
 * element that reveals on scroll, or `mount` on a page header that reveals
 * on load. Reduced motion keeps the markup but makes the change instant.
 */
export function useReveal() {
  const transition = transitionFor(Boolean(useReducedMotion()));
  return {
    section: {
      initial: HIDDEN,
      whileInView: SHOWN,
      viewport: { once: true, margin: "0px 0px -64px 0px" },
      transition,
    },
    mount: { initial: HIDDEN, animate: SHOWN, transition },
  };
}

const HOVER_QUERY = "(hover: hover)";

function subscribeToHover(onChange: () => void) {
  const mql = window.matchMedia?.(HOVER_QUERY);
  if (!mql) return () => {};
  // Safari before 14 only has the deprecated addListener API.
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

function canHoverNow() {
  return Boolean(window.matchMedia?.(HOVER_QUERY).matches);
}

/** True when the primary input can hover. False on the server. */
export function useCanHover() {
  return useSyncExternalStore(subscribeToHover, canHoverNow, () => false);
}

/**
 * `whileHover` only under `(hover: hover)`, so a tap never leaves an element
 * stuck scaled; `whileTap` stays as press feedback. Both are dropped for
 * reduced-motion visitors.
 */
export function useHoverMotion(
  hover: TargetAndTransition,
  tap?: TargetAndTransition,
): { whileHover?: TargetAndTransition; whileTap?: TargetAndTransition } {
  const canHover = useCanHover();
  const reduced = Boolean(useReducedMotion());
  if (reduced) return {};
  return {
    ...(canHover ? { whileHover: hover } : {}),
    ...(tap ? { whileTap: tap } : {}),
  };
}
