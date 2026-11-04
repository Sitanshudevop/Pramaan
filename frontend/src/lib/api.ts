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
  SampleDraft,
  AuditLogEntry,
  DisclosureLedgerEntry,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

// Audit & Insights
export const getAuditLogs = (role: Role) =>
  fetchApi<AuditLogEntry[]>('/api/audit/logs', {}, role);

export const getDisclosureLedger = (role: Role) =>
  fetchApi<DisclosureLedgerEntry[]>('/api/audit/disclosures', {}, role);

export const getInsights = (role: Role, kitId?: string) =>
  fetchApi<InsightsResponse>(
    `/api/insights${kitId ? `?brand_kit_id=${kitId}` : ''}`,
    {},
    role
  );

