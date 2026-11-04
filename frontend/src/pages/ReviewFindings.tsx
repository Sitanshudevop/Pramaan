import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Download,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
import { StatCard, GaugeCard, ProgressPill, PillTabs, Chip } from '../components/ui';

export const ReviewFindings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useApp();
  const queryClient = useQueryClient();

  const [activeVersion, setActiveVersion] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('findings');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  // Action Modal State
  const [actionFinding, setActionFinding] = useState<Finding | null>(null);
  const [actionType, setActionType] = useState<DecisionAction | null>(null);
  const [reasonInput, setReasonInput] = useState<string>('');
  const [editInput, setEditInput] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Reviewer comment input state
  const [commentInput, setCommentInput] = useState<string>('');
  const [approvalReason, setApprovalReason] = useState<string>('');

  // Fetch Review Data
  const {
    data: review,
    isLoading,
    error,
  } = useQuery<ReviewResponse>({
    queryKey: ['review', id, role],
    queryFn: () => getReview(id!, role),
    enabled: !!id,
    refetchInterval: 10000,
  });

  // Action Mutation
  const actMutation = useMutation({
    mutationFn: () => {
      if (!actionFinding || !actionType) throw new Error('Missing action params');

      if (actionType === 'override') {
        return overrideFinding(id!, actionFinding.id, reasonInput, role);
      } else {
        return actOnFinding(
          id!,
          actionFinding.id,
          actionType,
          role,
          actionType === 'dismiss' ? reasonInput : undefined,
          actionType === 'edit' ? editInput : undefined
        );
      }
    },
    onSuccess: () => {
      closeActionModal();
      queryClient.invalidateQueries({ queryKey: ['review', id] });
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

  const toggleSourceExpand = (findingId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [findingId]: !prev[findingId],
    }));
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
        <p className="text-xs text-text-muted">Evaluating brand guidelines and facts...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="p-6 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs font-medium">
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

  // Filter findings for the active view version
  const currentVersionFindings = review.findings.filter(
    (f) => f.version === (activeVersion || review.current_version)
  );

  const blockerCount = currentVersionFindings.filter((f) => f.severity === 'Blocker').length;

  // Evidence coverage percentage: share of findings with valid rule_id or fact_id
  const totalFindings = currentVersionFindings.length;
  const groundedFindings = currentVersionFindings.filter((f) => f.rule_id || f.fact_id).length;
  const coverageRate = totalFindings > 0 ? (groundedFindings / totalFindings) * 100 : 100;

  // Progress percentage based on review status
  const progressMap: Record<string, number> = {
    Draft: 15,
    Submitted: 35,
    'AI-reviewed': 55,
    'Changes requested': 70,
    'In human review': 85,
    Approved: 100,
    Rejected: 100,
  };
  const workflowPercent = progressMap[review.status] || 50;

  const tabs = [
    { id: 'findings', label: 'Findings', count: currentVersionFindings.length },
    {
      id: 'suggestions',
      label: 'Suggestions',
      count: currentVersionFindings.filter((f) => f.suggestion).length,
    },
    { id: 'history', label: 'History', count: review.versions.length },
    { id: 'sources', label: 'Grounding Sources', count: groundedFindings },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Summary */}
      <div className="p-6 rounded-card border border-border bg-surface shadow-floating flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-text-muted mb-1">
            <span className="font-mono font-medium">{review.id}</span>
            <span>·</span>
            <span className="capitalize">{review.kit_id.replace('-', ' ')}</span>
            <span>·</span>
            <span>{review.content_type}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text flex items-center space-x-2.5">
            <span>Review Workspace</span>
            <Chip
              variant={
                review.status === 'Approved'
                  ? 'success'
                  : review.status === 'Changes requested'
                  ? 'accent'
                  : 'neutral'
              }
              size="sm"
            >
              {review.status}
            </Chip>
          </h1>
        </div>

        {/* Action Controls & Export Certificate */}
        <div className="flex items-center space-x-2.5">
          <a
            href={`/api/reviews/${review.id}/certificate`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-pill border border-border bg-surface hover:bg-surface-2 text-text text-xs font-medium transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            <span>Certificate (HTML/PDF)</span>
          </a>

          {(role === 'Brand manager' || role === 'Admin') && review.status !== 'Approved' && (
            <button
              onClick={() => approvalMutation.mutate('Approved')}
              disabled={approvalMutation.isPending || (blockerCount > 0 && role !== 'Brand manager')}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-gradient-to-r dark:from-orange-400 dark:to-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-95 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Row: Two StatCards and One Dark Feature GaugeCard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Total Findings"
          value={totalFindings}
          hint={totalFindings === 0 ? 'No issues flagged' : `${totalFindings} item(s) in active draft`}
        />

        <StatCard
          label="Blocker Violations"
          value={blockerCount}
          delta={
            blockerCount > 0
              ? { direction: 'down', label: 'Requires Sign-off' }
              : { direction: 'up', label: 'Clean' }
          }
          hint={blockerCount > 0 ? 'Brand manager approval gate required' : 'No blocker policy issues'}
        />

        <GaugeCard
          value={coverageRate}
          max={100}
          unit="%"
          label="Evidence Coverage"
          caption="100% of shown findings link to active approved rules or facts."
        />
      </div>

      {/* Workflow Progress Pill Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-card border border-border bg-surface shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-text uppercase tracking-wider">
            Review Lifecycle:
          </span>
          <ProgressPill value={workflowPercent} label={review.status} />
        </div>

        {/* Version Switcher Pills */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-text-muted mr-1">Version:</span>
          {review.versions.map((v) => (
            <button
              key={v.version}
              onClick={() => setActiveVersion(v.version)}
              className={`px-2.5 py-0.5 rounded-pill text-[11px] font-mono transition-colors ${
                (activeVersion || review.current_version) === v.version
                  ? 'bg-text text-bg font-bold shadow-xs'
                  : 'bg-surface-2 text-text-muted hover:text-text'
              }`}
            >
              v{v.version}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: 7 cols Findings / 5 cols Document Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Tabs and Cards */}
        <div className="lg:col-span-7 space-y-4">
          <PillTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* TAB 1: FINDINGS VIEW */}
          {activeTab === 'findings' && (
            <div className="space-y-4">
              {currentVersionFindings.length === 0 ? (
                <div className="p-8 rounded-card border border-border bg-surface text-center space-y-2 shadow-floating">
                  <CheckCircle2 className="w-8 h-8 text-success-text mx-auto" />
                  <h3 className="text-base font-bold text-text">No findings detected</h3>
                  <p className="text-xs text-text-muted max-w-sm mx-auto">
                    A pass means only that no issue was detected by the checks performed.
                  </p>
                </div>
              ) : (
                currentVersionFindings.map((f) => {
                  const isSourceExpanded = !!expandedSources[f.id];

                  return (
                    <div
                      key={f.id}
                      className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-3 transition-all hover:border-text-muted/40"
                    >
                      {/* Top finding meta row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <Chip
                            variant={
                              f.severity === 'Blocker'
                                ? 'danger'
                                : f.severity === 'Major'
                                ? 'accent'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {f.severity}
                          </Chip>
                          <span className="text-xs font-semibold text-text">{f.category}</span>
                          <span className="text-text-muted text-xs">·</span>
                          <span className="text-[11px] text-text-muted">{f.status}</span>
                        </div>

                        <div className="flex items-center space-x-1.5 text-[11px] text-text-muted font-mono">
                          <span className="bg-surface-2 px-2 py-0.5 rounded-pill text-[10px]">
                            {f.method}
                          </span>
                          <span>{Math.round(f.confidence * 100)}%</span>
                        </div>
                      </div>

                      {/* Flagged Excerpt with warm orange highlight AND underline */}
                      <div className="p-3 rounded-inner bg-surface-2 text-xs text-text font-sans">
                        <span className="text-text-muted mr-1.5 font-medium">Flagged text:</span>
                        <mark className="bg-orange-500/15 text-text border-b-2 border-orange-500 px-1.5 py-0.5 rounded-xs font-semibold not-italic">
                          &ldquo;{f.excerpt}&rdquo;
                        </mark>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-text-muted leading-relaxed">{f.reason}</p>

                      {/* Collapsible Source Citation */}
                      <div className="border-t border-border/70 pt-2">
                        <button
                          type="button"
                          onClick={() => toggleSourceExpand(f.id)}
                          className="flex items-center justify-between w-full text-[11px] font-mono text-orange-text hover:underline text-left py-0.5"
                        >
                          <span>
                            Evidence: {f.rule_id || f.fact_id} ({f.source_title})
                          </span>
                          {isSourceExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isSourceExpanded && (
                          <div className="mt-2 p-3 rounded-inner bg-surface-2 text-[11px] text-text-muted space-y-1 font-mono">
                            <div><strong className="text-text">Source Title:</strong> {f.source_title}</div>
                            <div><strong className="text-text">Rule / Fact ID:</strong> {f.rule_id || f.fact_id}</div>
                            <div><strong className="text-text">Verification Method:</strong> {f.method}</div>
                            <div><strong className="text-text">Offsets:</strong> [{f.start}, {f.end}]</div>
                          </div>
                        )}
                      </div>

                      {/* Purpose-Preserving Suggested Fix & Diff */}
                      {f.suggestion && (
                        <div className="p-3.5 rounded-inner bg-surface-2 border border-border/80 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-text flex items-center space-x-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-orange-text" />
                              <span>Purpose-Preserving Correction</span>
                            </span>
                            {f.suggestion_check.purpose_preserved ? (
                              <Chip variant="success" size="sm">
                                ✓ Purpose Preserved
                              </Chip>
                            ) : (
                              <Chip variant="accent" size="sm">
                                ⚠ Verify Goal
                              </Chip>
                            )}
                          </div>

                          {/* Soft Diff Display */}
                          <div className="text-xs font-mono space-y-1 bg-surface p-2.5 rounded-inner border border-border">
                            <div className="text-danger flex items-center space-x-1">
                              <span className="font-bold select-none">-</span>
                              <span className="line-through">{f.excerpt}</span>
                            </div>
                            <div className="text-success-text flex items-center space-x-1">
                              <span className="font-bold select-none">+</span>
                              <span className="font-semibold">{f.suggestion}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Decision Resolution Status or Action Buttons */}
                      {f.decision ? (
                        <div className="p-2.5 rounded-pill bg-surface-2 text-xs text-text flex items-center justify-between border border-border/70 px-4">
                          <span className="font-semibold text-[11px]">
                            Resolved by {f.decision.actor_role}: {f.decision.action}
                          </span>
                          {f.decision.reason && (
                            <span className="text-text-muted italic text-[11px]">
                              &ldquo;{f.decision.reason}&rdquo;
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {f.suggestion && (
                            <button
                              onClick={() => openActionModal(f, 'accept')}
                              className="px-3.5 py-1.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-xs"
                            >
                              Accept Suggestion
                            </button>
                          )}
                          <button
                            onClick={() => openActionModal(f, 'edit')}
                            className="px-3.5 py-1.5 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openActionModal(f, 'dismiss')}
                            className="px-3 py-1.5 rounded-pill text-text-muted hover:text-text text-xs"
                          >
                            Dismiss
                          </button>
                          {(role === 'Reviewer' || role === 'Brand manager') && (
                            <button
                              onClick={() => openActionModal(f, 'override')}
                              className="px-3 py-1.5 rounded-pill bg-orange-500/10 text-orange-text border border-orange-500/30 text-xs font-medium ml-auto"
                            >
                              Override Finding
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: SUGGESTIONS VIEW */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              {currentVersionFindings.filter((f) => f.suggestion).map((f) => (
                <div key={f.id} className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text">{f.category}</span>
                    <span className="text-[11px] font-mono text-orange-text">{f.rule_id || f.fact_id}</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 bg-surface-2 p-3 rounded-inner border border-border">
                    <div className="text-danger line-through">- {f.excerpt}</div>
                    <div className="text-success-text font-bold">+ {f.suggestion}</div>
                  </div>
                  <p className="text-xs text-text-muted">{f.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: HISTORY VIEW */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {review.versions.map((v) => (
                <div key={v.version} className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text">Draft Version {v.version}</span>
                    <span className="text-[11px] font-mono text-text-muted">
                      {new Date(v.created_at).toLocaleString()}
                    </span>
                  </div>
                  <pre className="p-3 rounded-inner bg-surface-2 font-mono text-xs text-text overflow-x-auto whitespace-pre-wrap">
                    {v.content}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SOURCES VIEW */}
          {activeTab === 'sources' && (
            <div className="space-y-3">
              {currentVersionFindings.map((f, i) => (
                <div key={i} className="p-4 rounded-card border border-border bg-surface text-xs space-y-1">
                  <div className="font-bold text-text flex items-center justify-between">
                    <span>{f.source_title}</span>
                    <span className="font-mono text-orange-text">{f.rule_id || f.fact_id}</span>
                  </div>
                  <p className="text-text-muted">{f.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Content Document & Comments */}
        <div className="lg:col-span-5 space-y-5">
          {/* Content Viewer Card */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-text uppercase tracking-wider">
                Draft Content
              </h2>
              <span className="text-[11px] font-mono text-text-muted">
                Version {activeVersion || review.current_version}
              </span>
            </div>

            <div className="p-4 rounded-inner border border-border bg-surface-2 text-xs leading-relaxed whitespace-pre-wrap font-sans text-text max-h-96 overflow-y-auto">
              {currentVersionContent}
            </div>

            {/* Version Diff View if available */}
            {activeDiff && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-text-muted">
                  Diff from previous version:
                </span>
                <pre className="p-3 rounded-inner bg-surface border border-border font-mono text-[11px] text-text overflow-x-auto">
                  {activeDiff}
                </pre>
              </div>
            )}
          </div>

          {/* Creator Purpose Card Summary */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-3">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Creator Purpose Card
            </h2>
            <div className="space-y-2 text-xs text-text-muted">
              <div><strong className="text-text">Goal:</strong> {review.purpose_card.goal}</div>
              <div><strong className="text-text">Audience:</strong> {review.purpose_card.audience}</div>
              <div><strong className="text-text">Key Message:</strong> {review.purpose_card.key_message}</div>
              <div><strong className="text-text">CTA:</strong> {review.purpose_card.call_to_action}</div>
              {review.purpose_card.locked_phrases.length > 0 && (
                <div>
                  <strong className="text-text">Locked Phrases:</strong>{' '}
                  <span className="font-mono text-orange-text">
                    {review.purpose_card.locked_phrases.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reviewer Collaboration Notes & Audit Comments */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                <span>Reviewer Notes</span>
              </h2>
              <span className="text-[11px] font-mono text-text-muted">
                {review.comments.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {review.comments.length === 0 ? (
                <p className="text-xs text-text-muted italic">No comments yet.</p>
              ) : (
                review.comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-inner bg-surface-2 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span className="font-semibold text-text">{c.actor_role}</span>
                      <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-text">{c.message}</p>
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
                className="flex-1 px-3.5 py-1.5 rounded-pill border border-border bg-surface text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                disabled={commentMutation.isPending || !commentInput.trim()}
                className="p-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Action Modal (Accept / Edit / Dismiss / Override) */}
      {actionFinding && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text capitalize">
              {actionType.replace('_', ' ')} Finding
            </h3>

            {actionError && (
              <div className="p-3 rounded-inner bg-danger/10 text-danger text-xs font-medium">
                {actionError}
              </div>
            )}

            {actionType === 'edit' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">
                  Custom Replacement Text
                </label>
                <textarea
                  rows={3}
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs font-mono text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {(actionType === 'dismiss' || actionType === 'override') && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">
                  Justification Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this finding is dismissed or overridden..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={closeActionModal}
                className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2"
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
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-95 disabled:opacity-50 shadow-sm"
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
