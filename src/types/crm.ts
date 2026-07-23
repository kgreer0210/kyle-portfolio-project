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
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketCategory =
  | "website"
  | "automation"
  | "ai_voice"
  | "hosting"
  | "billing"
  | "other";
export type TicketMessageVisibility = "public" | "internal";
export type BillingType = "trade" | "monthly_plan" | "per_project";

export interface TicketSummary {
  id: string;
  organization_id: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory | null;
  title: string;
  last_activity_at: string;
  created_at: string;
  ai_triaged_at?: string | null;
  cost_amount?: number | null;
  organizations?: { name: string } | null;
}

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
  billing_type?: BillingType | null;
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
  type:
    | "text"
    | "textarea"
    | "url"
    | "radio"
    | "checkboxes"
    | "person_list";
  placeholder?: string;
  options?: string[];
  helpText?: string;
}

export interface OnboardingStepDefinition {
  key: string;
  title: string;
  description: string;
  fields: OnboardingStepField[];
}
