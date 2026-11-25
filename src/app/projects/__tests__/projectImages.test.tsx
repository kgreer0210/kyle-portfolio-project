// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getPublishedProjects } from "@/data/projects";

const params = vi.hoisted(() => ({ projectId: "dexter-gordy-realtor" }));

vi.mock("motion/react", () => import("@/test/motionMock"));
vi.mock("next/navigation", () => ({
  usePathname: () => `/projects/${params.projectId}`,
  useParams: () => params,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/analytics", () => ({ trackMessageClick: vi.fn() }));

import { trackMessageClick } from "@/lib/analytics";
import ProjectsClient from "../ProjectsClient";
import ProjectDetailClient from "../[projectId]/ProjectDetailClient";

afterEach(cleanup);

/** Widths offered in an img srcset, e.g. [640, 750, ...]. */
function srcsetWidths(img: HTMLImageElement): number[] {
  return (img.getAttribute("srcset") ?? "")
    .split(",")
    .map((candidate) => Number(candidate.trim().split(" ")[1]?.replace("w", "")))
    .filter(Boolean);
}

describe("/projects card images", () => {
  it("are sized to the two-column card, not the viewport", () => {
    const { container } = render(<ProjectsClient />);
    const images = [...container.querySelectorAll("img")];
    expect(images).toHaveLength(getPublishedProjects().length);
    for (const img of images) {
      expect(img).toHaveAttribute(
        "sizes",
        "(min-width: 1152px) 532px, (min-width: 768px) 50vw, 100vw",
      );
      // A full srcset includes widths smaller than the smallest device size.
      expect(srcsetWidths(img)).toContain(384);
    }
  });

  it("never nest a button inside a link", () => {
    const { container } = render(<ProjectsClient />);
    expect(container.querySelector("a button")).toBeNull();
  });
});

describe("/projects/[projectId] page", () => {
  it("sizes the hero image to the content column", () => {
    render(<ProjectDetailClient />);
    const hero = screen.getByRole("img", { name: "Dexter Gordy Realtor" });
    expect(hero).toHaveAttribute("sizes", "(min-width: 1152px) 1104px, 100vw");
  });

  it("sizes showcase thumbnails to their grid column", () => {
    render(<ProjectDetailClient />);
    const thumb = screen.getByRole("img", { name: "Home search" });
    expect(thumb).toHaveAttribute(
      "sizes",
      "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
    );
  });

  it("asks for a message with a link, not a button", () => {
    const { container } = render(<ProjectDetailClient />);
    expect(
      screen.getByRole("link", { name: "Send me a message" }),
    ).toHaveAttribute("href", "/contact");
    expect(screen.queryByText(/Inquire About Similar Project/)).toBeNull();
    expect(container.querySelector("a button")).toBeNull();
  });

  it("tracks the Send me a message click as message_click from project_detail", () => {
    render(<ProjectDetailClient />);
    fireEvent.click(screen.getByRole("link", { name: "Send me a message" }));
    expect(trackMessageClick).toHaveBeenCalledWith("project_detail");
  });
});
