/**
 * API client communicating with FastAPI backend.
 */

import {
  BrandKitSummary,
  Comment,
  DecisionAction,
  InsightsResponse,
  ReviewResponse,
  Role,
  RuleItem,
  FactItem,
  SampleDraft,
  AuditLogEntry,
  DisclosureLedgerEntry,
  CreateRulePayload,
  CreateFactPayload,
  UpdateFactPayload,
  AuditVerifyResult,
  User,
  Workspace,
  AuthSession,
  OnboardingWizardPayload,
  CreateBrandKitPayload,
  CreateClaimPayload,
  CreateGlossaryPayload,
  WorkspaceMember,
  Invitation,
  NotificationItem,
  BulkImportItem,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let authToken: string | null = localStorage.getItem('pramaan_token');
let currentWorkspaceId: string = localStorage.getItem('pramaan_ws_id') || 'ws-demo';

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('pramaan_token', token);
  } else {
    localStorage.removeItem('pramaan_token');
  }
}

export function getCurrentWorkspaceId(): string {
  return currentWorkspaceId;
}

export function setWorkspaceId(wsId: string) {
  currentWorkspaceId = wsId;
  localStorage.setItem('pramaan_ws_id', wsId);
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  role: Role = 'Creator',
  confidentialMode: boolean = false
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  headers.set('X-Workspace-Id', currentWorkspaceId);
  headers.set('X-Demo-Role', role);
  headers.set('X-Confidential-Mode', confidentialMode ? '1' : '0');

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'Network request failed';
    try {
      const data = await res.json();
      errorDetail = data.detail?.error?.message || data.detail || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Authentication & Accounts API
// ---------------------------------------------------------------------------

export const authSignUp = (data: { email: string; password: string; full_name: string }) =>
  fetchApi<AuthSession>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const authSignIn = (data: { email: string; password: string }) =>
  fetchApi<AuthSession>('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const authSignOut = () =>
  fetchApi<{ message: string }>('/api/auth/signout', {
    method: 'POST',
  });

export const authGetMe = () => fetchApi<AuthSession>('/api/auth/me');

export const authUpdateProfile = (data: {
  full_name?: string;
  avatar_url?: string;
  current_password?: string;
  new_password?: string;
}) =>
  fetchApi<User>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const authExportData = () => fetchApi<Record<string, unknown>>('/api/auth/export-data', { method: 'POST' });

export const authDeleteAccount = () => fetchApi<{ message: string }>('/api/auth/account', { method: 'DELETE' });

// ---------------------------------------------------------------------------
// Workspaces & Onboarding API
// ---------------------------------------------------------------------------

export const listWorkspaces = () => fetchApi<Workspace[]>('/api/workspaces');

export const getDemoWorkspace = () => fetchApi<Workspace>('/api/workspaces/demo');

export const createWorkspace = (data: { name: string; industry?: string }) =>
  fetchApi<Workspace>('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const completeOnboarding = (data: OnboardingWizardPayload) =>
  fetchApi<Workspace>('/api/workspaces/onboarding', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateWorkspaceSettings = (
  wsId: string,
  data: { name?: string; industry?: string; retention_days?: number; ai_enabled?: boolean }
) =>
  fetchApi<Workspace>(`/api/workspaces/${wsId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteWorkspace = (wsId: string) =>
  fetchApi<{ message: string }>(`/api/workspaces/${wsId}`, {
    method: 'DELETE',
  });

export const listWorkspaceMembers = (wsId: string) =>
  fetchApi<WorkspaceMember[]>(`/api/workspaces/${wsId}/members`);

export const updateWorkspaceMemberRole = (wsId: string, userId: string, role: Role) =>
  fetchApi<WorkspaceMember>(`/api/workspaces/${wsId}/members/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });

export const removeWorkspaceMember = (wsId: string, userId: string) =>
  fetchApi<{ message: string }>(`/api/workspaces/${wsId}/members/${userId}`, {
    method: 'DELETE',
  });

export const createInvitation = (wsId: string, data: { email?: string; role: string; max_uses?: number }) =>
  fetchApi<Invitation>(`/api/workspaces/${wsId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const acceptInvitation = (token: string) =>
  fetchApi<{ message: string; workspace_id: string; role: Role }>(`/api/workspaces/invitations/accept?token=${token}`, {
    method: 'POST',
  });

// ---------------------------------------------------------------------------
// Brand Hub API
// ---------------------------------------------------------------------------

export const createBrandKit = (data: CreateBrandKitPayload, role: Role = 'Brand manager') =>
  fetchApi<BrandKitSummary>(
    '/api/brands',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    role
  );

export const updateBrandKit = (id: string, data: Partial<CreateBrandKitPayload>, role: Role = 'Brand manager') =>
  fetchApi<BrandKitSummary>(
    `/api/brands/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    role
  );

export const createClaimPattern = (kitId: string, data: CreateClaimPayload, role: Role = 'Brand manager') =>
  fetchApi<{ id: string; pattern: string }>(
    `/api/brands/${kitId}/claims`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    role
  );

export const listClaimPatterns = (kitId: string) =>
  fetchApi<CreateClaimPayload[]>(`/api/brands/${kitId}/claims`);

export const createGlossaryTerm = (kitId: string, data: CreateGlossaryPayload, role: Role = 'Brand manager') =>
  fetchApi<{ id: string; term: string }>(
    `/api/brands/${kitId}/glossary`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    role
  );

export const listGlossaryTerms = (kitId: string) =>
  fetchApi<CreateGlossaryPayload[]>(`/api/brands/${kitId}/glossary`);


// Brand Kits
export const getBrandKits = (role: Role) => fetchApi<BrandKitSummary[]>('/api/brands', {}, role);

export const getBrandKit = (id: string, role: Role) =>
  fetchApi<BrandKitSummary>(`/api/brands/${id}`, {}, role);

export const getSampleDrafts = () =>
  fetchApi<SampleDraft[]>('/api/brands/samples/drafts');

export const updateBrandRule = (
  kitId: string,
  ruleId: string,
  payload: { title?: string; text?: string; severity?: string; reason: string },
  role: Role
) =>
  fetchApi<RuleItem>(
    `/api/brands/${kitId}/rules/${ruleId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    role
  );

export const createBrandRule = (
  kitId: string,
  payload: CreateRulePayload,
  role: Role
) =>
  fetchApi<RuleItem>(
    `/api/brands/${kitId}/rules`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    role
  );

export const createBrandFact = (
  kitId: string,
  payload: CreateFactPayload,
  role: Role
) =>
  fetchApi<FactItem>(
    `/api/brands/${kitId}/facts`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    role
  );

export const updateBrandFact = (
  kitId: string,
  factId: string,
  payload: UpdateFactPayload,
  role: Role
) =>
  fetchApi<FactItem>(
    `/api/brands/${kitId}/facts/${factId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    role
  );

// Reviews
export const createReview = (
  payload: {
    brand_kit_id: string;
    content: string;
    content_type: string;
    purpose_card: {
      goal: string;
      audience: string;
      key_message: string;
      call_to_action: string;
      locked_phrases: string[];
      content_type: string;
      ai_declared: boolean;
    };
    ai_declared: boolean;
    assignee_id?: string;
  },
  role: Role,
  confidentialMode: boolean
) =>
  fetchApi<ReviewResponse>(
    '/api/reviews',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    role,
    confidentialMode
  );

export const listReviews = (role: Role) => fetchApi<ReviewResponse[]>('/api/reviews', {}, role);

export const getReview = (id: string, role: Role, version?: number) =>
  fetchApi<ReviewResponse>(
    `/api/reviews/${id}${version ? `?version=${version}` : ''}`,
    {},
    role
  );

export const actOnFinding = (
  reviewId: string,
  findingId: string,
  action: DecisionAction,
  role: Role,
  reason?: string,
  editedSuggestion?: string
) =>
  fetchApi<ReviewResponse>(
    `/api/reviews/${reviewId}/findings/${findingId}/act`,
    {
      method: 'POST',
      body: JSON.stringify({
        action,
        reason,
        edited_suggestion: editedSuggestion,
      }),
    },
    role
  );

export const overrideFinding = (
  reviewId: string,
  findingId: string,
  reason: string,
  role: Role
) =>
  fetchApi<ReviewResponse>(
    `/api/reviews/${reviewId}/findings/${findingId}/override`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
    role
  );

export const addComment = (reviewId: string, message: string, role: Role) =>
  fetchApi<Comment>(
    `/api/reviews/${reviewId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    },
    role
  );

export const submitApproval = (
  reviewId: string,
  outcome: 'Approved' | 'Rejected' | 'Changes requested',
  role: Role,
  reason?: string
) =>
  fetchApi<ReviewResponse>(
    `/api/reviews/${reviewId}/approval`,
    {
      method: 'POST',
      body: JSON.stringify({ outcome, reason }),
    },
    role
  );

export const submitDraftRevision = (
  reviewId: string,
  content: string,
  reason: string | undefined,
  role: Role
) =>
  fetchApi<ReviewResponse>(
    `/api/reviews/${reviewId}/versions`,
    {
      method: 'POST',
      body: JSON.stringify({ content, reason }),
    },
    role
  );

export const deleteReview = (reviewId: string, role: Role) =>
  fetchApi<{ status: string; id: string }>(
    `/api/reviews/${reviewId}`,
    {
      method: 'DELETE',
    },
    role
  );

// Audit & Insights
export const getAuditLogs = (role: Role) =>
  fetchApi<AuditLogEntry[]>('/api/audit/logs', {}, role);

export const getDisclosureLedger = (role: Role) =>
  fetchApi<DisclosureLedgerEntry[]>('/api/audit/disclosures', {}, role);

export const getConfidentialMode = () =>
  fetchApi<{ enabled: boolean }>('/api/audit/confidential-mode');

export const setConfidentialModeBackend = (enabled: boolean, role: Role) =>
  fetchApi<{ enabled: boolean }>(
    '/api/audit/confidential-mode',
    {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    },
    role
  );

export const exportAuditLogs = async (format: 'csv' | 'json', role: Role) => {
  const headers = new Headers();
  headers.set('X-Demo-Role', role);
  const res = await fetch(`${API_BASE}/api/audit/export?format=${format}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error('Failed to export audit logs');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pramaan_audit_trail.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const verifyAuditIntegrity = (role: Role) =>
  fetchApi<AuditVerifyResult>(
    '/api/audit/verify',
    {
      method: 'POST',
    },
    role
  );

export const getInsights = (role: Role, kitId?: string) =>
  fetchApi<InsightsResponse>(
    `/api/insights${kitId ? `?brand_kit_id=${kitId}` : ''}`,
    {},
    role
  );

export const assignReview = (reviewId: string, assigneeId?: string, role: Role = 'Reviewer') =>
  fetchApi<ReviewResponse>(
    `/api/reviews/${reviewId}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({ assignee_id: assigneeId }),
    },
    role
  );

// In-app Notifications
export const getNotifications = () => fetchApi<NotificationItem[]>('/api/notifications');

export const markNotificationRead = (notificationId: string) =>
  fetchApi<{ status: string; id: string }>(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
  });

export const markAllNotificationsRead = () =>
  fetchApi<{ status: string }>('/api/notifications/read-all', {
    method: 'POST',
  });

// Brand Hub Import / Export
export const exportBrandKit = async (kitId: string, format: 'json' | 'csv') => {
  const headers = new Headers();
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  headers.set('X-Workspace-Id', currentWorkspaceId);

  const res = await fetch(`${API_BASE}/api/brands/${kitId}/export?format=${format}`, { headers });
  if (!res.ok) throw new Error('Failed to export brand kit');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `brand_kit_${kitId}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const bulkImportRules = (kitId: string, items: BulkImportItem[], role: Role = 'Brand manager') =>
  fetchApi<{ message: string; rule_ids: string[] }>(
    `/api/brands/${kitId}/import`,
    {
      method: 'POST',
      body: JSON.stringify({ items }),
    },
    role
  );

export const extractGuidelineRules = (kitId: string, content: string, role: Role = 'Brand manager') =>
  fetchApi<{ kit_id: string; extracted_count: number; proposed_items: BulkImportItem[] }>(
    `/api/brands/${kitId}/extract-guideline`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
    role
  );


