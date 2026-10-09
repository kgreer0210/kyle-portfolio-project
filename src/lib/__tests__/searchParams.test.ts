import { describe, expect, it } from "vitest";
import { firstParam } from "@/lib/searchParams";

describe("firstParam", () => {
  it("returns a single string value unchanged", () => {
    expect(firstParam("acme")).toBe("acme");
  });

  it("returns the first value of a repeated key", () => {
    expect(firstParam(["acme", "globex"])).toBe("acme");
  });

  it("returns an empty string when the key is missing or the array is empty", () => {
    expect(firstParam(undefined)).toBe("");
    expect(firstParam([])).toBe("");
  });
});
