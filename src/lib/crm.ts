import type {
  OnboardingStepDefinition,
  OnboardingStatus,
  ProfileRole,
  TicketStatus,
} from "@/types/crm";

export const ticketAttachmentBucket = "ticket-attachments";
export const maxTicketAttachmentBytes = 10 * 1024 * 1024;

export const onboardingSteps: OnboardingStepDefinition[] = [
  {
    key: "account-setup",
    title: "Account Setup",
    description: "Confirm your main contact information and preferred owner.",
    fields: [
      {
        key: "primary_contact_name",
        label: "Primary contact name",
        type: "text",
        placeholder: "Who should we treat as the day-to-day lead?",
      },
      {
        key: "primary_contact_title",
        label: "Primary contact title",
        type: "text",
        placeholder: "Owner, operations manager, marketing lead, etc.",
      },
      {
        key: "primary_contact_phone",
        label: "Primary contact phone",
        type: "text",
        placeholder: "Best number for urgent issues",
      },
    ],
  },
  {
    key: "company-profile",
    title: "Company Profile",
    description: "Capture the core business details we should reference.",
    fields: [
      {
        key: "company_name",
        label: "Company name",
        type: "text",
        placeholder: "Legal or operating company name",
      },
      {
        key: "company_website",
        label: "Company website",
        type: "url",
        placeholder: "https://example.com",
      },
      {
        key: "company_overview",
        label: "Company overview",
        type: "textarea",
        placeholder: "What does the business do and who does it serve?",
      },
    ],
  },
  {
    key: "business-context",
    title: "Business Context",
    description: "Document the current systems, processes, and pain points.",
    fields: [
      {
        key: "current_stack",
        label: "Current software and tools",
        type: "textarea",
        placeholder: "Website, CRM, payment tools, internal systems, integrations",
      },
      {
        key: "operational_pain_points",
        label: "Operational pain points",
        type: "textarea",
        placeholder: "What is slowing the team down today?",
      },
      {
        key: "support_hours",
        label: "Preferred support hours",
        type: "text",
        placeholder: "Example: Mon-Fri, 9am-5pm ET",
      },
    ],
  },
  {
    key: "goals-and-scope",
    title: "Goals and Scope",
    description: "Clarify the business goals and highest priority outcomes.",
    fields: [
      {
        key: "project_goals",
        label: "Goals for this engagement",
        type: "textarea",
        placeholder: "What does success look like over the next 3-6 months?",
      },
      {
        key: "launch_priorities",
        label: "Top launch priorities",
        type: "textarea",
        placeholder: "Most important deliverables, fixes, or improvements",
      },
      {
        key: "known_constraints",
        label: "Known constraints",
        type: "textarea",
        placeholder: "Budget, timing, approvals, compliance, or dependency constraints",
      },
    ],
  },
  {
    key: "systems-and-access",
    title: "Systems and Access",
    description: "Capture any systems, assets, and credentials we may need.",
    fields: [
      {
        key: "required_accounts",
        label: "Accounts and services involved",
        type: "textarea",
        placeholder: "Domains, hosting, analytics, APIs, repos, app stores, etc.",
      },
      {
        key: "credential_process",
        label: "How access should be shared",
        type: "textarea",
        placeholder: "Password manager, delegated access, temporary accounts, etc.",
      },
      {
        key: "asset_locations",
        label: "Where key assets live",
        type: "textarea",
        placeholder: "Brand files, documentation, recordings, source files, credentials",
      },
    ],
  },
  {
    key: "communication-preferences",
    title: "Communication Preferences",
    description: "Set expectations for updates, approvals, and escalation.",
    fields: [
      {
        key: "preferred_channel",
        label: "Preferred communication channel",
        type: "text",
        placeholder: "Email, portal tickets, phone, Slack, etc.",
      },
      {
        key: "decision_makers",
        label: "Decision makers and approvers",
        type: "textarea",
        placeholder: "Who should be looped in for reviews or approvals?",
      },
      {
        key: "escalation_notes",
        label: "Escalation notes",
        type: "textarea",
        placeholder: "How should urgent issues be escalated?",
      },
    ],
  },
  {
    key: "review-and-submit",
    title: "Review and Submit",
    description: "Summarize anything else we should know before kickoff.",
    fields: [
      {
        key: "final_notes",
        label: "Final notes",
        type: "textarea",
        placeholder: "Anything else you want us to know before we begin?",
      },
    ],
  },
];

export const ticketStatusLabels: Record<TicketStatus, string> = {
  new: "New",
  open: "Open",
  waiting_on_client: "Waiting on client",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const onboardingStatusLabels: Record<OnboardingStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  completed: "Completed",
  reopened: "Needs updates",
  skipped_legacy: "Skipped",
};

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
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
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
