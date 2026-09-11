import type {
  BillingType,
  OnboardingStepField,
  OnboardingStatus,
  ProfileRole,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types/crm";

export const ticketAttachmentBucket = "ticket-attachments";
export const maxTicketAttachmentBytes = 10 * 1024 * 1024;
export const maxTicketAttachmentsPerSubmission = 5;

export { legacyOnboardingSteps as onboardingSteps } from "./onboardingLegacySteps";

export const ticketStatusLabels: Record<TicketStatus, string> = {
  new: "New",
  open: "Open",
  waiting_on_client: "Waiting on client",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const ticketPriorities: TicketPriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];

export const ticketPriorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const ticketCategories: TicketCategory[] = [
  "website",
  "automation",
  "ai_voice",
  "hosting",
  "billing",
  "other",
];

export const ticketCategoryLabels: Record<TicketCategory, string> = {
  website: "Website",
  automation: "Automation",
  ai_voice: "AI voice",
  hosting: "Hosting",
  billing: "Billing",
  other: "Other",
};

export const billingTypes: BillingType[] = [
  "trade",
  "monthly_plan",
  "per_project",
];

export const billingTypeLabels: Record<BillingType, string> = {
  trade: "Trade agreement",
  monthly_plan: "Monthly plan",
  per_project: "Per project",
};

export function isBillingType(value: string): value is BillingType {
  return (billingTypes as string[]).includes(value);
}

export function formatCurrency(amount?: number | null): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function isTicketPriority(value: string): value is TicketPriority {
  return (ticketPriorities as string[]).includes(value);
}

export function isTicketCategory(value: string): value is TicketCategory {
  return (ticketCategories as string[]).includes(value);
}

export const ticketStatusTransitions: Record<TicketStatus, TicketStatus[]> = {
  new: ["open", "in_progress", "waiting_on_client", "resolved", "closed"],
  open: ["in_progress", "waiting_on_client", "resolved", "closed"],
  waiting_on_client: ["open", "in_progress", "resolved", "closed"],
  in_progress: ["open", "waiting_on_client", "resolved", "closed"],
  resolved: ["closed", "open"],
  closed: ["open"],
};

export const activeTicketStatuses: TicketStatus[] = [
  "new",
  "open",
  "waiting_on_client",
  "in_progress",
];

export const onboardingStatusLabels: Record<OnboardingStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  completed: "Completed",
  reopened: "Needs updates",
  skipped_legacy: "Skipped",
};

export function formatFieldValue(
  field: Pick<OnboardingStepField, "type" | "choices">,
  rawValue: string,
): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return "";

  if (field.type === "choice") {
    return (
      field.choices?.find((choice) => choice.value === trimmed)?.label ?? trimmed
    );
  }

  if (field.type === "person_list") {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        const lines = parsed
          .map((entry) => {
            if (entry && typeof entry === "object") {
              const obj = entry as Record<string, unknown>;
              const name = typeof obj.name === "string" ? obj.name.trim() : "";
              const role = typeof obj.role === "string" ? obj.role.trim() : "";
              if (!name && !role) return "";
              if (name && role) return `${name} — ${role}`;
              return name || role;
            }
            return "";
          })
          .filter(Boolean);
        return lines.join("\n");
      }
    } catch {
      // Legacy textarea content — return as-is.
    }
  }

  return trimmed;
}

export function validateAttachmentSelection(files: File[]): string | null {
  if (files.length > maxTicketAttachmentsPerSubmission) {
    return `You can attach up to ${maxTicketAttachmentsPerSubmission} files.`;
  }

  const tooLarge = files.find((file) => file.size > maxTicketAttachmentBytes);

  if (tooLarge) {
    return `${tooLarge.name} exceeds the ${formatFileSize(
      maxTicketAttachmentBytes,
    )} per-file limit.`;
  }

  return null;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.kygrsolutions.com";
}

export function getAdminNotificationEmails(): string[] {
  const emails = new Set<string>();
  const contactEmail = process.env.CONTACT_EMAIL;
  const configuredAdmins = process.env.CRM_ADMIN_EMAILS;

  if (contactEmail) {
    emails.add(normalizeEmail(contactEmail));
  }

  if (configuredAdmins) {
    configuredAdmins
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean)
      .forEach((entry) => emails.add(entry));
  }

  return [...emails];
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return getAdminNotificationEmails().includes(normalizeEmail(email));
}

export function getDefaultRouteForRole(role: ProfileRole): string {
  return role === "admin" ? "/admin" : "/portal";
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
