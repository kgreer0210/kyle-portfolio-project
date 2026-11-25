// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const sendGAEvent = vi.hoisted(() => vi.fn());

vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

vi.mock("motion/react", () => import("@/test/motionMock"));

import Contact from "../Contact";

const fetchMock = vi.fn();

function respond(ok: boolean, body: Record<string, unknown>) {
  fetchMock.mockResolvedValueOnce({ ok, json: async () => body });
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Name/), {
    target: { value: "Pat Visitor" },
  });
  fireEvent.change(screen.getByLabelText(/Email/), {
    target: { value: "pat@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/Service/), {
    target: { value: "Website Development" },
  });
  fireEvent.change(screen.getByLabelText(/Message/), {
    target: { value: "I need a new site." },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Send me a message" }));
}

function leadEvents() {
  return sendGAEvent.mock.calls.filter((call) => call[1] === "generate_lead");
}

beforeEach(() => {
  sendGAEvent.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState(null, "", "/contact");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Contact form Lead tracking", () => {
  it("fires generate_lead once with the selected subject after a successful submit", async () => {
    respond(true, { message: "Thanks!" });
    render(<Contact />);

    fillValidForm();
    submit();

    await screen.findByText("Thanks!");
    expect(leadEvents()).toEqual([
      [
        "event",
        "generate_lead",
        { subject: "Website Development", cta_location: "contact_page" },
      ],
    ]);
  });

  it("does not fire generate_lead when validation fails", async () => {
    render(<Contact />);

    submit();

    await screen.findByText("Name is required");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(leadEvents()).toHaveLength(0);
  });

  it("does not fire generate_lead when the server rejects the Message", async () => {
    respond(false, { error: "Something went wrong" });
    render(<Contact />);

    fillValidForm();
    submit();

    await screen.findByText("Something went wrong");
    expect(leadEvents()).toHaveLength(0);
  });

  it("does not fire generate_lead when the request fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network down"));
    render(<Contact />);

    fillValidForm();
    submit();

    await screen.findByText("Network down");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(leadEvents()).toHaveLength(0);
  });
});
