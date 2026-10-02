import { z } from "zod";
export const sourceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("website"),
    label: z.string().trim().min(1).max(160),
    locator: z.url().refine((v) => {
      const u = new URL(v);
      return (
        u.protocol === "https:" &&
        !u.username &&
        !u.password &&
        (!u.port || u.port === "443")
      );
    }, "Use a public HTTPS URL without credentials."),
    config: z.object({}).default({}),
  }),
  z.object({
    kind: z.literal("manual"),
    label: z.string().trim().min(1).max(160),
    locator: z.string().max(500).default(""),
    config: z.object({
      content: z.string().trim().min(1).max(16000),
      audience: z.enum(["admin", "client"]).default("admin"),
    }),
  }),
  z.object({
    kind: z.literal("github"),
    label: z.string().trim().min(1).max(160),
    locator: z
      .string()
      .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Use owner/repository."),
    config: z.object({
      installation_id: z.number().int().positive(),
      branch: z.string().trim().min(1).max(160).default("main"),
    }),
  }),
]);
export function contextEnabled() {
  return process.env.PROJECT_CONTEXT_ENABLED === "true";
}
export function allowCodePath(path: string) {
  return (
    !/(^|\/)(node_modules|vendor|dist|build|\.git|coverage|\.next|secrets?)(\/|$)/i.test(
      path,
    ) &&
    !/(^|\/)(\.env[^/]*|[^/]*(secret|credential|private.?key)[^/]*|[^/]*lock[^/]*)$/i.test(
      path,
    ) &&
    /\.(tsx?|jsx?|md|css|html|sql|py|rb|go|php|vue|svelte)$/i.test(path)
  );
}
