// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const reduced = vi.hoisted(() => ({ value: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => reduced.value }));

import {
  useEntranceTransition,
  useHoverMotion,
  useReveal,
} from "../motionPresets";

type Listener = () => void;

function mockHover(initial: boolean, { legacy = false } = {}) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initial,
    media: "(hover: hover)",
    addListener: (l: Listener) => listeners.add(l),
    removeListener: (l: Listener) => listeners.delete(l),
    ...(legacy
      ? {}
      : {
          addEventListener: (_: string, l: Listener) => listeners.add(l),
          removeEventListener: (_: string, l: Listener) => listeners.delete(l),
        }),
  };
  vi.stubGlobal("matchMedia", (query: string) =>
    query === "(hover: hover)" ? mql : { ...mql, matches: false, media: query },
  );
  return {
    set(value: boolean) {
      mql.matches = value;
      listeners.forEach((l) => l());
    },
  };
}

afterEach(() => {
  reduced.value = false;
  vi.unstubAllGlobals();
});

const hover = { scale: 1.03, y: -2 };
const tap = { scale: 0.98 };

describe("useReveal", () => {
  it("reveals a section once, in at most 300ms, travelling 8-12px with a strong ease-out", () => {
    const { result } = renderHook(() => useReveal());
    const { section, mount } = result.current;

    for (const preset of [section, mount]) {
      const travel = Math.abs(Number(preset.initial.y));
      expect(travel).toBeGreaterThanOrEqual(8);
      expect(travel).toBeLessThanOrEqual(12);
      expect(preset.initial.opacity).toBe(0);
      expect(preset.transition.duration).toBeLessThanOrEqual(0.3);
      expect(preset.transition.ease).toEqual([0.23, 1, 0.32, 1]);
    }
    expect(section.whileInView).toEqual({ opacity: 1, y: 0 });
    expect(section.viewport.once).toBe(true);
    expect(mount.animate).toEqual({ opacity: 1, y: 0 });
  });

  it("shows content instantly for reduced-motion visitors", () => {
    reduced.value = true;
    const { result } = renderHook(() => useReveal());
    expect(result.current.section.transition.duration).toBe(0);
    expect(result.current.mount.transition.duration).toBe(0);
  });
});

describe("useHoverMotion", () => {
  it("scales on hover and press when the device can hover", () => {
    mockHover(true);
    const { result } = renderHook(() => useHoverMotion(hover, tap));
    expect(result.current).toEqual({ whileHover: hover, whileTap: tap });
  });

  it("skips hover scale on touch devices but keeps press feedback", () => {
    mockHover(false);
    const { result } = renderHook(() => useHoverMotion(hover, tap));
    expect(result.current.whileHover).toBeUndefined();
    expect(result.current.whileTap).toEqual(tap);
  });

  it("drops hover and press motion for reduced-motion visitors", () => {
    mockHover(true);
    reduced.value = true;
    const { result } = renderHook(() => useHoverMotion(hover, tap));
    expect(result.current).toEqual({});
  });

  it("follows hover capability changes, including older Safari's addListener", () => {
    const media = mockHover(false, { legacy: true });
    const { result } = renderHook(() => useHoverMotion(hover));
    expect(result.current.whileHover).toBeUndefined();
    act(() => media.set(true));
    expect(result.current.whileHover).toEqual(hover);
  });
});

describe("useEntranceTransition", () => {
  const spring = { type: "spring", stiffness: 400, damping: 17 } as const;

  it("keeps a control's own entrance transition", () => {
    const { result } = renderHook(() => useEntranceTransition(spring));
    expect(result.current).toEqual(spring);
  });

  it("makes the entrance instant for reduced-motion visitors", () => {
    reduced.value = true;
    const { result } = renderHook(() => useEntranceTransition(spring));
    expect(result.current).toEqual({ duration: 0 });
  });
});
