"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadTurnstile,
  TURNSTILE_TOKEN_TIMEOUT_MS,
  type TurnstileApi,
} from "@/lib/turnstileClient";

export interface TurnstileTokenResult {
  token: string | null;
  /** True when no token could be produced: script blocked, errored, or timed out. */
  unavailable: boolean;
}

type Waiter = (result: TurnstileTokenResult) => void;

/**
 * Runs an interaction-only (managed, nearly invisible) Turnstile widget while
 * `active`. `getToken` hands out the current token or waits a bounded time for
 * one; `reset` discards a spent token and requests a fresh one.
 */
export function useTurnstile(siteKey: string | undefined, active: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<TurnstileApi | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const unavailableRef = useRef(false);
  const waitersRef = useRef<Waiter[]>([]);
  const [interactive, setInteractive] = useState(false);

  const flush = useCallback((result: TurnstileTokenResult) => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    waiters.forEach((resolve) => resolve(result));
  }, []);

  useEffect(() => {
    if (!siteKey || !active) return;
    let cancelled = false;
    unavailableRef.current = false;
    tokenRef.current = null;

    void loadTurnstile().then((api) => {
      const container = containerRef.current;
      if (cancelled) return;
      if (!api || !container) {
        unavailableRef.current = true;
        flush({ token: null, unavailable: true });
        return;
      }
      try {
        apiRef.current = api;
        widgetIdRef.current = api.render(container, {
          sitekey: siteKey,
          action: "chat",
          appearance: "interaction-only",
          retry: "auto",
          "refresh-expired": "auto",
          "refresh-timeout": "auto",
          callback: (token) => {
            tokenRef.current = token;
            unavailableRef.current = false;
            flush({ token, unavailable: false });
          },
          "error-callback": () => {
            tokenRef.current = null;
            unavailableRef.current = true;
            flush({ token: null, unavailable: true });
            return true;
          },
          "expired-callback": () => {
            tokenRef.current = null;
          },
          "timeout-callback": () => {
            tokenRef.current = null;
          },
          "unsupported-callback": () => {
            unavailableRef.current = true;
            flush({ token: null, unavailable: true });
          },
          "before-interactive-callback": () => setInteractive(true),
          "after-interactive-callback": () => setInteractive(false),
        });
      } catch {
        // A broken or partially loaded script must never crash the chat.
        unavailableRef.current = true;
        flush({ token: null, unavailable: true });
      }
    });

    return () => {
      cancelled = true;
      const widgetId = widgetIdRef.current;
      if (widgetId && apiRef.current) {
        try {
          apiRef.current.remove(widgetId);
        } catch {
          /* noop */
        }
      }
      widgetIdRef.current = null;
      apiRef.current = null;
      tokenRef.current = null;
      setInteractive(false);
      flush({ token: null, unavailable: true });
    };
  }, [siteKey, active, flush]);

  const getToken = useCallback((): Promise<TurnstileTokenResult> => {
    if (!siteKey) return Promise.resolve({ token: null, unavailable: false });
    if (tokenRef.current) {
      return Promise.resolve({ token: tokenRef.current, unavailable: false });
    }
    if (unavailableRef.current) {
      return Promise.resolve({ token: null, unavailable: true });
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        waitersRef.current = waitersRef.current.filter((w) => w !== waiter);
        resolve({ token: null, unavailable: true });
      }, TURNSTILE_TOKEN_TIMEOUT_MS);
      const waiter: Waiter = (result) => {
        clearTimeout(timer);
        resolve(result);
      };
      waitersRef.current.push(waiter);
    });
  }, [siteKey]);

  /** Tokens are single use: drop the spent one and ask for a new one. */
  const reset = useCallback(() => {
    tokenRef.current = null;
    unavailableRef.current = false;
    const widgetId = widgetIdRef.current;
    if (widgetId && apiRef.current) {
      try {
        apiRef.current.reset(widgetId);
      } catch {
        /* noop */
      }
    }
  }, []);

  return { containerRef, getToken, reset, interactive };
}
