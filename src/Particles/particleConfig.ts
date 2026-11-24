/**
 * Chooses how heavy the particle background may be on this device. Kept pure
 * so the phone, touch and reduced-motion rules are testable without WebGL.
 */

export const DESKTOP_PARTICLE_COUNT = 1000;
export const LIGHT_PARTICLE_COUNT = 350;
export const MAX_PARTICLE_DPR = 1.5;
/** Below this width a mouse-driven window still gets the light background. */
export const SMALL_SCREEN_MAX_WIDTH = 767;

export interface ParticleEnvironment {
  /** Primary input is touch (`(hover: none)` or `(pointer: coarse)`). */
  touch: boolean;
  viewportWidth: number;
  devicePixelRatio: number;
  reducedMotion: boolean;
}

export interface ParticleRuntimeConfig {
  particleCount: number;
  dpr: number;
  /** Attach a mousemove listener and drift with the pointer. */
  followPointer: boolean;
  /** Run the requestAnimationFrame loop; false renders one still frame. */
  animate: boolean;
}

export function selectParticleConfig(
  env: ParticleEnvironment,
  {
    followPointer = false,
    desktopCount = DESKTOP_PARTICLE_COUNT,
  }: { followPointer?: boolean; desktopCount?: number } = {},
): ParticleRuntimeConfig {
  const light = env.touch || env.viewportWidth <= SMALL_SCREEN_MAX_WIDTH;
  const animate = !env.reducedMotion;
  return {
    particleCount: light
      ? Math.min(LIGHT_PARTICLE_COUNT, desktopCount)
      : desktopCount,
    dpr: Math.min(Math.max(env.devicePixelRatio || 1, 1), MAX_PARTICLE_DPR),
    followPointer: followPointer && animate && !env.touch,
    animate,
  };
}

/** Reads the environment from the browser. Call only on the client. */
export function readParticleEnvironment(win: Window = window): ParticleEnvironment {
  const matches = (query: string) =>
    typeof win.matchMedia === "function" && win.matchMedia(query).matches;
  return {
    touch: matches("(hover: none)") || matches("(pointer: coarse)"),
    viewportWidth: win.innerWidth,
    devicePixelRatio: win.devicePixelRatio,
    reducedMotion: matches("(prefers-reduced-motion: reduce)"),
  };
}
