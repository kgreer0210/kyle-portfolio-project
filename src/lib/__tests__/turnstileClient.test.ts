// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadTurnstile, TURNSTILE_SCRIPT_URL } from "@/lib/turnstileClient";

function scriptTag() {
  return document.head.querySelector<HTMLScriptElement>(
    `script[src="${TURNSTILE_SCRIPT_URL}"]`,
  );
}

beforeEach(() => {
  delete window.turnstile;
  document.head.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("loadTurnstile", () => {
  it("resolves immediately when the API is already on the page", async () => {
    const api = { render: vi.fn(), reset: vi.fn(), remove: vi.fn() };
    window.turnstile = api;

    await expect(loadTurnstile()).resolves.toBe(api);
    expect(scriptTag()).toBeNull();
  });

  it("injects a single explicit-render script and resolves with the API on load", async () => {
    const first = loadTurnstile();
    const second = loadTurnstile();

    expect(document.head.querySelectorAll("script")).toHaveLength(1);
    const api = { render: vi.fn(), reset: vi.fn(), remove: vi.fn() };
    window.turnstile = api;
    scriptTag()?.onload?.(new Event("load"));

    await expect(first).resolves.toBe(api);
    await expect(second).resolves.toBe(api);
  });

  it("resolves null, not a rejection, when the script is blocked", async () => {
    const pending = loadTurnstile();
    scriptTag()?.onerror?.(new Event("error"));

    await expect(pending).resolves.toBeNull();
    // The failed tag is removed so a later attempt can retry cleanly.
    expect(scriptTag()).toBeNull();
  });

  it("resolves null when the script hangs past the timeout, then allows a retry", async () => {
    vi.useFakeTimers();
    const pending = loadTurnstile(1000);

    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toBeNull();

    const retry = loadTurnstile(1000);
    expect(document.head.querySelectorAll("script")).toHaveLength(1);
    scriptTag()?.onerror?.(new Event("error"));
    await expect(retry).resolves.toBeNull();
  });

  it("resolves null if the script loads but defines no API", async () => {
    const pending = loadTurnstile();
    scriptTag()?.onload?.(new Event("load"));
    await expect(pending).resolves.toBeNull();
  });
});
