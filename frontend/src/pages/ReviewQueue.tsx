import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inbox, ArrowRight, Plus, CheckCircle2, Download, Trash2, X, Filter } from 'lucide-react';
import { listReviews, submitApproval, deleteReview, getBrandKits, assignReview, listWorkspaceMembers } from '../lib/api';
import { useApp } from '../lib/context';
import { SearchPill, PillSelect, Chip, BottomSheet } from '../components/ui';

export const ReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, user, currentWorkspace, isDemoMode, demoPersona } = useApp();
  const queryClient = useQueryClient();

  const urlStatus = searchParams.get('status') || 'ALL';
  const urlRule = searchParams.get('rule') || '';
  const urlKit = searchParams.get('kit') || 'ALL';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [kitFilter, setKitFilter] = useState(urlKit);
  const [ruleFilter, setRuleFilter] = useState(urlRule);
  const [viewTab, setViewTab] = useState<'all' | 'mine' | 'assigned'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('status')) setStatusFilter(searchParams.get('status')!);
    if (searchParams.get('rule')) setRuleFilter(searchParams.get('rule')!);
    if (searchParams.get('kit')) setKitFilter(searchParams.get('kit')!);
  }, [searchParams]);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', role, currentWorkspace?.id],
    queryFn: () => listReviews(role),
  });

  const { data: brandKits } = useQuery({
    queryKey: ['brandKits', role, currentWorkspace?.id],
    queryFn: () => getBrandKits(role),
  });

  const { data: members } = useQuery({
    queryKey: ['members', currentWorkspace?.id],
    queryFn: () => (currentWorkspace && !currentWorkspace.is_demo ? listWorkspaceMembers(currentWorkspace.id) : Promise.resolve([])),
    enabled: !!currentWorkspace && !currentWorkspace.is_demo,
  });

  const quickApproveMutation = useMutation({
    mutationFn: (reviewId: string) => submitApproval(reviewId, 'Approved', role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to approve review');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to delete review');
    },
  });

  const claimMutation = useMutation({
    mutationFn: (reviewId: string) => assignReview(reviewId, user?.id || (isDemoMode ? demoPersona.id : undefined), role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to assign review');
    },
  });

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'In human review', label: 'In human review' },
    { value: 'overdue', label: 'Overdue SLA (>48h)' },
    { value: 'AI-reviewed', label: 'AI-reviewed' },
    { value: 'Changes requested', label: 'Changes requested' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Exported', label: 'Exported' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  const severityOptions = [
    { value: 'ALL', label: 'All Severities' },
    { value: 'BLOCKERS', label: 'Has Blockers' },
    { value: 'CLEAN', label: 'Clean Only' },
  ];

  const kitOptions = [
    { value: 'ALL', label: 'All Brand Kits' },
    ...(brandKits?.map((k) => ({ value: k.id, label: k.name })) || []),
  ];

  const effectiveUserId = user?.id || (isDemoMode ? demoPersona.id : '');
  const myReviewsCount = (reviews || []).filter((r) => r.creator_id === effectiveUserId).length;
  const assignedCount = (reviews || []).filter((r) => r.assignee_id === effectiveUserId).length;

  // Filtering
  const filteredReviews = (reviews || []).filter((r) => {
    if (viewTab === 'mine' && r.creator_id !== effectiveUserId) return false;
    if (viewTab === 'assigned' && r.assignee_id !== effectiveUserId) return false;
    if (statusFilter === 'overdue' || statusFilter === 'Overdue') {
      if (!r.is_overdue) return false;
    } else if (statusFilter !== 'ALL' && r.status !== statusFilter) {
      return false;
    }
    if (kitFilter !== 'ALL' && r.kit_id !== kitFilter) return false;
    if (ruleFilter && !r.findings.some((f) => f.rule_id === ruleFilter)) return false;

    const blockerCount = r.findings.filter((f) => f.severity === 'Blocker').length;
    if (severityFilter === 'BLOCKERS' && blockerCount === 0) return false;
    if (severityFilter === 'CLEAN' && blockerCount > 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchKit = r.kit_id.toLowerCase().includes(q);
      const matchType = r.content_type.toLowerCase().includes(q);
      const matchRole = r.created_by_role.toLowerCase().includes(q);
      if (!matchId && !matchKit && !matchType && !matchRole) return false;
    }

    return true;
  });

  const activeFiltersCount =
    (statusFilter !== 'ALL' ? 1 : 0) +
    (severityFilter !== 'ALL' ? 1 : 0) +
    (kitFilter !== 'ALL' ? 1 : 0) +
    (ruleFilter ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="space-y-6 max-w-app mx-auto py-2">
      {/* Top Header Row with Title & Primary Pill Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Review Queue</h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Content drafts awaiting human review, overrides, or manager sign-off.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/new')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-pill bg-surface-dark text-white dark:bg-gradient-to-r dark:from-orange-400 dark:to-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Review</span>
        </button>
      </div>

      {/* View Tabs & Kit Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="inline-flex items-center p-1 rounded-pill bg-surface-2 border border-border text-xs">
          <button
            type="button"
            onClick={() => setViewTab('all')}
            className={`px-3 py-1 rounded-pill font-semibold transition-colors ${viewTab === 'all'
                ? 'bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange shadow-xs'
                : 'text-text-muted hover:text-text'
              }`}
          >
            All Reviews ({reviews?.length || 0})
          </button>
          {(user || isDemoMode) && (
            <>
              <button
                type="button"
                onClick={() => setViewTab('mine')}
                className={`px-3 py-1 rounded-pill font-semibold transition-colors ${viewTab === 'mine'
                    ? 'bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange shadow-xs'
                    : 'text-text-muted hover:text-text'
                  }`}
              >
                My Reviews ({myReviewsCount})
              </button>
              <button
                type="button"
                onClick={() => setViewTab('assigned')}
                className={`px-3 py-1 rounded-pill font-semibold transition-colors ${viewTab === 'assigned'
                    ? 'bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange shadow-xs'
                    : 'text-text-muted hover:text-text'
                  }`}
              >
                Assigned to Me ({assignedCount})
              </button>
            </>
          )}
        </div>

        {ruleFilter && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-pill bg-orange-500/10 text-orange-text text-xs border border-orange-500/30">
            <span>Filtering rule: <strong>{ruleFilter}</strong></span>
            <button
              type="button"
              onClick={() => {
                setRuleFilter('');
                setSearchParams((prev) => {
                  prev.delete('rule');
                  return prev;
                });
              }}
              className="p-0.5 hover:opacity-75 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Trigger (< sm) */}
      <div className="flex sm:hidden items-center justify-between gap-2">
        <SearchPill
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Filter reviews..."
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="px-3.5 py-2 rounded-pill border border-border bg-surface hover:bg-surface-2 text-xs font-semibold text-text flex items-center space-x-1.5 touch-target shrink-0"
        >
          <Filter className="w-3.5 h-3.5 text-orange-text" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop & Tablet Inline Filters (>= sm) */}
      <div className="hidden sm:flex flex-wrap items-center gap-3">
        <SearchPill
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Filter reviews by ID, brand, or creator..."
          className="w-full sm:w-72"
        />

        <PillSelect
          value={kitFilter}
          onChange={setKitFilter}
          options={kitOptions}
          ariaLabel="Filter by brand kit"
        />

        <PillSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          ariaLabel="Filter by status"
        />

        <PillSelect
          value={severityFilter}
          onChange={setSeverityFilter}
          options={severityOptions}
          ariaLabel="Filter by severity"
        />
      </div>

      {/* Mobile BottomSheet for Filters */}
      <BottomSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filter Reviews"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-text mb-1.5">Brand Kit</label>
            <PillSelect
              value={kitFilter}
              onChange={setKitFilter}
              options={kitOptions}
              ariaLabel="Filter by brand kit"
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-semibold text-text mb-1.5">Status</label>
            <PillSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              ariaLabel="Filter by status"
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-semibold text-text mb-1.5">Severity</label>
            <PillSelect
              value={severityFilter}
              onChange={setSeverityFilter}
              options={severityOptions}
              ariaLabel="Filter by severity"
              className="w-full"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-border">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setSeverityFilter('ALL');
                setKitFilter('ALL');
                setRuleFilter('');
                setSearchQuery('');
              }}
              className="text-text-muted hover:text-text font-medium"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange font-semibold"
            >
              Apply ({filteredReviews.length} results)
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Table in a White Card with Rounded Rows */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-text-muted font-mono">Loading review queue...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 rounded-card border border-border bg-surface text-center space-y-3 shadow-floating">
          <Inbox className="w-8 h-8 mx-auto text-text-muted" />
          <div className="text-sm font-bold text-text">No active items in queue</div>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            All submitted content has been cleared or approved. You can submit a new sample review anytime.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/app/new')}
              className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold"
            >
              Start New Review
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-card border border-border bg-surface shadow-floating overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Review ID</th>
                  <th className="py-3 px-4">Brand Kit</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Severity Signal</th>
                  <th className="py-3 px-4">Assignee / Creator</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredReviews.map((r) => {
                  const blockerCount = r.findings.filter((f) => f.severity === 'Blocker').length;
                  const majorCount = r.findings.filter((f) => f.severity === 'Major').length;

                  return (
                    <tr
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/app/review/${r.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/app/review/${r.id}`);
                        }
                      }}
                      className="hover:bg-surface-2 transition-colors cursor-pointer group rounded-inner focus:outline-none focus-visible:bg-surface-2"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-text">
                        {r.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-text capitalize">
                        {r.kit_id.replace('-', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-text-muted">
                        {r.content_type}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          {blockerCount > 0 && (
                            <Chip variant="danger" size="sm">
                              {blockerCount} Blocker
                            </Chip>
                          )}
                          {majorCount > 0 && (
                            <Chip variant="accent" size="sm">
                              {majorCount} Major
                            </Chip>
                          )}
                          {blockerCount === 0 && majorCount === 0 && (
                            <Chip variant="success" size="sm">
                              Clean Draft
                            </Chip>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-muted">
                        <span className="font-medium text-text">{r.created_by_role}</span>
                        {r.assignee_id ? (
                          <span className="text-[10px] block text-orange-text font-medium truncate max-w-[120px]">
                            Assigned: {members?.find((m) => m.user_id === r.assignee_id)?.full_name || 'Teammate'}
                          </span>
                        ) : (
                          user && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                claimMutation.mutate(r.id);
                              }}
                              className="text-[10px] block text-orange-text hover:underline font-semibold"
                            >
                              + Claim review
                            </button>
                          )
                        )}
                        <span className="text-[10px] block opacity-70">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Chip
                          variant={
                            r.status === 'Approved'
                              ? 'success'
                              : r.status === 'Changes requested'
                                ? 'accent'
                                : 'neutral'
                          }
                          size="sm"
                        >
                          {r.status}
                        </Chip>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Quick Approve for clean drafts */}
                          {r.status !== 'Approved' && blockerCount === 0 && (role === 'Reviewer' || role === 'Brand manager' || role === 'Admin') && (
                            <button
                              type="button"
                              onClick={() => quickApproveMutation.mutate(r.id)}
                              disabled={quickApproveMutation.isPending}
                              title="Quick approve clean draft"
                              className="px-2.5 py-1 rounded-pill bg-success/10 text-success-text hover:bg-success/20 text-[11px] font-semibold transition-colors flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Certificate link for approved drafts */}
                          {r.status === 'Approved' && (
                            <a
                              href={`/api/reviews/${r.id}/certificate`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View and download proof certificate"
                              className="p-1.5 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 text-orange-text" />
                            </a>
                          )}

                          {/* Delete review for Admin or Brand manager */}
                          {(role === 'Brand manager' || role === 'Admin') && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete review ${r.id}?`)) {
                                  deleteReviewMutation.mutate(r.id);
                                }
                              }}
                              disabled={deleteReviewMutation.isPending}
                              title="Delete review from queue"
                              className="p-1.5 rounded-pill text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Details inspect arrow */}
                          <span
                            onClick={() => navigate(`/app/review/${r.id}`)}
                            title="Open review workspace"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-pill bg-surface-2 text-text-muted group-hover:bg-text group-hover:text-bg transition-colors"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden space-y-3">
            {filteredReviews.map((r) => {
              const blockerCount = r.findings.filter((f) => f.severity === 'Blocker').length;

              return (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/app/review/${r.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/app/review/${r.id}`);
                    }
                  }}
                  className="p-4 rounded-inner bg-surface-2 border border-border/80 space-y-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-orange-text">{r.id}</span>
                    <Chip variant={r.status === 'Approved' ? 'success' : 'neutral'} size="sm">
                      {r.status}
                    </Chip>
                  </div>
                  <div className="text-xs text-text font-semibold capitalize">
                    {r.kit_id.replace('-', ' ')} · {r.content_type}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                    <span>By {r.created_by_role}</span>
                    {blockerCount > 0 ? (
                      <span className="text-danger font-semibold">{blockerCount} Blocker</span>
                    ) : (
                      <span className="text-success-text">Clean Draft</span>
                    )}
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                    {r.status !== 'Approved' && blockerCount === 0 && (role === 'Reviewer' || role === 'Brand manager' || role === 'Admin') && (
                      <button
                        type="button"
                        onClick={() => quickApproveMutation.mutate(r.id)}
                        className="px-2.5 py-1 rounded-pill bg-success/10 text-success-text text-[11px] font-semibold"
                      >
                        Quick Approve
                      </button>
                    )}
                    {r.status === 'Approved' && (
                      <a
                        href={`/api/reviews/${r.id}/certificate`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-orange-text"
                      >
                        Certificate
                      </a>
                    )}
                    {(role === 'Brand manager' || role === 'Admin') && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete review ${r.id}?`)) {
                            deleteReviewMutation.mutate(r.id);
                          }
                        }}
                        className="text-[11px] text-danger"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
