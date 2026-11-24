import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// iOS Safari's `vh` is the tallest viewport (toolbars hidden), so a panel
// capped in vh runs under the address bar. Panels cap their height in `dvh`,
// keeping a `vh` value only as the fallback for browsers without dvh.
const PANELS = ["ChatWidget.tsx", "BackendShowcase.tsx"];
const DVH = "supports-[height:100dvh]:";

function classLists(file: string): string[][] {
  const source = readFileSync(join(__dirname, "..", file), "utf8");
  return [...source.matchAll(/className="([^"]*)"/g)].map((m) =>
    m[1].split(/\s+/),
  );
}

describe.each(PANELS)("%s viewport max-heights", (file) => {
  it("pairs every vh max-height with the same max-height in dvh", () => {
    const vhMaxHeights = classLists(file).flatMap((classes) =>
      classes
        .filter((c) => /^(\w+:)*max-h-\[.*\d+vh.*\]$/.test(c))
        .map((vh) => ({ classes, vh })),
    );

    for (const { classes, vh } of vhMaxHeights) {
      expect(classes, `${file}: ${vh} has no dvh value`).toContain(
        `${DVH}${vh.replace(/(\d+)vh/g, "$1dvh")}`,
      );
    }
  });

  it("does not cap any panel at 95vh", () => {
    for (const classes of classLists(file)) {
      expect(classes.join(" ")).not.toMatch(/\b95d?vh/);
    }
  });
});
