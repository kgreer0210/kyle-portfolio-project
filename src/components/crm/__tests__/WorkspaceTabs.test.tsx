// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkspaceTabs from "../WorkspaceTabs";

afterEach(cleanup);
const sections = [
  { id: "work", label: "Work", content: <p>Project work</p> },
  {
    id: "notes",
    label: "Notes",
    content: (
      <label>
        Draft note
        <input aria-label="Draft note" />
      </label>
    ),
  },
  { id: "context", label: "AI context", content: <p>Source settings</p> },
];

describe("WorkspaceTabs", () => {
  it("supports arrow, Home, and End navigation with linked visible panels", async () => {
    const user = userEvent.setup();
    render(<WorkspaceTabs label="Project sections" sections={sections} />);
    screen.getByRole("tab", { name: "Work" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "AI context" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("AI context");
    expect(screen.getByText("Project work")).not.toBeVisible();
    await user.keyboard("{Home}{ArrowRight}");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Notes");
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "AI context" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("preserves an unsaved form when switching between sections", async () => {
    const user = userEvent.setup();
    render(<WorkspaceTabs label="Project sections" sections={sections} />);
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    await user.type(
      screen.getByRole("textbox", { name: "Draft note" }),
      "Keep this draft",
    );
    await user.click(screen.getByRole("tab", { name: "Work" }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByRole("textbox", { name: "Draft note" })).toHaveValue(
      "Keep this draft",
    );
  });
});
