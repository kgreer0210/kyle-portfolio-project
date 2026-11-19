// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import TestimonialAuthor from "../TestimonialAuthor";

afterEach(cleanup);

describe("TestimonialAuthor", () => {
  it("renders name, role, then company when a role is present", () => {
    const { container } = render(
      <TestimonialAuthor
        name="Dexter Gordy"
        role="Realtor"
        company="Dexter Gordy Realtor"
      />,
    );
    const lines = Array.from(container.querySelectorAll("p")).map(
      (p) => p.textContent,
    );
    expect(lines).toEqual(["Dexter Gordy", "Realtor", "Dexter Gordy Realtor"]);
  });

  it.each([undefined, "", "   "])(
    "skips the role line entirely for role %j",
    (role) => {
      const { container } = render(
        <TestimonialAuthor
          name="Nick Morgan"
          role={role}
          company="Mid-State Baptist Association"
        />,
      );
      const lines = Array.from(container.querySelectorAll("p")).map(
        (p) => p.textContent,
      );
      expect(lines).toEqual(["Nick Morgan", "Mid-State Baptist Association"]);
    },
  );
});
