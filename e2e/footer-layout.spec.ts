import { expect, test, type Page } from "@playwright/test";

// The floating chat and Back to top buttons sit in the bottom-right corner.
// Below md the page reserves bottom padding so they never cover the footer.
// From md (768px) up the footer's centred text is clear of them, so there must
// be no empty space below the footer.

const PATHS = ["/", "/contact"];
const HEIGHT = 900;

type Box = { left: number; right: number; top: number; bottom: number };

const BACK_TO_TOP = { name: "Back to top" } as const;
const CHAT = { name: /Chat with my AI/ } as const;

/** Resolve after the browser has painted `frames` more frames. */
function nextFrames(page: Page, frames = 2) {
  return page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        const step = (left: number) =>
          left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
        step(n);
      }),
    frames,
  );
}

/**
 * Wait until the page is loaded and hydrated: web fonts are in (they change
 * the footer's text width) and the chat control, which is client-rendered,
 * is showing.
 */
async function waitForReady(page: Page) {
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect(page.getByRole("button", CHAT)).toBeVisible({ timeout: 15_000 });
}

/**
 * Scroll to the end of the page and wait for Back to top. That button mounts
 * when Motion's scrollY passes 80% of the viewport height, so each attempt
 * makes exactly one scroll per browser task, separated by painted frames, so
 * the scroll can't be merged away. The test fails (it never silently passes)
 * if the button doesn't appear.
 */
async function scrollToBottom(page: Page) {
  await waitForReady(page);
  await expect(async () => {
    // Step back up a little, in its own task, so the scroll to the bottom is
    // always a real change that Motion's observer sees.
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: "instant" }),
    );
    await nextFrames(page);
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
    );
    await nextFrames(page);
    expect(
      await page.evaluate(() => window.scrollY > window.innerHeight * 0.8),
      "scrolled past the Back to top threshold",
    ).toBe(true);
    await expect(page.getByRole("button", BACK_TO_TOP)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await waitForSettled(page);
}

/**
 * Wait until nothing being measured is still moving: the page has stopped
 * growing (late images), the page is at its very bottom, the footer's reveal
 * has finished, and both floating buttons have finished their entrance.
 */
async function waitForSettled(page: Page) {
  let previous = "";
  await expect(async () => {
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
    );
    await nextFrames(page);
    const snapshot = await page.evaluate(() => {
      const footer = document.querySelector("footer");
      if (!footer) throw new Error("no footer");
      const style = getComputedStyle(footer);
      const box = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10);
      };
      const buttons = Array.from(document.querySelectorAll("button")).filter((b) =>
        /Back to top|Chat with my AI/.test(b.getAttribute("aria-label") ?? b.textContent ?? ""),
      );
      const de = document.documentElement;
      return JSON.stringify({
        atBottom: Math.abs(window.scrollY + window.innerHeight - de.scrollHeight) <= 1,
        footerOpacity: style.opacity,
        footerTransform: style.transform,
        footer: box(footer),
        buttons: buttons.map(box),
        height: de.scrollHeight,
      });
    });
    const parsed = JSON.parse(snapshot);
    expect(parsed.atBottom, "at the bottom of the page").toBe(true);
    expect(parsed.footerOpacity, "footer reveal finished").toBe("1");
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"], "footer reveal finished").toContain(
      parsed.footerTransform,
    );
    // Two identical reads in a row: nothing is still animating.
    const stable = snapshot === previous;
    previous = snapshot;
    expect(stable, "layout stable across two reads").toBe(true);
  }).toPass({ timeout: 15_000, intervals: [250] });
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
  for (const role of [BACK_TO_TOP, CHAT]) {
    const box = await page.getByRole("button", role).boundingBox();
    if (!box) throw new Error(`no box for ${String(role.name)}`);
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
