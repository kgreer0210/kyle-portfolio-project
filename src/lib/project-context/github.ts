import "server-only";
import { createHmac, sign, timingSafeEqual } from "node:crypto";
import { z } from "zod";
export function githubConfigured() {
  return Boolean(
    process.env.GITHUB_CONTEXT_APP_ID && process.env.GITHUB_CONTEXT_PRIVATE_KEY,
  );
}
function jwt() {
  const key = process.env.GITHUB_CONTEXT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const id = process.env.GITHUB_CONTEXT_APP_ID;
  if (!key || !id)
    throw new Error("GitHub App credentials are not configured.");
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iat: now - 60, exp: now + 540, iss: id }),
  ).toString("base64url");
  const body = `${header}.${payload}`;
  return `${body}.${sign("RSA-SHA256", Buffer.from(body), key).toString("base64url")}`;
}
export async function githubRequest(
  path: string,
  token: string,
  method = "GET",
  body?: unknown,
): Promise<unknown> {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      `GitHub returned ${response.status}. Check the installation and repository access.`,
    );
  if (!response.body) throw new Error("GitHub returned an empty response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 3000000) {
        await reader.cancel();
        throw new Error("Repository index exceeded the scan size limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function installationToken(installationId: number) {
  const data = z
    .object({ token: z.string() })
    .parse(
      await githubRequest(
        `/app/installations/${installationId}/access_tokens`,
        jwt(),
        "POST",
        { permissions: { contents: "read" } },
      ),
    );
  return data.token;
}
export async function verifyRepository(installationId: number, repo: string) {
  const token = await installationToken(installationId);
  const data = z
    .object({ id: z.number(), full_name: z.string() })
    .parse(await githubRequest(`/repos/${repo}`, token));
  return data;
}
export function validWebhook(
  raw: string,
  signature: string | null,
  secret: string | undefined,
) {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature))
    return false;
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
