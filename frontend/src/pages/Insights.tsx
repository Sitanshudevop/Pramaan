import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Info, RefreshCw, ArrowRight, BarChart2 } from 'lucide-react';
import { getInsights, getBrandKits } from '../lib/api';
import { useApp } from '../lib/context';
import { GaugeCard, BarChart, PillSelect, Chip, StatCard } from '../components/ui';

export const Insights: React.FC = () => {
  const { role, setRole, isDemoMode } = useApp();
  const [selectedKit, setSelectedKit] = useState<string>('');

  const { data: kits } = useQuery({
    queryKey: ['brandKits', role],
    queryFn: () => getBrandKits(role),
  });

  const { data: insights, isLoading, error, refetch } = useQuery({
    queryKey: ['insights', role, selectedKit],
    queryFn: () => getInsights(role, selectedKit || undefined),
    retry: false,
  });

  const kitOptions = [
    { value: '', label: 'All Brand Kits' },
    ...(kits?.map((k) => ({ value: k.id, label: k.name })) || []),
  ];

  // Calculate overall Rule Clarity Score from unclear rules
  const avgAmbiguity =
    insights?.unclear_rules && insights.unclear_rules.length > 0
      ? insights.unclear_rules.reduce((acc, r) => acc + r.ambiguity_score, 0) /
        insights.unclear_rules.length
      : 0.18;
  const clarityScore = Math.round((1 - avgAmbiguity) * 100);

  // Map top repeated violations into BarChart items
  const barChartData =
    insights?.top_repeated_violations.slice(0, 5).map((v) => ({
      label: v.rule_id,
      value: v.count,
    })) || [];

  return (
    <div className="space-y-6 max-w-app mx-auto py-2">
      {/* Title & Brand Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Brand Insights & Radar</h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Aggregate compliance trends, repeated exceptions, and rule ambiguity detection.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <PillSelect
            value={selectedKit}
            onChange={setSelectedKit}
            options={kitOptions}
            ariaLabel="Filter by brand kit"
          />
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh analytics data"
            className="p-2 rounded-pill border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mandatory Simulated Data Disclosure Banner ONLY in Demo Workspace */}
      {isDemoMode && (
        <div className="p-4 rounded-card border border-border bg-surface-2 flex items-start space-x-3 text-xs text-text-muted">
          <Info className="w-4 h-4 text-orange-text mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-text">Simulated Data Disclosure: </span>
            <span>{insights?.simulated_notice || 'Demo workspace: Insights are populated with 120 simulated review events for demonstration.'}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-24 text-center text-xs text-text-muted font-mono">
          Aggregating governance metrics...
        </div>
      ) : role === 'Creator' || error ? (
        <div className="p-8 rounded-card border border-border bg-surface text-center space-y-4 shadow-floating max-w-lg mx-auto">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-text flex items-center justify-center mx-auto">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text">Governance Insights Restricted</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Aggregate compliance radar and ambiguity scores require <strong>Reviewer</strong>, <strong>Brand manager</strong>, or <strong>Admin</strong> permissions.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center space-x-3">
            <button
              type="button"
              onClick={() => setRole('Reviewer')}
              className="px-4 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-sm"
            >
              Switch to Reviewer Role
            </button>
            {error && (
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium"
              >
                Retry Request
              </button>
            )}
          </div>
        </div>
      ) : !isDemoMode && (!insights || insights.total_events < 10) ? (
        <div className="p-12 rounded-card border border-border bg-surface text-center space-y-3 shadow-floating max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-text flex items-center justify-center mx-auto">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-text">
            Not enough data yet ({insights?.total_events || 0}/10 reviews)
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Insights and rule ambiguity scores are computed strictly from real reviews in your workspace. Run at least 10 reviews to view compliance trends, repeated violations, and ambiguity radar.
          </p>
          <div className="pt-2">
            <Link
              to="/app/new"
              className="px-5 py-2.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-sm inline-flex items-center space-x-1.5"
            >
              <span>Run a review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : !insights ? (
        <div className="p-8 rounded-card border border-border bg-surface text-center text-xs text-text-muted">
          No metrics available.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Row: Dark GaugeCard + BarChart Card + StatCard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Dark GaugeCard (4 cols) */}
            <div className="lg:col-span-4">
              <GaugeCard
                value={clarityScore}
                max={100}
                unit="%"
                label="Overall Rule Clarity"
                caption="Calculated from override rate & reviewer consensus across simulated reviews."
                className="h-full"
              />
            </div>

            {/* BarChart of Top Repeated Violations (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-card border border-border bg-surface shadow-floating flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-text uppercase tracking-wider">
                    Repeated Violations
                  </h2>
                  <p className="text-[11px] text-text-muted">Rule hit frequency</p>
                </div>
                {isDemoMode && (
                  <Chip variant="neutral" size="sm">
                    Demo data is fictional
                  </Chip>
                )}
              </div>

              <div className="my-2">
                <BarChart data={barChartData} height={140} unit="hits" />
              </div>

              <div className="text-[10px] text-text-muted border-t border-border/60 pt-2 flex justify-between">
                <span>Top violated policies</span>
                <span>Click a rule to inspect queue</span>
              </div>
            </div>

            {/* Total Override Events StatCard (3 cols) */}
            <div className="lg:col-span-3 flex flex-col justify-between">
              <StatCard
                label="Total Review Events"
                value={insights.total_events}
                hint="Computed across workspace reviews"
                className="h-full"
              >
                <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Active kits:</span>
                  <Link to="/app/hub" className="font-semibold text-orange-text hover:underline">
                    2 Brands
                  </Link>
                </div>
              </StatCard>
            </div>
          </div>

          {/* Section: Unclear Guidelines (Ambiguity Radar) */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/70">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold text-text">
                    Guideline Ambiguity Radar
                  </h2>
                  {isDemoMode && (
                    <Chip variant="accent" size="sm">
                      Demo data is fictional
                    </Chip>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Rules with high override rates where reviewers frequently disagree with standard policy.
                </p>
              </div>
              <span className="text-[11px] font-mono text-orange-text font-semibold">
                Higher % = Lower guideline clarity
              </span>
            </div>

            <div className="space-y-3">
              {insights.unclear_rules.map((item) => (
                <div
                  key={item.rule_id}
                  className="p-4 rounded-inner border border-border/80 bg-surface-2 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Link to={`/app/queue?rule=${item.rule_id}`}>
                        <Chip variant="accent" size="sm" className="hover:opacity-80">
                          {item.rule_id}
                        </Chip>
                      </Link>
                      <span className="font-bold text-text">{item.rule_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-pill bg-surface text-text-muted border border-border/60">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className="text-text-muted text-[11px]">Ambiguity:</span>
                      <span className="px-2 py-0.5 rounded-pill bg-orange-500/15 text-orange-text font-bold text-xs">
                        {(item.ambiguity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-text-muted leading-relaxed">
                    <strong className="text-text font-medium">Recommended update: </strong>
                    {item.recommendation}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-text-muted pt-1 border-t border-border/40">
                    <div className="flex space-x-4">
                      <Link to={`/app/queue?rule=${item.rule_id}`} className="hover:text-text hover:underline">
                        Violations detected: {item.violation_count}
                      </Link>
                      <span>·</span>
                      <Link to={`/app/queue?rule=${item.rule_id}`} className="hover:text-text hover:underline">
                        Reviewer overrides: {item.override_count}
                      </Link>
                    </div>
                    <Link
                      to={item.rule_id === 'TERM-002' ? '/app/hub?kit=kettle-and-co&rule=TERM-002-v2' : `/app/hub?rule=${item.rule_id}`}
                      className="inline-flex items-center space-x-1 text-orange-text hover:underline font-semibold"
                    >
                      <span>Edit in Brand Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Most Overridden Rules */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-text">Reviewer Override Patterns</h2>
                {isDemoMode && (
                  <Chip variant="neutral" size="sm">
                    Demo data is fictional
                  </Chip>
                )}
              </div>
              <span className="text-[11px] text-text-muted">Human overrides recorded</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.most_overridden_rules.map((item, idx) => (
                <div
                  key={item.rule_id}
                  className="p-4 rounded-inner border border-border/80 bg-surface-2 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-text flex items-center space-x-2">
                      <span className="font-mono text-orange-text">#{idx + 1}</span>
                      <span>{item.rule_name}</span>
                    </div>
                    <Chip variant="neutral" size="sm">
                      {item.override_count} overrides
                    </Chip>
                  </div>
                  {item.reasons.length > 0 && (
                    <div className="text-[11px] text-text-muted italic bg-surface p-2.5 rounded-inner border border-border/60">
                      &ldquo;{item.reasons[0]}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
