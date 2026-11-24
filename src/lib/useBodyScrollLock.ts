"use client";

import { useEffect } from "react";

/**
 * Locks page scrolling while `locked` is true, in a way iOS Safari respects.
 * `overflow: hidden` on the body alone does not stop iOS from scrolling the
 * page behind an overlay, so the body is fixed at the current scroll offset and
 * the offset is restored when the lock releases.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      Object.assign(body.style, previous);
      // "instant" skips the html element's smooth scroll-behavior.
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    };
  }, [locked]);
}
