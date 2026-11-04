/**
 * Type definitions matching backend schemas strictly.
 */

export type Role = 'Creator' | 'Reviewer' | 'Brand manager' | 'Admin';

export type Severity = 'Blocker' | 'Major' | 'Minor' | 'Info';

export type FindingStatus =
  | 'Supported'
  | 'Contradicted'
  | 'Unsupported'
  | 'Needs human judgement'
  | 'Not checked';

export type CheckMethod = 'deterministic' | 'ai' | 'hybrid';

export type ReviewStatus =
  | 'Draft'
  | 'Submitted'
  | 'AI-reviewed'
  | 'Changes requested'
  | 'Revised'
  | 'In human review'
  | 'Approved'
  | 'Rejected'
  | 'Exported';

export type DecisionAction = 'accept' | 'edit' | 'dismiss' | 'ask_reviewer' | 'override';

export interface PurposeCard {
  goal: string;
  audience: string;
  key_message: string;
  call_to_action: string;
  locked_phrases: string[];
  content_type: string;
  ai_declared: boolean;
}

export interface SuggestionCheck {
  rule_rechecked: boolean;
  rule_passed: boolean;
  purpose_preserved: boolean;
  note?: string | null;
}

export interface DecisionRecord {
  id: string;
  finding_id: string;
  actor_role: Role;
  action: DecisionAction;
  reason?: string | null;
  created_at: string;
}

export interface Finding {
  id: string;
  review_id: string;
  version: number;
  category: string;
  severity: Severity;
  status: FindingStatus;
  method: CheckMethod;
  confidence: number;
  excerpt: string;
  start: number;
  end: number;
  rule_id?: string | null;
  fact_id?: string | null;
  source_title: string;
  source_version: string;
  reason: string;
  suggestion?: string | null;
  suggestion_check: SuggestionCheck;
  decision?: DecisionRecord | null;
  created_at: string;
}

export interface ReviewVersionSummary {
  id: string;
  version: number;
  content: string;
  diff_from_previous?: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  review_id: string;
  actor_role: Role;
  message: string;
  created_at: string;
}

export interface Approval {
  id: string;
  review_id: string;
  role: Role;
  outcome: string;
  reason?: string | null;
  created_at: string;
}

export interface ReviewResponse {
  id: string;
  kit_id: string;
  status: ReviewStatus;
  content_type: string;
  purpose_card: PurposeCard;
  ai_declared: boolean;
  current_version: number;
  created_by_role: Role;
  created_at: string;
  updated_at: string;
  versions: ReviewVersionSummary[];
  findings: Finding[];
  comments: Comment[];
  approvals: Approval[];
  pass_notice: string;
}

export interface RuleItem {
  id: string;
  kit_id: string;
  category: string;
  title: string;
  text: string;
  banned_terms: string[];
  severity: Severity;
  version: string;
  status: string;
  effective_from: string;
  owner: string;
  source: string;
}

export interface FactItem {
  id: string;
  kit_id: string;
  subject: string;
  value: string;
  unit: string;
  valid_from: string;
  valid_to: string;
  permitted_wording: string;
  owner: string;
  source: string;
  status: string;
}

export interface BrandKitSummary {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  description: string;
  voice_tone: string;
  target_reading_level: number;
  primary_color: string;
  rules: RuleItem[];
  facts: FactItem[];
}

export interface SampleDraft {
  id: string;
  name: string;
  brand_kit_id: string;
  content: string;
  content_type: string;
  ai_declared: boolean;
  purpose_card: PurposeCard;
  description: string;
}

export interface AuditLogEntry {
  seq: number;
  created_at: string;
  actor_role: Role;
  action: string;
  entity: string;
  entity_id: string;
  detail: Record<string, unknown>;
}

export interface DisclosureLedgerEntry {
  id: string;
  review_id: string;
  provider: string;
  model: string;
  data_class: string;
  pii_redacted: boolean;
  token_count: number;
  created_at: string;
}

export interface RuleViolationStat {
  rule_id: string;
  rule_name: string;
  category: string;
  severity: Severity;
  count: number;
  simulated: boolean;
}

export interface RuleOverrideStat {
  rule_id: string;
  rule_name: string;
  category: string;
  override_count: number;
  reasons: string[];
  simulated: boolean;
}

export interface AmbiguousRuleStat {
  rule_id: string;
  rule_name: string;
  category: string;
  violation_count: number;
  override_count: number;
  ambiguity_score: number;
  recommendation: string;
  simulated: boolean;
}

export interface InsightsResponse {
  total_events: number;
  top_repeated_violations: RuleViolationStat[];
  most_overridden_rules: RuleOverrideStat[];
  unclear_rules: AmbiguousRuleStat[];
  simulated_notice: string;
}
