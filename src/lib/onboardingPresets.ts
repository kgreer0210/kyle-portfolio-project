import type {
  OnboardingKnownInfo,
  OnboardingPlan,
  ProjectType,
  RequestedItemStatus,
} from "@/types/crm";

/**
 * Presets for the admin "Prepare onboarding" step. Each project type lists the
 * items worth asking about and a sensible default decision for each. The admin
 * adjusts per engagement; only items left as "ask" become client questions.
 */

export const projectTypes: ProjectType[] = [
  "new_website",
  "existing_website",
  "new_app",
  "existing_app",
];

export const projectTypeLabels: Record<ProjectType, string> = {
  new_website: "New website",
  existing_website: "Existing website",
  new_app: "New app",
  existing_app: "Existing app",
};

export const projectTypeDescriptions: Record<ProjectType, string> = {
  new_website:
    "Building a site from scratch. Asks about brand, photos, content, and a domain. Never assumes there is a current site.",
  existing_website:
    "Working on a site that already exists. Confirms the address and asks who can help with hosting or platform access.",
  new_app:
    "Building a new application. Asks only about brand and the systems the app needs to connect to.",
  existing_app:
    "Working on an app that already exists. Confirms which app and asks who can help with account access.",
};

export function isProjectType(value: unknown): value is ProjectType {
  return typeof value === "string" && (projectTypes as string[]).includes(value);
}

export const requestedItemStatuses: RequestedItemStatus[] = [
  "have",
  "ask",
  "not_needed",
];

export const requestedItemStatusLabels: Record<RequestedItemStatus, string> = {
  have: "Already have it",
  ask: "Ask client",
  not_needed: "Not needed",
};

export function isRequestedItemStatus(
  value: unknown,
): value is RequestedItemStatus {
  return (
    typeof value === "string" &&
    (requestedItemStatuses as string[]).includes(value)
  );
}

export type RequestedItemKind =
  | "material"
  | "domain"
  | "existing_site"
  | "existing_app"
  | "access";

export interface RequestedItemDefinition {
  key: string;
  /** Admin-facing label. */
  label: string;
  /** Admin-facing hint about when to ask. */
  description: string;
  kind: RequestedItemKind;
  /** Client-facing question for material items. */
  clientQuestion?: string;
  clientHelp?: string;
  /** Label for the "share what's ready" note. */
  noteLabel?: string;
  notePlaceholder?: string;
  /** Placeholder for the admin note field. */
  adminNotePlaceholder?: string;
}

export const requestedItemDefinitions: Record<string, RequestedItemDefinition> =
  {
    logo_brand: {
      key: "logo_brand",
      label: "Logo and brand materials",
      description: "Logo files, colors, fonts, or a brand guide.",
      kind: "material",
      clientQuestion: "Do you have a logo or brand files we can use?",
      clientHelp:
        "Logo files, brand colors, fonts, or a brand guide. If you only have a logo on a business card or an old site, that still counts — tell us where it is.",
      noteLabel: "Where can we find them?",
      notePlaceholder: "Paste a link (Drive, Dropbox) or tell us where they live",
      adminNotePlaceholder: "e.g. Logo already in shared Drive folder",
    },
    photos: {
      key: "photos",
      label: "Photos",
      description: "Photos of the team, work, products, or location.",
      kind: "material",
      clientQuestion: "Do you have photos you'd like us to use?",
      clientHelp:
        "Photos of your team, your work, your products, or your location. Phone photos are fine to start with.",
      noteLabel: "Where can we find them?",
      notePlaceholder: "Paste a link or tell us where they live",
      adminNotePlaceholder: "e.g. Using stock photos for launch",
    },
    written_content: {
      key: "written_content",
      label: "Written content",
      description: "Text for pages, service descriptions, bios, FAQs.",
      kind: "material",
      clientQuestion: "Do you have written content ready?",
      clientHelp:
        "Text for pages, service descriptions, a short bio, or answers to common questions. Rough notes are fine — we can shape them together.",
      noteLabel: "Where can we find it?",
      notePlaceholder: "Paste a link or tell us where it lives",
      adminNotePlaceholder: "e.g. Copywriting is included in scope",
    },
    domain: {
      key: "domain",
      label: "Domain name",
      description: "Whether the client already owns a domain to use.",
      kind: "domain",
      adminNotePlaceholder: "e.g. example.com already registered at GoDaddy",
    },
    existing_site: {
      key: "existing_site",
      label: "Existing website details",
      description: "The address of the current site and where it is hosted.",
      kind: "existing_site",
      adminNotePlaceholder: "e.g. Squarespace, renews in March",
    },
    existing_app: {
      key: "existing_app",
      label: "Existing app details",
      description: "Which app we are working on and where it runs.",
      kind: "existing_app",
      adminNotePlaceholder: "e.g. Internal scheduling tool on Heroku",
    },
    hosting_access: {
      key: "hosting_access",
      label: "Hosting or domain account access",
      description: "Registrar, hosting, or website platform accounts.",
      kind: "access",
      adminNotePlaceholder: "e.g. GoDaddy and Squarespace",
    },
    account_access: {
      key: "account_access",
      label: "Other accounts or systems",
      description:
        "Anything else we need access to: email provider, analytics, payment processor, app stores, internal tools.",
      kind: "access",
      adminNotePlaceholder: "e.g. Google Business Profile, Stripe",
    },
    connected_systems: {
      key: "connected_systems",
      label: "Systems the app connects to",
      description:
        "Details for the tools or services the app must talk to (identified during scoping).",
      kind: "material",
      clientQuestion: "Do you have details for the systems this app needs to connect to?",
      clientHelp:
        "For example, the scheduling tool, payment processor, or spreadsheet the app will read from or write to. If you're not sure what we need, choose \"I need help\" and we'll walk through it.",
      noteLabel: "Anything you can share now",
      notePlaceholder: "Names of the tools, links, or who manages them",
      adminNotePlaceholder: "e.g. QuickBooks and Calendly",
    },
  };

