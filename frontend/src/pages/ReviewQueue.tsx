import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Inbox, ArrowRight, Plus } from 'lucide-react';
import { listReviews } from '../lib/api';
import { useApp } from '../lib/context';
import { SearchPill, PillSelect, Chip } from '../components/ui';

export const ReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', role],
    queryFn: () => listReviews(role),
  });

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'AI-reviewed', label: 'AI-reviewed' },
    { value: 'Changes requested', label: 'Changes requested' },
    { value: 'Approved', label: 'Approved' },
  ];

  const severityOptions = [
    { value: 'ALL', label: 'All Severities' },
    { value: 'BLOCKERS', label: 'Has Blockers' },
    { value: 'CLEAN', label: 'Clean Only' },
  ];

  // Filtering
  const filteredReviews = (reviews || []).filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

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

      {/* Filter Row: SearchPill and PillSelects */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchPill
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Filter reviews by ID, brand, or creator..."
          className="w-full sm:w-72"
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
                  <th className="py-3 px-4 text-right">Action</th>
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
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-pill bg-surface-2 text-text-muted group-hover:bg-text group-hover:text-bg transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
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
                  className="p-4 rounded-inner bg-surface-2 border border-border/80 space-y-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
