import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Sparkles,
  Download,
  MessageSquare,
  History,
  Send,
  Loader2,
} from 'lucide-react';
import {
  getReview,
  actOnFinding,
  overrideFinding,
  addComment,
  submitApproval,
} from '../lib/api';
import { useApp } from '../lib/context';
import { DecisionAction, Finding, ReviewResponse } from '../lib/types';

export const ReviewFindings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useApp();
  const queryClient = useQueryClient();

  const [activeVersion, setActiveVersion] = useState<number | undefined>(undefined);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Modals / Action States
  const [actionFinding, setActionFinding] = useState<Finding | null>(null);
  const [actionType, setActionType] = useState<DecisionAction | null>(null);
  const [reasonInput, setReasonInput] = useState<string>('');
  const [editInput, setEditInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');
  const [approvalReason, setApprovalReason] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch Review
  const { data: review, isLoading, error } = useQuery<ReviewResponse>({
    queryKey: ['review', id, role, activeVersion],
    queryFn: () => getReview(id!, role, activeVersion),
    enabled: Boolean(id),
  });

  // Action Mutation
  const actMutation = useMutation({
    mutationFn: () => {
      if (!actionFinding || !actionType) throw new Error('Missing action details');
      if (actionType === 'override') {
        return overrideFinding(id!, actionFinding.id, reasonInput, role);
      }
      return actOnFinding(
        id!,
        actionFinding.id,
        actionType,
        role,
        reasonInput || undefined,
        actionType === 'edit' ? editInput : undefined
      );
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['review', id, role, activeVersion], updated);
      queryClient.invalidateQueries({ queryKey: ['review', id] });
      closeActionModal();
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Action failed');
    },
  });

  // Comment Mutation
  const commentMutation = useMutation({
    mutationFn: () => addComment(id!, commentInput, role),
    onSuccess: () => {
      setCommentInput('');
      queryClient.invalidateQueries({ queryKey: ['review', id] });
    },
  });

  // Approval Mutation
  const approvalMutation = useMutation({
    mutationFn: (outcome: 'Approved' | 'Rejected' | 'Changes requested') =>
      submitApproval(id!, outcome, role, approvalReason || undefined),
    onSuccess: () => {
      setApprovalReason('');
      queryClient.invalidateQueries({ queryKey: ['review', id] });
    },
    onError: (err: Error) => {
      alert(err.message || 'Approval action failed');
    },
  });

  const openActionModal = (finding: Finding, type: DecisionAction) => {
    setActionFinding(finding);
    setActionType(type);
    setReasonInput('');
    setEditInput(finding.suggestion || finding.excerpt);
    setActionError(null);
  };

  const closeActionModal = () => {
    setActionFinding(null);
    setActionType(null);
    setReasonInput('');
    setEditInput('');
    setActionError(null);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
        <p className="text-sm text-text-muted">Evaluating brand guidelines and facts...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="p-6 rounded-card bg-danger/10 border border-danger/20 text-danger text-sm">
        Failed to load review: {(error as Error)?.message || 'Not found'}
      </div>
    );
  }

  const currentVersionContent =
    review.versions.find((v) => v.version === (activeVersion || review.current_version))
      ?.content || '';

  const activeDiff =
    review.versions.find((v) => v.version === (activeVersion || review.current_version))
      ?.diff_from_previous || null;

  return (
    <div className="space-y-6">
      {/* Top Header Summary */}
      <div className="p-5 rounded-card border border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-text-muted mb-1">
            <span className="font-mono">{review.id}</span>
            <span>·</span>
            <span>Brand: {review.kit_id}</span>
            <span>·</span>
            <span>Format: {review.content_type}</span>
          </div>
          <h1 className="text-xl font-bold text-text flex items-center space-x-2">
            <span>Review Workspace</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                review.status === 'Approved'
                  ? 'bg-success/15 text-success'
                  : review.status === 'Changes requested'
                  ? 'bg-warning/15 text-warning'
                  : 'bg-surface-2 text-text-muted'
              }`}
            >
              {review.status}
            </span>
          </h1>
        </div>

        {/* Action Clearance / Certificate */}
        <div className="flex items-center space-x-2.5">
          {review.status === 'Approved' && (
            <a
              href={`http://localhost:8000/api/reviews/${review.id}/certificate`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-btn bg-accent text-white text-xs font-medium hover:opacity-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Approval Certificate</span>
            </a>
          )}

          {/* Reviewer / Manager Approval Controls */}
          {(role === 'Reviewer' || role === 'Brand manager') && review.status !== 'Approved' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => approvalMutation.mutate('Approved')}
                disabled={approvalMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-btn bg-success text-white text-xs font-medium hover:opacity-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => approvalMutation.mutate('Changes requested')}
                disabled={approvalMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-btn border border-border bg-surface text-text text-xs font-medium hover:bg-surface-2"
              >
                <span>Request Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Version Stepper */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="font-medium text-text-muted flex items-center space-x-1">
          <History className="w-3.5 h-3.5" />
          <span>Versions:</span>
        </span>
        {review.versions.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveVersion(v.version)}
            className={`px-3 py-1 rounded-btn font-medium transition-colors ${
              (activeVersion || review.current_version) === v.version
                ? 'bg-accent text-white'
                : 'bg-surface border border-border text-text hover:bg-surface-2'
            }`}
          >
            v{v.version} {v.version === review.current_version ? '(Current)' : ''}
          </button>
        ))}
      </div>

      {/* Grid: Left Findings List / Right Content Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Findings List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">
              Findings ({review.findings.length})
            </h2>
            <span className="text-[11px] text-text-muted">Sorted by severity</span>
          </div>

          {review.findings.length === 0 ? (
            <div className="p-8 rounded-card border border-border bg-surface text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-success" />
              <div className="font-semibold text-text text-sm">No issues detected</div>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                {review.pass_notice}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {review.findings.map((f) => (
                <div
                  key={f.id}
                  className={`p-4 rounded-card border border-border bg-surface border-l-4 transition-all ${
                    selectedFindingId === f.id ? 'ring-1 ring-accent shadow-sm' : ''
                  } ${
                    f.severity === 'Blocker'
                      ? 'border-l-danger'
                      : f.severity === 'Major'
                      ? 'border-l-warning'
                      : f.severity === 'Minor'
                      ? 'border-l-text-muted'
                      : 'border-l-accent'
                  }`}
                  onClick={() => setSelectedFindingId(f.id)}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          f.severity === 'Blocker'
                            ? 'bg-danger/10 text-danger'
                            : f.severity === 'Major'
                            ? 'bg-warning/10 text-warning'
                            : f.severity === 'Minor'
                            ? 'bg-surface-2 text-text-muted'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-xs font-semibold text-text">{f.category}</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-[11px] text-text-muted">{f.status}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[11px] text-text-muted">
                      <span className="font-mono uppercase text-[10px] bg-surface-2 px-1.5 py-0.5 rounded">
                        {f.method}
                      </span>
                      <span>{Math.round(f.confidence * 100)}%</span>
                    </div>
                  </div>

                  {/* Flagged Excerpt */}
                  <div className="p-2 rounded bg-surface-2 font-mono text-xs text-text border border-border/50 mb-2">
                    &ldquo;{f.excerpt}&rdquo;
                  </div>

                  {/* Explanation & Source Proof */}
                  <div className="text-xs text-text-muted space-y-1 mb-3">
                    <p>{f.reason}</p>
                    <div className="text-[11px] font-mono text-accent">
                      Evidence Source: {f.rule_id || f.fact_id} ({f.source_title})
                    </div>
                  </div>

                  {/* Purpose-Preserving Suggestion & Diff */}
                  {f.suggestion && (
                    <div className="p-3 rounded-btn border border-border bg-surface-2 space-y-2 mb-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-text flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          <span>Suggested Correction:</span>
                        </span>
                        {f.suggestion_check.purpose_preserved ? (
                          <span className="text-success font-medium">✓ Purpose Preserved</span>
                        ) : (
                          <span className="text-warning font-medium">⚠ Check Intent</span>
                        )}
                      </div>

                      {/* Diff View */}
                      <div className="text-xs font-mono space-y-0.5">
                        <div className="p-1 rounded bg-danger/10 text-danger flex items-center space-x-1">
                          <span>-</span>
                          <span className="line-through">{f.excerpt}</span>
                        </div>
                        <div className="p-1 rounded bg-success/10 text-success flex items-center space-x-1">
                          <span>+</span>
                          <span>{f.suggestion}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Decision Status or Action Buttons */}
                  {f.decision ? (
                    <div className="p-2 rounded bg-surface-2 text-xs text-text flex items-center justify-between border border-border/50">
                      <span className="font-medium">
                        Resolved by {f.decision.actor_role}: {f.decision.action}
                      </span>
                      {f.decision.reason && (
                        <span className="text-text-muted italic text-[11px]">
                          &ldquo;{f.decision.reason}&rdquo;
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
                      {role === 'Creator' && f.suggestion && (
                        <>
                          <button
                            onClick={() => openActionModal(f, 'accept')}
                            className="px-2.5 py-1 rounded bg-accent text-white text-xs font-medium hover:opacity-95"
                          >
                            Accept Fix
                          </button>
                          <button
                            onClick={() => openActionModal(f, 'edit')}
                            className="px-2.5 py-1 rounded border border-border bg-surface text-text text-xs hover:bg-surface-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openActionModal(f, 'dismiss')}
                            className="px-2.5 py-1 rounded border border-border bg-surface text-text-muted hover:text-text text-xs hover:bg-surface-2"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => openActionModal(f, 'ask_reviewer')}
                            className="px-2.5 py-1 rounded text-text-muted hover:text-accent text-xs"
                          >
                            Ask Reviewer
                          </button>
                        </>
                      )}

                      {(role === 'Reviewer' || role === 'Brand manager') && (
                        <button
                          onClick={() => openActionModal(f, 'override')}
                          className="px-2.5 py-1 rounded bg-warning/10 text-warning border border-warning/30 text-xs font-medium hover:bg-warning/20"
                        >
                          Override Finding
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Draft Content & Comments (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Content Viewer */}
          <div className="p-5 rounded-card border border-border bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Content Text</h2>
              <span className="text-[11px] text-text-muted">
                Version {activeVersion || review.current_version}
              </span>
            </div>

            <div className="p-4 rounded-btn border border-border bg-surface-2 text-xs leading-relaxed whitespace-pre-wrap font-sans text-text max-h-96 overflow-y-auto">
              {currentVersionContent}
            </div>

            {/* Version Diff View if available */}
            {activeDiff && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-text-muted">
                  Diff from previous version:
                </span>
                <pre className="p-3 rounded bg-surface border border-border font-mono text-[11px] text-text overflow-x-auto">
                  {activeDiff}
                </pre>
              </div>
            )}
          </div>

          {/* Collaboration Discussion */}
          <div className="p-5 rounded-card border border-border bg-surface space-y-3">
            <h2 className="text-sm font-semibold text-text flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-text-muted" />
              <span>Comments & Discussion</span>
            </h2>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {review.comments.length === 0 ? (
                <div className="text-xs text-text-muted py-2 italic text-center">
                  No discussion notes recorded yet.
                </div>
              ) : (
                review.comments.map((c) => (
                  <div key={c.id} className="p-2.5 rounded bg-surface-2 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-text text-[11px]">
                      <span>{c.actor_role}</span>
                      <span className="text-text-muted font-normal">
                        {new Date(c.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-text-muted">{c.message}</p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (commentInput.trim()) commentMutation.mutate();
              }}
              className="flex items-center space-x-2 pt-2 border-t border-border"
            >
              <input
                type="text"
                placeholder="Add a reviewer note..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-btn border border-border bg-surface-2 text-xs text-text focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={commentMutation.isPending || !commentInput.trim()}
                className="p-1.5 rounded-btn bg-accent text-white disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Action Modal (Accept / Edit / Dismiss / Override) */}
      {actionFinding && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md p-5 rounded-card bg-surface border border-border shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-text capitalize">
              {actionType.replace('_', ' ')} Finding
            </h3>

            {actionError && (
              <div className="p-2.5 rounded bg-danger/10 text-danger text-xs">
                {actionError}
              </div>
            )}

            {actionType === 'edit' && (
              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Custom Replacement Text
                </label>
                <textarea
                  rows={3}
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  className="w-full p-2.5 rounded-btn border border-border bg-surface-2 text-xs font-mono text-text"
                />
              </div>
            )}

            {(actionType === 'dismiss' || actionType === 'override') && (
              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Justification Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this finding is dismissed or overridden..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full p-2.5 rounded-btn border border-border bg-surface-2 text-xs text-text"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={closeActionModal}
                className="px-3 py-1.5 rounded-btn border border-border text-xs text-text hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => actMutation.mutate()}
                disabled={
                  actMutation.isPending ||
                  ((actionType === 'dismiss' || actionType === 'override') &&
                    !reasonInput.trim())
                }
                className="px-4 py-1.5 rounded-btn bg-accent text-white text-xs font-medium hover:opacity-95 disabled:opacity-50"
              >
                {actMutation.isPending ? 'Applying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
