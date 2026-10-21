import { IDX_SUBJECT } from "@/data/idx";

export const GENERAL_INQUIRY_SUBJECT = "General Inquiry";

export function resolveContactSubject(
  value: string | undefined,
  serviceTitles: readonly string[],
): string {
  const subject = value?.trim() ?? "";
  if (!subject) return "";

  const allowed = new Set<string>([
    ...serviceTitles,
    IDX_SUBJECT,
    GENERAL_INQUIRY_SUBJECT,
  ]);

  return allowed.has(subject) ? subject : "";
}
