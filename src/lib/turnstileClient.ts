/**
 * Browser-side Turnstile helpers. The script is loaded on demand with
 * explicit rendering, so a blocked or failing script degrades the chat
 * widget instead of throwing. Nothing here needs third-party cookies or
 * storage.
 */

export const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
export const TURNSTILE_SCRIPT_TIMEOUT_MS = 8000;
// How long a send waits for a token before falling back to degraded mode.
export const TURNSTILE_TOKEN_TIMEOUT_MS = 10000;

export interface TurnstileRenderOptions {
  sitekey: string;
  action: string;
  appearance: "always" | "execute" | "interaction-only";
  retry?: "auto" | "never";
  "refresh-expired"?: "auto" | "manual" | "never";
  "refresh-timeout"?: "auto" | "manual" | "never";
  callback: (token: string) => void;
  "error-callback"?: (errorCode: string) => boolean | void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "unsupported-callback"?: () => void;
  "before-interactive-callback"?: () => void;
  "after-interactive-callback"?: () => void;
}

export interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let pendingLoad: Promise<TurnstileApi | null> | null = null;

/**
 * Resolves with the Turnstile API, or null if the script is blocked, errors,
 * or does not load in time. Never rejects. A failed attempt is not cached, so
 * the next call tries again.
 */
export function loadTurnstile(
  timeoutMs: number = TURNSTILE_SCRIPT_TIMEOUT_MS,
): Promise<TurnstileApi | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (pendingLoad) return pendingLoad;

  pendingLoad = new Promise<TurnstileApi | null>((resolve) => {
    let settled = false;
    const script = document.createElement("script");

    const finish = (api: TurnstileApi | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      pendingLoad = null;
      if (!api) script.remove();
      resolve(api);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => finish(window.turnstile ?? null);
    script.onerror = () => finish(null);
    document.head.appendChild(script);
  });
  return pendingLoad;
}
