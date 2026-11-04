import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Inbox, ArrowRight } from 'lucide-react';
import { listReviews } from '../lib/api';
import { useApp } from '../lib/context';

export const ReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useApp();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', role],
    queryFn: () => listReviews(role),
  });

  return (
    <div className="space-y-6 max-w-app mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Review Queue</h1>
          <p className="text-sm text-text-muted mt-1">
            Pre-publication submissions pending reviewer assessment, overrides, or manager sign-off.
          </p>
        </div>
        <button
          onClick={() => navigate('/app/new')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-btn bg-accent text-white text-xs font-medium hover:opacity-95"
        >
          <span>Submit New Draft</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-text-muted">Loading queue...</div>
      ) : !reviews || reviews.length === 0 ? (
        <div className="p-8 rounded-card border border-border bg-surface text-center space-y-3">
          <Inbox className="w-8 h-8 mx-auto text-text-muted" />
          <div className="text-sm font-semibold text-text">No active items in queue</div>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            All submitted content has been cleared or approved. You can submit a new sample review anytime.
          </p>
          <button
            onClick={() => navigate('/app/new')}
            className="px-4 py-2 rounded-btn border border-border text-xs font-medium text-text hover:bg-surface-2"
          >
            Start a Review
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const blockerCount = r.findings.filter((f) => f.severity === 'Blocker').length;
            const majorCount = r.findings.filter((f) => f.severity === 'Major').length;

            return (
              <div
                key={r.id}
                onClick={() => navigate(`/app/review/${r.id}`)}
                className="p-4 rounded-card border border-border bg-surface hover:border-accent/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-mono text-accent font-semibold">{r.id}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text font-medium">{r.kit_id}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-muted">{r.content_type}</span>
                  </div>
                  <div className="text-xs text-text-muted">
                    Version {r.current_version} · Submitted by {r.created_by_role} on{' '}
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Finding Counts */}
                  <div className="flex items-center space-x-1.5 text-xs">
                    {blockerCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-danger/10 text-danger font-medium text-[11px]">
                        {blockerCount} Blocker
                      </span>
                    )}
                    {majorCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-warning/10 text-warning font-medium text-[11px]">
                        {majorCount} Major
                      </span>
                    )}
                    {blockerCount === 0 && majorCount === 0 && (
                      <span className="px-2 py-0.5 rounded bg-success/10 text-success font-medium text-[11px]">
                        Clean Draft
                      </span>
                    )}
                  </div>

                  {/* Workflow Status */}
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      r.status === 'Approved'
                        ? 'bg-success/15 text-success'
                        : r.status === 'Changes requested'
                        ? 'bg-warning/15 text-warning'
                        : 'bg-surface-2 text-text-muted'
                    }`}
                  >
                    {r.status}
                  </span>

                  <ArrowRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
