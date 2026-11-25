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

  it("keeps landscape showcase thumbnails center-cropped in the landscape frame", () => {
    render(<ProjectDetailClient />);
    const thumb = screen.getByRole("img", { name: "Home search" });
    expect(thumb).toHaveClass("object-cover");
    expect(thumb).not.toHaveClass("object-top");
    expect(thumb.parentElement).toHaveClass("h-40", "sm:h-48");
  });

  it("frames the Level Up mobile friendly shot from the top in a narrow column", () => {
    params.projectId = "level-up-media-outlet";
    try {
      render(<ProjectDetailClient />);
      const thumb = screen.getByRole("img", { name: "Mobile friendly" });
      expect(thumb).toHaveClass("object-cover", "object-top");
      expect(thumb).toHaveAttribute(
        "sizes",
        "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
      );
      const column = thumb.parentElement;
      expect(column).toHaveClass("w-1/2", "mx-auto");
      expect(column?.parentElement).toHaveClass("h-40", "sm:h-48");

      // Other Level Up shots stay landscape.
      const landscape = screen.getByRole("img", { name: "Sports portfolio" });
      expect(landscape).toHaveClass("object-cover");
      expect(landscape).not.toHaveClass("object-top");
    } finally {
      params.projectId = "dexter-gordy-realtor";
    }
  });

  it("shows the whole mobile friendly shot, not a crop, in the detail modal", () => {
    params.projectId = "level-up-media-outlet";
    try {
      render(<ProjectDetailClient />);
      fireEvent.click(screen.getByRole("img", { name: "Mobile friendly" }));
      const images = screen.getAllByRole("img", { name: "Mobile friendly" });
      const modalImage = images[images.length - 1];
      expect(modalImage).toHaveAttribute("width", "390");
      expect(modalImage).toHaveAttribute("height", "844");
      expect(modalImage).toHaveClass("w-auto", "h-auto");
      expect(modalImage).not.toHaveClass("object-cover");
    } finally {
      params.projectId = "dexter-gordy-realtor";
    }
  });

  it.each(["dexter-gordy-realtor", "level-up-media-outlet"])(
    "sizes the %s gallery to its cards, not the viewport",
    (projectId) => {
      params.projectId = projectId;
      try {
        render(<ProjectDetailClient />);
        const showcase = screen.getByTestId("backend-showcase");
        // A min-h-screen wrapper leaves a blank band above the footer when
        // the gallery is shorter than the viewport.
        expect(showcase.className).not.toMatch(/\bmin-h-(screen|\[)/);
        expect(showcase).not.toHaveClass("py-20");
        expect(showcase).not.toHaveClass("pb-20");
        const project = getPublishedProjects().find((p) => p.id === projectId);
        const titles = project?.backendShowcase?.screenshots.map((s) => s.title) ?? [];
        expect(titles.length).toBeGreaterThan(0);
        for (const title of titles) {
          expect(screen.getByRole("img", { name: title })).toBeInTheDocument();
        }
      } finally {
        params.projectId = "dexter-gordy-realtor";
      }
    },
  );

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
