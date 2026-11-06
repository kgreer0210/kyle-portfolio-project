// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatWidget from "@/components/ChatWidget";
import { getPublicTurnstileSiteKey } from "@/lib/turnstile";
import type { TurnstileApi, TurnstileRenderOptions } from "@/lib/turnstileClient";

// The server layout decides whether Turnstile is on and passes the site key
// down; the widget never reads Turnstile environment variables itself.
function renderWidget(siteKey: string | null) {
  render(<ChatWidget turnstileSiteKey={siteKey ?? undefined} />);
  fireEvent.click(screen.getByRole("button", { name: /open chat/i }));
}

function installTurnstile() {
  const state: { options: TurnstileRenderOptions | null } = { options: null };
  const api: TurnstileApi = {
    render: vi.fn((_container, options) => {
      state.options = options;
      return "widget-1";
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  window.turnstile = api;
  return { api, state };
}

function submitFirstMessage(text = "I need a website for my bakery") {
  fireEvent.change(screen.getByPlaceholderText(/short note/i), {
    target: { value: text },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /start the conversation/i }),
  );
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>, call = 0) {
  return JSON.parse(fetchMock.mock.calls[call][1].body as string);
}

function textResponse(text: string) {
  return new Response(text, { status: 200 });
}

function jsonError(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status });
}

beforeEach(() => {
  window.sessionStorage.clear();
  delete window.turnstile;
  document.head.innerHTML = "";
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ChatWidget without a Turnstile site key", () => {
  it("sends no Turnstile fields and never loads the script", async () => {
    const fetchMock = vi.fn(async () => textResponse("Happy to help"));
    vi.stubGlobal("fetch", fetchMock);
    renderWidget(null);

    submitFirstMessage();

    await screen.findByText("Happy to help");
    expect(requestBody(fetchMock)).not.toHaveProperty("turnstileToken");
    expect(document.head.querySelector("script[src*=turnstile]")).toBeNull();
  });

  it("does not load, wait for, or block on Turnstile when the server has it half-configured", async () => {
    // A site key with no secret: the server bypasses verification, so the
    // layout hands the widget nothing and the browser must not wait for a token.
    const siteKey = getPublicTurnstileSiteKey({
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-key",
      TURNSTILE_ALLOWED_HOSTNAMES: "kygrsolutions.com",
    });
    expect(siteKey).toBeUndefined();
    const fetchMock = vi.fn(async () => textResponse("Happy to help"));
    vi.stubGlobal("fetch", fetchMock);
    renderWidget(siteKey ?? null);

    submitFirstMessage();

    await screen.findByText("Happy to help");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestBody(fetchMock)).not.toHaveProperty("turnstileToken");
    expect(document.head.querySelector("script[src*=turnstile]")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /try the security check again/i }),
    ).toBeNull();
  });

  it("keeps the composer for visitors who skip the optional name", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => textResponse("Happy to help")));
    renderWidget(null);

    submitFirstMessage();

    await screen.findByText("Happy to help");
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  it("restores the message and shows the wait when rate limited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonError(429, {
          code: "rate_limited",
          error:
            "You're sending messages faster than I can keep up. Please wait about 30 seconds and try again.",
        }),
      ),
    );
    renderWidget(null);

    submitFirstMessage("I need a website for my bakery");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /about 30 seconds/i,
    );
    expect(screen.getByPlaceholderText(/short note/i)).toHaveValue(
      "I need a website for my bakery",
    );
  });
});

describe("ChatWidget when the server cannot save", () => {
  it("restores the message and asks the visitor to retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonError(503, {
          code: "storage_unavailable",
          error: "I couldn't save that just now, so I haven't sent it. Please try again in a moment, or reach me directly.",
        }),
      ),
    );
    renderWidget(null);

    submitFirstMessage("I need a website for my bakery");

    expect(await screen.findByRole("alert")).toHaveTextContent(/haven't sent it/i);
    expect(screen.getByPlaceholderText(/short note/i)).toHaveValue(
      "I need a website for my bakery",
    );
  });
});

