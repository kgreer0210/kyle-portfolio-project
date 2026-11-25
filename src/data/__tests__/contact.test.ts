import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUSINESS_EMAIL,
  CONSULT_CALL_URL,
  EMAIL_HREF,
  GOOGLE_REVIEWS_URL,
  PHONE_DISPLAY,
  PHONE_E164,
  PHONE_HREF,
  PHONE_SCHEMA,
} from "../contact";

const SRC = join(__dirname, "..", "..");
const CONSTANTS_FILE = join("data", "contact.ts");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === "__tests__" ? [] : sourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("contact constants", () => {
  it("hold the published contact details", () => {
    expect(CONSULT_CALL_URL).toBe(
      "https://calendly.com/kylegreer-kygrsolutions/30min",
    );
    expect(PHONE_DISPLAY).toBe("(478) 777-1266");
    expect(PHONE_E164).toBe("+14787771266");
    expect(PHONE_HREF).toBe("tel:+14787771266");
    expect(PHONE_SCHEMA).toBe("+1-478-777-1266");
    expect(BUSINESS_EMAIL).toBe("info@kygrsolutions.com");
    expect(EMAIL_HREF).toBe("mailto:info@kygrsolutions.com");
    expect(GOOGLE_REVIEWS_URL).toBe(
      "https://search.google.com/local/reviews?placeid=ChIJ_7MnBwA7RQoRIdHZRWH_hw8",
    );
  });

  it.each([
    ["the Calendly link", /calendly\.com\/kylegreer/],
    ["the phone number", /4787771266|777-1266|478-777-1266/],
    ["the business email", /info@kygrsolutions\.com/],
    ["the Google reviews link", /search\.google\.com\/local\/reviews/],
  ])("define %s only in the constants module", (_label, pattern) => {
    const offenders = sourceFiles(SRC)
      .filter((file) => relative(SRC, file) !== CONSTANTS_FILE)
      .filter((file) => pattern.test(readFileSync(file, "utf8")))
      .map((file) => relative(SRC, file));

    expect(offenders).toEqual([]);
  });
});
