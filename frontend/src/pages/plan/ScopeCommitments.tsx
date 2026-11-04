import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Target, Star, CheckSquare } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const ScopeCommitments: React.FC = () => {
  const { scope } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">7. Scope Boundaries & Three Key Commitments</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          MoSCoW milestone boundaries and the three headline product improvements.
        </p>
      </div>

      {/* Three Headline Improvements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Star className="w-4 h-4 text-orange-text" />
            <span>Three Committed Product Improvements</span>
          </h2>
          <Chip variant="accent" size="sm">Core Differentiators</Chip>
        </div>
        <div className="space-y-3">
          {scope.threeImprovements.map((imp, i) => (
            <div key={i} className="p-5 rounded-card border border-orange-500/25 bg-orange-500/5 shadow-floating space-y-2 text-xs">
              <div className="font-bold text-orange-text text-sm">{imp.name}</div>
              <p className="text-text leading-relaxed">{imp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scope Tiers (MoSCoW) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Target className="w-4 h-4 text-orange-text" />
            <span>Scope Delivery Tiers (MoSCoW)</span>
          </h2>
          <Chip variant="neutral" size="sm">5 Milestone Tiers</Chip>
        </div>
        <div className="space-y-3">
          {scope.tiers.map((t, i) => (
            <div key={i} className="p-5 rounded-card border border-border bg-surface shadow-floating text-xs space-y-2">
              <div className="font-bold text-text flex items-center space-x-2 text-sm">
                <CheckSquare className="w-4 h-4 text-orange-text shrink-0" />
                <span>{t.tier}</span>
              </div>
              <p className="text-text-muted leading-relaxed">{t.features}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};
