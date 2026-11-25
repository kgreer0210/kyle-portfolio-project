import { expect, test, type Page } from "@playwright/test";

// The floating chat and Back to top buttons sit in the bottom-right corner.
// Below md the page reserves bottom padding so they never cover the footer.
// From md (768px) up the footer's centred text is clear of them, so there must
// be no empty space below the footer.

const PATHS = ["/", "/contact"];
const HEIGHT = 900;

type Box = { left: number; right: number; top: number; bottom: number };

async function scrollToBottom(page: Page) {
  // Back to top appears on a scroll event, which the page only hears once it
  // has hydrated, so keep scrolling until both floating buttons are showing.
  await expect(async () => {
    await page.evaluate(() => {
      // The site uses smooth scrolling; measure at the real end of the page.
      window.scrollTo({ top: 0, behavior: "instant" });
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    });
    await expect(page.getByRole("button", { name: "Back to top" })).toBeVisible({ timeout: 1_000 });
    await expect(page.getByRole("button", { name: /Chat with my AI/ })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
  // Let entrance animations settle before measuring.
  await page.waitForTimeout(800);
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
  );
}

/** Empty space between the footer's bottom edge and the end of the page. */
function gapBelowFooter(page: Page) {
  return page.evaluate(() => {
    const footer = document.querySelector("footer");
    if (!footer) throw new Error("no footer");
    const bottom = footer.getBoundingClientRect().bottom + window.scrollY;
    return Math.round(document.documentElement.scrollHeight - bottom);
  });
}

/** The footer's visible text runs and controls, in viewport coordinates. */
function footerInk(page: Page): Promise<Box[]> {
  return page.evaluate(() => {
    const footer = document.querySelector("footer");
    if (!footer) throw new Error("no footer");
    const boxes: { left: number; right: number; top: number; bottom: number }[] = [];
    const walker = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of Array.from(range.getClientRects())) {
        if (r.width > 0) boxes.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      }
    }
    for (const el of Array.from(footer.querySelectorAll("a, button, svg"))) {
      const r = el.getBoundingClientRect();
      if (r.width > 0) boxes.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    }
    return boxes;
  });
}

async function floatingButtons(page: Page): Promise<Box[]> {
  const boxes: Box[] = [];
  for (const name of ["Back to top", /Chat with my AI/] as const) {
    const box = await page.getByRole("button", { name }).boundingBox();
    if (!box) throw new Error(`no box for ${String(name)}`);
    boxes.push({ left: box.x, right: box.x + box.width, top: box.y, bottom: box.y + box.height });
  }
  return boxes;
}

/**
 * Open `path` with the page's layout width exactly `width`. Playwright's Linux
 * WebKit draws a classic scrollbar (about 8px) that narrows the layout, while
 * Safari on macOS and iOS uses overlay scrollbars by default, so widen the
 * window by the scrollbar width to test the breakpoint visitors actually get.
 */
async function openAtLayoutWidth(page: Page, path: string, width: number) {
  await page.setViewportSize({ width, height: HEIGHT });
  await page.goto(path);
  const scrollbar = await page.evaluate(
    () => window.innerWidth - document.documentElement.clientWidth,
  );
  if (scrollbar > 0) {
    await page.setViewportSize({ width: width + scrollbar, height: HEIGHT });
    await page.reload();
  }
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(width);
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

for (const width of [768, 1280, 1440]) {
  for (const path of PATHS) {
    test(`no gap below the footer at ${width}px on ${path}`, async ({ page }) => {
      await openAtLayoutWidth(page, path, width);
      await scrollToBottom(page);
      // Only the safe-area inset remains, which is 0 outside a notched iPhone.
      expect(await gapBelowFooter(page)).toBeLessThanOrEqual(1);
    });
  }
}

for (const width of [390, 768]) {
  for (const path of PATHS) {
    test(`floating buttons never cover the footer at ${width}px on ${path}`, async ({ page }) => {
      await openAtLayoutWidth(page, path, width);
      await scrollToBottom(page);
      const ink = await footerInk(page);
      expect(ink.length).toBeGreaterThan(0);
      for (const button of await floatingButtons(page)) {
        for (const box of ink) expect(overlaps(button, box), JSON.stringify({ button, box })).toBe(false);
      }
    });
  }
}
