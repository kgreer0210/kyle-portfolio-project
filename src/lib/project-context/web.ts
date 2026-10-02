import "server-only";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import ipaddr from "ipaddr.js";
import { load } from "cheerio";
import type { ContextEntryInput } from "./types";
export function isPublicAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) return false;
  const ip = ipaddr.process(address);
  return ip.range() === "unicast";
}
export function validatePublicUrl(value: string): URL {
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    (u.port && u.port !== "443")
  )
    throw new Error("Use a public HTTPS URL without credentials.");
  const hostname = u.hostname.replace(/^\[|\]$/g, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    (ipaddr.isValid(hostname) && !isPublicAddress(hostname))
  )
    throw new Error("Private network addresses are not allowed.");
  u.hash = "";
  return u;
}
export async function fetchPublicHtml(
  value: string,
  origin: string,
  redirects = 0,
  deadline = Date.now() + 8000,
): Promise<{ html: string; url: string }> {
  if (redirects > 3) throw new Error("Too many redirects.");
  const u = validatePublicUrl(value);
  if (
    u.hostname.replace(/^www\./, "") !==
    new URL(origin).hostname.replace(/^www\./, "")
  )
    throw new Error("The page redirected outside the configured website.");
  if (Date.now() >= deadline) throw new Error("Website request timed out.");
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(u.hostname, { all: true }),
    new Promise<never>((_resolve, reject) => {
      dnsTimer = setTimeout(
        () => reject(new Error("Website request timed out.")),
        deadline - Date.now(),
      );
    }),
  ]).finally(() => {
    if (dnsTimer) clearTimeout(dnsTimer);
  });
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new Error("Private network addresses are not allowed.");
  const pinned = addresses[0];
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => {
        req.destroy(new Error("Website request timed out."));
      },
      Math.max(1, deadline - Date.now()),
    );
    const req = request(
      u,
      {
        headers: {
          "User-Agent": "KYGR-Project-Context/1.0",
          Accept: "text/html",
        },
        family: pinned.family,
        lookup: (_host, _options, callback) =>
          callback(null, pinned.address, pinned.family),
      },
      (res) => {
        const status = res.statusCode ?? 500;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          clearTimeout(timer);
          resolve(
            fetchPublicHtml(
              new URL(res.headers.location, u).href,
              origin,
              redirects + 1,
              deadline,
            ),
          );
          return;
        }
        if (
          status !== 200 ||
          !res.headers["content-type"]?.includes("text/html")
        ) {
          res.resume();
          clearTimeout(timer);
          reject(new Error("Page was unavailable or did not return HTML."));
          return;
        }
        const chunks: Buffer[] = [];
        let bytes = 0;
        res.on("data", (c: Buffer) => {
          bytes += c.length;
          if (bytes > 600000) {
            req.destroy(new Error("Page exceeded the scan size limit."));
            return;
          }
          chunks.push(c);
        });
        res.on("end", () => {
          clearTimeout(timer);
          resolve({
            html: Buffer.concat(chunks).toString("utf8"),
            url: u.href,
          });
        });
        res.on("error", reject);
      },
    );
    req.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    req.end();
  });
}
export function extractPage(
  html: string,
  url: string,
): { entry: ContextEntryInput; links: string[] } {
  const $ = load(html);
  const title = $("title").text().trim() || new URL(url).pathname;
  $("script,style,noscript,svg,iframe").remove();
  const links: string[] = [];
  const controls: string[] = [];
  $("a[href]").each((_i, e) => {
    const label = $(e).text().replace(/\s+/g, " ").trim();
    try {
      const target = new URL($(e).attr("href")!, url);
      target.hash = "";
      if (
        target.origin === new URL(url).origin &&
        !target.search &&
        !/\.(pdf|png|jpg|zip|xml)$/i.test(target.pathname)
      )
        links.push(target.href);
      if (label)
        controls.push(
          `Link: ${label} → ${target.origin === new URL(url).origin ? target.pathname : target.origin + target.pathname}`,
        );
    } catch {
      /* non-web link */
    }
  });
  $("button").each((_i, e) => {
    controls.push(
      `Button: ${$(e).text().replace(/\s+/g, " ").trim() || $(e).attr("aria-label") || "(unlabeled)"}`,
    );
  });
  $("form").each((_i, e) => {
    controls.push(
      `Form: ${$(e).attr("action") || "(no HTML action)"}; fields: ${$(e)
        .find("input,select,textarea")
        .map(
          (_j, f) =>
            $(f).attr("name") || $(f).attr("aria-label") || $(f).attr("type"),
        )
        .get()
        .join(", ")}`,
    );
  });
  const content = [
    $("main").length ? $("main").text() : $("body").text(),
    ...controls.slice(0, 80),
  ]
    .map((s) => s.replace(/\s+/g, " ").trim())
    .join("\n")
    .slice(0, 16000);
  return {
    entry: { key: url, title: title.slice(0, 300), content, locator: url },
    links: [...new Set(links)].slice(0, 30),
  };
}
