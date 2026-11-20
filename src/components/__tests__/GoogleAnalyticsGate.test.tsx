// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => (
    <span data-testid="ga" data-ga-id={gaId} />
  ),
}));

import GoogleAnalyticsGate from "../GoogleAnalyticsGate";

const ID = "G-TEST123";
const flag = () =>
  (window as unknown as Record<string, unknown>)[`ga-disable-${ID}`];

beforeEach(() => {
  pathname.current = "/";
  delete (window as unknown as Record<string, unknown>)[`ga-disable-${ID}`];
});
afterEach(cleanup);

describe("GoogleAnalyticsGate", () => {
  it("mounts GA and leaves tracking enabled on public routes", () => {
    const { queryByTestId } = render(<GoogleAnalyticsGate measurementId={ID} />);
    expect(queryByTestId("ga")).not.toBeNull();
    expect(flag()).toBe(false);
  });

  it("does not mount GA and disables tracking on excluded routes", () => {
    pathname.current = "/admin/tickets";
    const { queryByTestId } = render(<GoogleAnalyticsGate measurementId={ID} />);
    expect(queryByTestId("ga")).toBeNull();
    expect(flag()).toBe(true);
  });

  it("toggles the disable flag across client-side navigations", () => {
    const { rerender, queryByTestId } = render(
      <GoogleAnalyticsGate measurementId={ID} />,
    );
    pathname.current = "/portal";
    rerender(<GoogleAnalyticsGate measurementId={ID} />);
    expect(flag()).toBe(true);
    expect(queryByTestId("ga")).toBeNull();

    pathname.current = "/projects";
    rerender(<GoogleAnalyticsGate measurementId={ID} />);
    expect(flag()).toBe(false);
    expect(queryByTestId("ga")).not.toBeNull();
  });

  it("syncs the flag from location on back/forward (popstate)", () => {
    render(<GoogleAnalyticsGate measurementId={ID} />);
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(flag()).toBe(true);
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(flag()).toBe(false);
  });
});
