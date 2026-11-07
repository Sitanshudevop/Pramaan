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
  WorkspaceSettings,
  ContentType,
  ActiveSession,
  NotificationPreferences,
} from './types';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = rawApiUrl
  ? (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://') ? rawApiUrl : `https://${rawApiUrl}`).replace(/\/+$/, '')
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:8000');

let authToken: string | null = localStorage.getItem('pramaan_token');
let currentWorkspaceId: string = localStorage.getItem('pramaan_ws_id') || 'ws-demo';
let currentDemoUserId: string = localStorage.getItem('pramaan_demo_persona') || 'usr-priya';

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

export function getDemoUserId(): string {
  return currentDemoUserId;
}

export function setDemoUserId(userId: string) {
  currentDemoUserId = userId;
  localStorage.setItem('pramaan_demo_persona', userId);
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
  if (currentWorkspaceId === 'ws-demo' && currentDemoUserId) {
    headers.set('X-Demo-User-Id', currentDemoUserId);
  }

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
    const message = typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail);

    // Central error dispatch: every failing mutating request notifies the app
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET') {
      window.dispatchEvent(
        new CustomEvent('pramaan-api-error', {
          detail: {
            message,
            status: res.status,
            endpoint,
          },
        })
      );
    }

    throw new Error(message);
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
  avatar_color?: string;
  notification_language?: string;
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
  data: Partial<WorkspaceSettings>
) =>
  fetchApi<Workspace>(`/api/workspaces/${wsId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const getWorkspaceSettings = (wsId: string) =>
  fetchApi<WorkspaceSettings>(`/api/workspaces/${wsId}/settings`);

export const updateWorkspaceSettingsFull = (
  wsId: string,
  data: Partial<WorkspaceSettings>
) =>
  fetchApi<WorkspaceSettings>(`/api/workspaces/${wsId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const getContentTypes = (wsId: string, includeArchived: boolean = false) =>
  fetchApi<ContentType[]>(`/api/workspaces/${wsId}/content-types${includeArchived ? '?include_archived=true' : ''}`);

export const createContentType = (
  wsId: string,
  data: {
    name: string;
    description?: string;
    requires_manager_approval?: boolean;
    default_reviewer_id?: string;
    order_index?: number;
  }
) =>
  fetchApi<ContentType>(`/api/workspaces/${wsId}/content-types`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateContentType = (
  wsId: string,
  ctId: string,
  data: Partial<ContentType>
) =>
  fetchApi<ContentType>(`/api/workspaces/${wsId}/content-types/${ctId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const archiveContentType = (wsId: string, ctId: string) =>
  fetchApi<{ status: string; id: string; message: string }>(`/api/workspaces/${wsId}/content-types/${ctId}`, {
    method: 'DELETE',
  });

export const runRetentionPolicy = (wsId: string) =>
  fetchApi<{ deleted_count: number; retained_count: number; retention_days: number; message: string }>(
    `/api/workspaces/${wsId}/retention/run`,
    {
      method: 'POST',
    }
  );

export const exportWorkspaceData = async (wsId: string) => {
  const data = await fetchApi<Record<string, unknown>>(`/api/workspaces/${wsId}/export`);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workspace_${wsId}_export_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  return data;
};

export const getActiveSessions = () =>
  fetchApi<ActiveSession[]>('/api/auth/sessions');

export const revokeSession = (sessionId: string) =>
  fetchApi<{ status: string; id: string; message: string }>(`/api/auth/sessions/${sessionId}/revoke`, {
    method: 'POST',
  });

export const revokeOtherSessions = () =>
  fetchApi<{ status: string; count: number; message: string }>('/api/auth/sessions/revoke-others', {
    method: 'POST',
  });

export const getNotificationPreferences = () =>
  fetchApi<NotificationPreferences>('/api/auth/notifications/preferences');

export const updateNotificationPreferences = (data: Partial<NotificationPreferences>) =>
  fetchApi<{ status: string; preferences: NotificationPreferences }>('/api/auth/notifications/preferences', {
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

export const resetDemoWorkspace = (role: Role = 'Admin') =>
  fetchApi<{ status: string; message: string; workspace_id: string }>(
    '/api/workspaces/demo/reset',
    {
      method: 'POST',
    },
    role
  );


