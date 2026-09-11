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
  website_url?: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationMembership {
  organization_id: string;
  role: OrganizationMemberRole;
  organizations?: OrganizationSummary | null;
}

// ---------------------------------------------------------------------------
// Onboarding flow definitions
// ---------------------------------------------------------------------------

export type OnboardingFlowVersion = "v1" | "v2";

export type ProjectType =
  | "new_website"
  | "existing_website"
  | "new_app"
  | "existing_app";

/** Admin decision per requested item when preparing onboarding. */
export type RequestedItemStatus = "have" | "ask" | "not_needed";

export interface RequestedItemSelection {
  status: RequestedItemStatus;
  /** Known value or brief context (e.g. "logo is in Drive", "Squarespace"). */
  note?: string;
}

export interface CustomRequestedItem {
  key: string;
  label: string;
  /** Client-facing question text. */
  question: string;
}

export interface OnboardingKnownInfo {
  existingUrl?: string;
  domainName?: string;
  /** Agreed support coverage to display (never asked). */
  supportCoverage?: string;
  contactPhone?: string;
  contactTitle?: string;
}

export interface OnboardingPlan {
  deliverables: string[];
  requestedItems: Record<string, RequestedItemSelection>;
  customItems: CustomRequestedItem[];
  knownInfo: OnboardingKnownInfo;
}

export type OnboardingSummaryBucket = "provided" | "later" | "help" | "discuss";

export interface OnboardingChoice {
  value: string;
  label: string;
  /** Optional one-line hint rendered under the label. */
  hint?: string;
  /** Which follow-up bucket an answer with this value lands in (default: provided). */
  outcome?: OnboardingSummaryBucket;
}

export interface OnboardingFieldCondition {
  field: string;
  in: string[];
}

export interface OnboardingStepField {
  key: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "url"
    | "email"
    | "radio"
    | "checkboxes"
    | "person_list"
    | "choice"
    | "static";
  placeholder?: string;
  /** Legacy radio/checkbox option labels (value === label). */
  options?: string[];
  /** Structured choices for `choice` fields. */
  choices?: OnboardingChoice[];
  helpText?: string;
  required?: boolean;
  /** Only render (and validate) when the referenced field has one of the given values. */
  showWhen?: OnboardingFieldCondition;
  /** Legacy radios: the last option is a "Custom"/"Other" sentinel that reveals a free-text input. */
  allowCustom?: boolean;
  /** Show the AI Refine menu on textareas. */
  aiAssist?: boolean;
  /** Read-only content for `static` fields. Never persisted. */
  content?: string;
  /** Fields sharing a group are summarised together: the choice field decides the bucket, text fields add detail. */
  group?: string;
  /** Bucket for a non-choice field when answered (default: provided). */
  outcome?: OnboardingSummaryBucket;
  /** Known value shown as the initial answer until the client saves something else. */
  prefill?: string;
}

export interface OnboardingStepDefinition {
  key: string;
  title: string;
  description: string;
  fields: OnboardingStepField[];
}

export type OnboardingStepStatus = "not_started" | "in_progress" | "complete";

export type OnboardingAnswers = Record<string, Record<string, string>>;

export interface OnboardingRecord {
  status: OnboardingStatus;
  mode: OnboardingMode;
  flow_version?: OnboardingFlowVersion | null;
  project_type?: ProjectType | null;
  project_summary?: string | null;
  plan?: OnboardingPlan | null;
  plan_updated_at?: string | null;
  plan_sent_at?: string | null;
  current_step?: string | null;
  completed_steps?: string[] | null;
  started_at?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
}
