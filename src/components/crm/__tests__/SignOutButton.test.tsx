// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const signOut = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { signOut },
  }),
}));

import SignOutButton from "../SignOutButton";

afterEach(() => {
  cleanup();
  replace.mockReset();
  refresh.mockReset();
  signOut.mockReset();
});

describe("SignOutButton", () => {
  it("opens the login page after the server accepts a global sign-out", async () => {
    signOut.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<SignOutButton />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith();
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stays on the page when global sign-out fails and the session is kept", async () => {
    signOut.mockResolvedValue({ error: { message: "Failed to fetch" } });
    const user = userEvent.setup();
    render(<SignOutButton />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalledWith();
    expect(replace).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "You are still signed in",
    );

    signOut.mockResolvedValue({ error: null });
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalledTimes(2);
    expect(signOut).toHaveBeenNthCalledWith(2);
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
