export type ProfileRole = "admin" | "client";
export type ProfileStatus = "invited" | "active" | "disabled";
export type ClientKind = "new" | "legacy";
export type OrganizationMemberRole = "owner" | "member";
export type OnboardingMode = "standard" | "skipped_legacy";
export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "completed"
  | "reopened"
  | "skipped_legacy";
export type TicketType = "request" | "issue";
export type TicketStatus =
  | "new"
  | "open"
  | "waiting_on_client"
  | "in_progress"
  | "resolved"
  | "closed";
export type TicketMessageVisibility = "public" | "internal";

export interface CrmProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: ProfileRole;
  status: ProfileStatus;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  client_kind: ClientKind;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationMembership {
  organization_id: string;
  role: OrganizationMemberRole;
  organizations?: OrganizationSummary | null;
}

export interface OnboardingStepField {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "radio" | "checkboxes";
  placeholder?: string;
  options?: string[];
}

export interface OnboardingStepDefinition {
  key: string;
  title: string;
  description: string;
  fields: OnboardingStepField[];
}
