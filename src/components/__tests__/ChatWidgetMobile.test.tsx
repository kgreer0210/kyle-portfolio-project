// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendGAEvent = vi.hoisted(() => vi.fn());
vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

import ChatWidget from "@/components/ChatWidget";

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  sendGAEvent.mockClear();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ChatWidget floating button", () => {
  it("has an accessible name that includes its visible text", () => {
    render(<ChatWidget />);

    expect(
      screen.getByRole("button", { name: /chat with my ai/i }),
    ).toBeInTheDocument();
  });
});

function openChat() {
  render(<ChatWidget />);
  fireEvent.click(screen.getByRole("button", { name: /chat with my ai/i }));
}

async function startConversation() {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("Happy to help")));
  openChat();
  fireEvent.change(screen.getByLabelText(/what brought you here/i), {
    target: { value: "I need a website for my bakery" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /start the conversation/i }),
  );
  await screen.findByText("Happy to help");
}

describe("ChatWidget fields", () => {
  it("ties each visible label on the start form to its field", () => {
    openChat();

    expect(screen.getByLabelText(/first name/i)).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/what brought you here/i).tagName).toBe(
      "TEXTAREA",
    );
  });

  it("gives the message composer an accessible label", async () => {
    await startConversation();

    expect(screen.getByLabelText(/your message/i)).toHaveAttribute(
      "placeholder",
      "Type a message…",
    );
  });
});
