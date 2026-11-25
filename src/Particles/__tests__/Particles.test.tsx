// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

const ogl = vi.hoisted(() => ({
  renderer: null as null | {
    gl: { canvas: HTMLCanvasElement };
    render: ReturnType<typeof import("vitest").vi.fn>;
    dpr: number;
  },
  vertexCount: 0,
}));

vi.mock("ogl", () => {
  class Renderer {
    gl: { canvas: HTMLCanvasElement; clearColor: () => void; POINTS: number };
    render = vi.fn();
    dpr: number;
    constructor({ dpr = 1 }: { dpr?: number } = {}) {
      this.dpr = dpr;
      this.gl = {
        canvas: document.createElement("canvas"),
        clearColor: () => {},
        POINTS: 0,
      };
      ogl.renderer = this;
    }
    setSize() {}
  }
  class Camera {
    position = { set() {} };
    perspective() {}
  }
  class Geometry {
    constructor(_gl: unknown, attrs: { position: { data: Float32Array } }) {
      ogl.vertexCount = attrs.position.data.length / 3;
    }
  }
  class Program {
    uniforms = { uTime: { value: 0 } };
  }
  class Mesh {
    position = { x: 0, y: 0 };
    rotation = { x: 0, y: 0, z: 0 };
  }
  return { Renderer, Camera, Geometry, Program, Mesh };
});

import Particles from "../Particles";

function mockMedia(matching: string[]) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      matches: matching.includes(query),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }),
  );
}

let raf: ReturnType<typeof vi.fn>;

beforeEach(() => {
  raf = vi.fn(() => 1);
  vi.stubGlobal("requestAnimationFrame", raf);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe() {
        this.cb(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
    },
  );
  Object.defineProperty(window, "devicePixelRatio", { value: 3, configurable: true });
  window.innerWidth = 1440;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Particles", () => {
  it("animates 1,000 points with a capped pixel ratio on desktop", () => {
    mockMedia([]);
    render(<Particles particleCount={1000} moveParticlesOnHover />);
    expect(ogl.vertexCount).toBe(1000);
    expect(ogl.renderer!.dpr).toBe(1.5);
    expect(raf).toHaveBeenCalled();
  });

  it("renders one still frame and schedules no animation frames for reduced motion", () => {
    mockMedia(["(prefers-reduced-motion: reduce)"]);
    render(<Particles particleCount={1000} />);
    expect(ogl.renderer!.render).toHaveBeenCalledTimes(1);
    expect(raf).not.toHaveBeenCalled();
  });

  it("is lighter on a 390px touch phone and never listens for mousemove", () => {
    mockMedia(["(hover: none)", "(pointer: coarse)"]);
    window.innerWidth = 390;
    const listen = vi.spyOn(document, "addEventListener");
    render(<Particles particleCount={1000} moveParticlesOnHover />);
    expect(ogl.vertexCount).toBe(350);
    expect(ogl.renderer!.dpr).toBeLessThanOrEqual(1.5);
    expect(listen.mock.calls.map(([type]) => type)).not.toContain("mousemove");
  });

  it("stops the loop and removes the canvas when the WebGL context is lost", () => {
    mockMedia([]);
    const { container } = render(<Particles particleCount={1000} />);
    const canvas = ogl.renderer!.gl.canvas;
    expect(container.contains(canvas)).toBe(true);

    raf.mockClear();
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    document.dispatchEvent(new Event("visibilitychange"));

    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(raf).not.toHaveBeenCalled();
    expect(container.contains(canvas)).toBe(false);
  });

  it("pauses while the document is hidden", () => {
    mockMedia([]);
    render(<Particles particleCount={1000} />);
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(cancelAnimationFrame).toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  });

  it("stops animating when reduced motion turns on mid-visit", () => {
    const matching: string[] = [];
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", (query: string) => ({
      get matches() {
        return matching.includes(query);
      },
      media: query,
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
      addListener() {},
      removeListener() {},
    }));
    render(<Particles particleCount={1000} />);
    expect(raf).toHaveBeenCalled();

    raf.mockClear();
    const renders = vi.mocked(ogl.renderer!.render);
    matching.push("(prefers-reduced-motion: reduce)");
    act(() => listeners.forEach((cb) => cb()));

    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(raf).not.toHaveBeenCalled();
    // The rebuilt scene draws one still frame.
    expect(ogl.renderer!.render).not.toBe(renders);
    expect(ogl.renderer!.render).toHaveBeenCalledTimes(1);
  });
});
