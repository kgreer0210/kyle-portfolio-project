import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

type Config = { redirects?: () => Promise<unknown[]> };

describe("next.config redirects", () => {
  it("permanently redirects the removed blog section to the homepage", async () => {
    const redirects = await (nextConfig as Config).redirects?.();
    expect(redirects).toEqual(
      expect.arrayContaining([
        {
          source: "/blog/life-is-full-and-i-wouldnt-trade-it",
          destination: "/",
          permanent: true,
        },
        { source: "/blog", destination: "/", permanent: true },
        { source: "/blog/:path*", destination: "/", permanent: true },
      ]),
    );
    for (const r of redirects ?? []) {
      expect((r as { permanent: boolean }).permanent).toBe(true);
    }
  });
});
