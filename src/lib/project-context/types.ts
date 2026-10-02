export interface ContextSource {
  id: string;
  project_id: string;
  organization_id: string;
  kind: "website" | "github" | "manual";
  label: string;
  locator: string;
  config: {
    content?: string;
    audience?: "admin" | "client";
    installation_id?: number;
    branch?: string;
  };
  enabled: boolean;
  active_run_id: string | null;
  revision: number;
  last_success_at: string | null;
  last_error: string | null;
}
export interface ContextRun {
  id: string;
  source_id: string;
  project_id: string;
  organization_id: string;
  status: string;
  attempt: number;
  claim_token: string;
  cursor: {
    pending?: string[];
    visited?: string[];
    skipped?: number;
    files?: Array<{ path: string; sha: string }>;
    index?: number;
    version?: string;
  };
  source_version: string | null;
  coverage: string | null;
}
export interface ContextEntryInput {
  key: string;
  title: string;
  content: string;
  locator: string;
  audience?: "admin" | "client";
}
export interface ContextEntry extends ContextEntryInput {
  id: string;
  source_id: string;
  run_id: string;
  observed_at: string;
}
export interface ContextEvidence {
  id: string;
  title: string;
  locator: string;
  observedAt: string;
  version: string | null;
  coverage: string | null;
  stale: boolean;
}
export interface RetrievedContext {
  text: string;
  evidence: ContextEvidence[];
  notice: string;
}