export interface PresetItem {
  key: string;
  status: RequestedItemStatus;
}

/** Items shown in the admin checklist per project type, in display order, with defaults. */
export const projectPresets: Record<ProjectType, PresetItem[]> = {
  new_website: [
    { key: "logo_brand", status: "ask" },
    { key: "photos", status: "ask" },
    { key: "written_content", status: "ask" },
    { key: "domain", status: "ask" },
    { key: "hosting_access", status: "not_needed" },
    { key: "account_access", status: "not_needed" },
  ],
  existing_website: [
    { key: "existing_site", status: "ask" },
    { key: "hosting_access", status: "ask" },
    { key: "logo_brand", status: "ask" },
    { key: "photos", status: "not_needed" },
    { key: "written_content", status: "not_needed" },
    { key: "domain", status: "not_needed" },
    { key: "account_access", status: "not_needed" },
  ],
  new_app: [
    { key: "logo_brand", status: "ask" },
    { key: "connected_systems", status: "ask" },
    { key: "account_access", status: "ask" },
    { key: "written_content", status: "not_needed" },
    { key: "photos", status: "not_needed" },
    { key: "domain", status: "not_needed" },
  ],
  existing_app: [
    { key: "existing_app", status: "ask" },
    { key: "account_access", status: "ask" },
    { key: "hosting_access", status: "not_needed" },
    { key: "connected_systems", status: "not_needed" },
    { key: "logo_brand", status: "not_needed" },
  ],
};

export function getPresetItems(projectType: ProjectType): PresetItem[] {
  return projectPresets[projectType] ?? [];
}

export function createDefaultPlan(
  projectType: ProjectType,
  knownInfo: OnboardingKnownInfo = {},
): OnboardingPlan {
  const requestedItems: OnboardingPlan["requestedItems"] = {};
  for (const item of getPresetItems(projectType)) {
    requestedItems[item.key] = { status: item.status };
  }

  return {
    deliverables: [],
    requestedItems,
    customItems: [],
    knownInfo: { ...knownInfo },
  };
}

/**
 * Re-applies preset defaults for a new project type while keeping decisions the
 * admin already made for items that exist in both presets.
 */
export function applyPresetToPlan(
  plan: OnboardingPlan,
  projectType: ProjectType,
): OnboardingPlan {
  const requestedItems: OnboardingPlan["requestedItems"] = {};
  for (const item of getPresetItems(projectType)) {
    requestedItems[item.key] = plan.requestedItems[item.key] ?? {
      status: item.status,
    };
  }
  return { ...plan, requestedItems };
}
