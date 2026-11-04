import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { getInsights, getBrandKits } from '../lib/api';
import { useApp } from '../lib/context';

export const Insights: React.FC = () => {
  const { role } = useApp();
  const [selectedKit, setSelectedKit] = useState<string>('');

  const { data: kits } = useQuery({
    queryKey: ['brandKits', role],
    queryFn: () => getBrandKits(role),
  });

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights', role, selectedKit],
    queryFn: () => getInsights(role, selectedKit || undefined),
  });

  return (
    <div className="space-y-8 max-w-app mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Brand Insights & Governance</h1>
          <p className="text-sm text-text-muted mt-1">
            Aggregate compliance trends, repeated exceptions, and rule ambiguity detection.
          </p>
        </div>

        {/* Filter by kit */}
        <div>
          <label htmlFor="insights-kit-filter" className="sr-only">Filter by Brand Kit</label>
          <select
            id="insights-kit-filter"
            value={selectedKit}
            onChange={(e) => setSelectedKit(e.target.value)}
            className="px-3 py-1.5 rounded-btn border border-border bg-surface text-xs font-medium text-text focus:ring-1 focus:ring-accent"
          >
            <option value="">All Brands</option>
            {kits?.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Honesty Banner for Simulated Seed Data */}
      <div className="p-4 rounded-card border border-border bg-surface-2 flex items-start space-x-3 text-xs text-text-muted">
        <Info className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold text-text">Simulated Data Disclosure: </span>
          <span>{insights?.simulated_notice || 'Insights are populated with simulated review events for demonstration.'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-text-muted">Aggregating governance metrics...</div>
      ) : !insights ? (
        <div className="p-8 rounded-card border border-border bg-surface text-center text-xs text-text-muted">
          No metrics available.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Rule Ambiguity Index */}
          <div className="p-5 rounded-card border border-border bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text">Unclear Guidelines (Ambiguity Score)</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Rules with high override rates where reviewers frequently disagree with standard policy.
                </p>
              </div>
              <span className="text-[11px] font-mono text-accent">Higher score = Higher ambiguity</span>
            </div>

            <div className="space-y-3">
              {insights.unclear_rules.map((item) => (
                <div
                  key={item.rule_id}
                  className="p-3.5 rounded-btn border border-border bg-surface-2 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-accent">{item.rule_id}</span>
                      <span className="font-semibold text-text">{item.rule_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-muted">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-warning">
                        Ambiguity: {(item.ambiguity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-text-muted">{item.recommendation}</p>

                  <div className="text-[11px] text-text-muted flex space-x-4 pt-1">
                    <span>Violations detected: {item.violation_count}</span>
                    <span>Reviewer overrides: {item.override_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Two Columns (Repeated Violations & Overridden Rules) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Repeated Violations */}
            <div className="p-5 rounded-card border border-border bg-surface space-y-4">
              <h2 className="text-sm font-bold text-text">Top Repeated Violations</h2>
              <div className="space-y-2.5">
                {insights.top_repeated_violations.map((item, idx) => (
                  <div
                    key={item.rule_id}
                    className="p-3 rounded-btn border border-border bg-surface-2 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-text flex items-center space-x-1.5">
                        <span className="text-text-muted font-mono">#{idx + 1}</span>
                        <span>{item.rule_name}</span>
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {item.rule_id} · {item.category}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-danger/10 text-danger font-bold text-xs">
                      {item.count} hits
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Overridden Rules */}
            <div className="p-5 rounded-card border border-border bg-surface space-y-4">
              <h2 className="text-sm font-bold text-text">Most Overridden Rules</h2>
              <div className="space-y-2.5">
                {insights.most_overridden_rules.map((item, idx) => (
                  <div
                    key={item.rule_id}
                    className="p-3 rounded-btn border border-border bg-surface-2 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-text flex items-center space-x-1.5">
                        <span className="text-text-muted font-mono">#{idx + 1}</span>
                        <span>{item.rule_name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-warning/10 text-warning font-semibold text-[11px]">
                        {item.override_count} overrides
                      </span>
                    </div>
                    {item.reasons.length > 0 && (
                      <div className="text-[11px] text-text-muted italic">
                        Sample reason: &ldquo;{item.reasons[0]}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
