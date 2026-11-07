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
  creator_id?: string;
  assignee_id?: string;
  is_overdue?: boolean;
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

export interface CreateRulePayload {
  id?: string;
  category?: string;
  title: string;
  text: string;
  severity?: Severity;
  banned_terms?: string[];
  preferred_replacement?: string;
  allow_in_quotes?: boolean;
  placement_hint?: string;
  reason?: string;
}

export interface CreateFactPayload {
  id?: string;
  subject: string;
  value: string;
  unit?: string;
  permitted_wording: string;
  valid_from?: string;
  valid_to?: string;
  source?: string;
}

export interface UpdateFactPayload {
  subject?: string;
  value?: string;
  unit?: string;
  permitted_wording?: string;
  valid_from?: string;
  valid_to?: string;
  status?: string;
}

export interface AuditVerifyResult {
  status: string;
  total_records: number;
  latest_hash: string;
  tamper_evident: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Multi-Tenant Real User Accounts & Workspaces Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  avatar_color?: string;
  notification_language?: string;
  notification_preferences_json?: string;
  created_at: string;
}

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  bio: string;
  initials: string;
}

export const DEMO_CAST: DemoPersona[] = [
  {
    id: 'usr-meera',
    name: 'Meera Kapoor',
    email: 'meera@example.com',
    role: 'Admin',
    avatarColor: '#E06D3B',
    bio: 'Admin · Owns settings, enabled AI with consent',
    initials: 'MK',
  },
  {
    id: 'usr-anika',
    name: 'Anika Rao',
    email: 'anika@example.com',
    role: 'Brand manager',
    avatarColor: '#3B82F6',
    bio: 'Brand manager · Publishes rules, final approvals',
    initials: 'AR',
  },
  {
    id: 'usr-rohan',
    name: 'Rohan Mehta',
    email: 'rohan@example.com',
    role: 'Reviewer',
    avatarColor: '#10B981',
    bio: 'Reviewer · Kettle & Co. content, overrides',
    initials: 'RM',
  },
  {
    id: 'usr-dev',
    name: 'Dev Malhotra',
    email: 'dev@example.com',
    role: 'Reviewer',
    avatarColor: '#8B5CF6',
    bio: 'Reviewer · LedgerLeaf compliance, disclaimers',
    initials: 'DM',
  },
  {
    id: 'usr-priya',
    name: 'Priya Nair',
    email: 'priya@example.com',
    role: 'Creator',
    avatarColor: '#EC4899',
    bio: 'Creator · Social & email drafts for Kettle & Co.',
    initials: 'PN',
  },
  {
    id: 'usr-imran',
    name: 'Imran Sheikh',
    email: 'imran@example.com',
    role: 'Creator',
    avatarColor: '#F59E0B',
    bio: 'Creator · App copy & landing pages for LedgerLeaf',
    initials: 'IS',
  },
];

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  industry: string;
  is_demo: boolean;
  retention_days: number;
  ai_enabled: boolean;
  timezone?: string;
  date_format?: string;
  default_brand_kit_id?: string;
  default_spelling?: string;
  manager_approval_severity?: string;
  require_decision_reason?: boolean;
  auto_assign_mode?: string;
  sla_hours?: number;
  confidential_mode?: boolean;
  redaction_options_json?: string;
  logo_url?: string | null;
  role: Role;
}

export interface WorkspaceSettings {
  id: string;
  name: string;
  slug: string;
  industry: string;
  is_demo: boolean;
  retention_days: number;
  ai_enabled: boolean;
  ai_consent_at?: string | null;
  ai_consent_by_id?: string | null;
  ai_consent_by_name?: string | null;
  ai_consent_version?: string | null;
  timezone: string;
  date_format: string;
  default_brand_kit_id: string;
  default_spelling: string;
  manager_approval_severity: string;
  require_decision_reason: boolean;
  auto_assign_mode: string;
  sla_hours: number;
  confidential_mode: boolean;
  redaction_options_json: string;
  logo_url?: string | null;
  last_changed_by?: string | null;
  last_changed_at?: string | null;
  role: Role;
}

export interface ContentType {
  id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  requires_manager_approval: boolean;
  default_reviewer_id?: string | null;
  default_reviewer_name?: string | null;
  order_index: number;
  is_archived: boolean;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  last_active_at: string;
  is_current: boolean;
}

export interface NotificationPreferences {
  assigned: boolean;
  mentions: boolean;
  changes_requested: boolean;
  approved: boolean;
  overdue: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  language?: string;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  user: User;
  current_workspace: Workspace;
  workspaces: Workspace[];
}

export interface OnboardingWizardPayload {
  workspace_name: string;
  industry: string;
  brand_name: string;
  primary_language?: string;
  voice_tone?: string;
  target_reading_level?: number;
  brand_colors?: string[];
  invite_emails?: string[];
}

export interface CreateBrandKitPayload {
  name: string;
  tagline?: string;
  industry?: string;
  description?: string;
  voice_tone?: string;
  primary_language?: string;
  target_reading_level?: number;
  primary_color?: string;
  brand_colors?: string[];
  default_disclosure?: string;
}

export interface CreateClaimPayload {
  pattern: string;
  category?: string;
  severity?: Severity;
  substantiating_fact_id?: string;
  reason: string;
}

export interface CreateGlossaryPayload {
  term: string;
  preferred_casing: string;
  definition?: string;
}

export interface WorkspaceMember {
  membership_id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Invitation {
  id: string;
  token: string;
  invite_url: string;
  role: Role;
  email?: string | null;
  expires_at: string;
  used_count: number;
  max_uses: number;
}

export interface NotificationItem {
  id: string;
  workspace_id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface BulkImportItem {
  type: string;
  category: string;
  title: string;
  text: string;
  severity: Severity;
  banned_terms?: string[];
  preferred_replacement?: string;
}



