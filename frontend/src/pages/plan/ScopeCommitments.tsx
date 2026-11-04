import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Target, Star, CheckSquare } from 'lucide-react';

export const ScopeCommitments: React.FC = () => {
  const { scope } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">7. Scope Boundaries & Three Key Commitments</h1>
        <p className="text-sm text-text-muted mt-1">
          MoSCoW milestone boundaries and the three headline product improvements.
        </p>
      </div>

      {/* Three Headline Improvements */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Star className="w-4 h-4 text-accent" />
          <span>Three Committed Product Improvements</span>
        </h2>
        <div className="space-y-3">
          {scope.threeImprovements.map((imp, i) => (
            <div key={i} className="p-4 rounded-card border border-accent/30 bg-accent/5 space-y-1.5 text-xs">
              <div className="font-bold text-accent text-sm">{imp.name}</div>
              <p className="text-text leading-relaxed">{imp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scope Tiers (MoSCoW) */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Target className="w-4 h-4 text-accent" />
          <span>Scope Delivery Tiers</span>
        </h2>
        <div className="space-y-3">
          {scope.tiers.map((t, i) => (
            <div key={i} className="p-4 rounded-card border border-border bg-surface text-xs space-y-1.5">
              <div className="font-semibold text-text flex items-center space-x-1.5 text-sm">
                <CheckSquare className="w-4 h-4 text-accent" />
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