describe("ChatWidget with a Turnstile site key", () => {
  it("renders an interaction-only widget for the chat action and sends its token", async () => {
    const { api, state } = installTurnstile();
    const fetchMock = vi.fn(async () => textResponse("Happy to help"));
    vi.stubGlobal("fetch", fetchMock);
    renderWidget("site-key");

    await waitFor(() => expect(api.render).toHaveBeenCalled());
    expect(state.options).toMatchObject({
      sitekey: "site-key",
      action: "chat",
      appearance: "interaction-only",
    });
    state.options?.callback("token-1");
    submitFirstMessage();

    await screen.findByText("Happy to help");
    expect(requestBody(fetchMock)).toMatchObject({ turnstileToken: "token-1" });
  });

  it("does not send a token again after the first message is accepted", async () => {
    const { api, state } = installTurnstile();
    const fetchMock = vi.fn(async () => textResponse("Happy to help"));
    vi.stubGlobal("fetch", fetchMock);
    renderWidget("site-key");
    await waitFor(() => expect(api.render).toHaveBeenCalled());
    state.options?.callback("token-1");
    submitFirstMessage();
    await screen.findByText("Happy to help");

    fireEvent.change(screen.getByPlaceholderText(/type a message/i), {
      target: { value: "And how long does it take?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(requestBody(fetchMock, 1)).not.toHaveProperty("turnstileToken");
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("widget-1"));
  });

  it("sends nothing, keeps the message, and offers retry plus contact options when the script is blocked", async () => {
    const fetchMock = vi.fn(async () => textResponse("Happy to help"));
    vi.stubGlobal("fetch", fetchMock);
    renderWidget("site-key");
    const tag = await waitFor(() => {
      const found = document.head.querySelector<HTMLScriptElement>(
        "script[src*=turnstile]",
      );
      expect(found).not.toBeNull();
      return found;
    });
    tag?.onerror?.(new Event("error"));

    submitFirstMessage("I need a website for my bakery");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /security check didn't load/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/short note/i)).toHaveValue(
      "I need a website for my bakery",
    );
    expect(
      screen.getByRole("button", { name: /try the security check again/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "(478) 777-1266" })).toHaveAttribute(
      "href",
      "tel:+14787771266",
    );
    expect(screen.getByRole("link", { name: /contact form/i })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("retries the script and sends once a token arrives", async () => {
    const fetchMock = vi.fn(async () => textResponse("Happy to help"));
    vi.stubGlobal("fetch", fetchMock);
    renderWidget("site-key");
    const tag = await waitFor(() => {
      const found = document.head.querySelector<HTMLScriptElement>(
        "script[src*=turnstile]",
      );
      expect(found).not.toBeNull();
      return found;
    });
    tag?.onerror?.(new Event("error"));
    submitFirstMessage();
    const retry = await screen.findByRole("button", {
      name: /try the security check again/i,
    });

    // The script becomes reachable before the visitor retries.
    const { api, state } = installTurnstile();
    fireEvent.click(retry);
    await waitFor(() => expect(api.render).toHaveBeenCalled());
    state.options?.callback("token-2");
    fireEvent.click(
      screen.getByRole("button", { name: /start the conversation/i }),
    );

    await screen.findByText("Happy to help");
    expect(requestBody(fetchMock)).toMatchObject({ turnstileToken: "token-2" });
  });

  it("does not send, and shows the fallback, if the widget errors out", async () => {
    const { api, state } = installTurnstile();
    const fetchMock = vi.fn(async () => textResponse("Happy to help"));
    vi.stubGlobal("fetch", fetchMock);
    renderWidget("site-key");
    await waitFor(() => expect(api.render).toHaveBeenCalled());
    state.options?.["error-callback"]?.("300030");

    submitFirstMessage();

    expect(
      await screen.findByRole("button", { name: /try the security check again/i }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not crash, and does not send, when turnstile.render throws", async () => {
    const { api } = installTurnstile();
    vi.mocked(api.render).mockImplementation(() => {
      throw new Error("bad sitekey");
    });
    const fetchMock = vi.fn(async () => textResponse("Happy to help"));
    vi.stubGlobal("fetch", fetchMock);
    renderWidget("site-key");

    submitFirstMessage();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the retry and contact options when the server cannot verify", async () => {
    const { api, state } = installTurnstile();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonError(503, {
          code: "turnstile_unavailable",
          error: "I couldn't finish the security check just now.",
        }),
      ),
    );
    renderWidget("site-key");
    await waitFor(() => expect(api.render).toHaveBeenCalled());
    state.options?.callback("tok");

    submitFirstMessage("I need a website for my bakery");

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't finish/i);
    expect(
      screen.getByRole("button", { name: /try the security check again/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/short note/i)).toHaveValue(
      "I need a website for my bakery",
    );
  });

  it("restores the message and resets the widget when verification fails", async () => {
    const { api, state } = installTurnstile();
    const fetchMock = vi.fn(async () =>
      jsonError(403, {
        code: "turnstile_failed",
        error:
          "The security check didn't go through. Please send your message again and it should clear.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderWidget("site-key");
    await waitFor(() => expect(api.render).toHaveBeenCalled());
    state.options?.callback("spent-token");

    submitFirstMessage("I need a website for my bakery");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /security check didn't go through/i,
    );
    expect(screen.getByPlaceholderText(/short note/i)).toHaveValue(
      "I need a website for my bakery",
    );
    await waitFor(() => expect(api.reset).toHaveBeenCalledWith("widget-1"));
  });
});
