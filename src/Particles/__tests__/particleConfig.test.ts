import { describe, expect, it } from "vitest";
import { selectParticleConfig } from "../particleConfig";

const desktop = {
  touch: false,
  viewportWidth: 1440,
  devicePixelRatio: 2,
  reducedMotion: false,
};

describe("selectParticleConfig", () => {
  it("renders 1,000 animated points that follow the mouse on desktop", () => {
    expect(selectParticleConfig(desktop, { followPointer: true })).toEqual({
      particleCount: 1000,
      dpr: 1.5,
      followPointer: true,
      animate: true,
    });
  });

  it("drops to about 350 points and ignores the pointer on a 390px touch phone", () => {
    const config = selectParticleConfig(
      { touch: true, viewportWidth: 390, devicePixelRatio: 3, reducedMotion: false },
      { followPointer: true },
    );
    expect(config.particleCount).toBe(350);
    expect(config.dpr).toBeLessThanOrEqual(1.5);
    expect(config.followPointer).toBe(false);
    expect(config.animate).toBe(true);
  });

  it("treats a large touch screen as touch", () => {
    const config = selectParticleConfig(
      { ...desktop, touch: true, viewportWidth: 1366 },
      { followPointer: true },
    );
    expect(config.particleCount).toBe(350);
    expect(config.followPointer).toBe(false);
  });

  it("treats a narrow mouse window as small", () => {
    const config = selectParticleConfig({ ...desktop, viewportWidth: 600 });
    expect(config.particleCount).toBe(350);
  });

  it("keeps a low-density screen at its own pixel ratio", () => {
    expect(selectParticleConfig({ ...desktop, devicePixelRatio: 1 }).dpr).toBe(1);
  });

  it("does not loop for reduced-motion users", () => {
    const config = selectParticleConfig(
      { ...desktop, reducedMotion: true },
      { followPointer: true },
    );
    expect(config.animate).toBe(false);
    expect(config.followPointer).toBe(false);
  });

  it("does not follow the pointer unless asked to", () => {
    expect(selectParticleConfig(desktop).followPointer).toBe(false);
  });
});
