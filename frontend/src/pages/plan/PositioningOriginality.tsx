import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Sparkles, Compass, CheckCircle2 } from 'lucide-react';

export const PositioningOriginality: React.FC = () => {
  const { positioning } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">10. Positioning & Originality</h1>
        <p className="text-sm text-text-muted mt-1">
          How Pramaan compares with DAMs, style checkers, and general AI, and what is genuinely new.
        </p>
      </div>

      {/* Genuinely New Innovations */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>What is Genuinely New in Pramaan</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {positioning.genuinelyNew.map((item, i) => (
            <div key={i} className="p-4 rounded-card border border-accent/30 bg-accent/5 text-xs space-y-1">
              <div className="font-semibold text-accent flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                <span>Capability {i + 1}</span>
              </div>
              <p className="text-text font-medium leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparative Landscape Table */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Compass className="w-4 h-4 text-accent" />
          <span>Adjacent Category Comparison</span>
        </h2>
        <div className="space-y-3">
          {positioning.comparison.map((c, i) => (
            <div key={i} className="p-4 rounded-card border border-border bg-surface text-xs space-y-2">
              <div className="font-semibold text-text text-sm">{c.platform}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded bg-surface-muted border border-border/40">
                  <div className="font-medium text-text text-[11px] mb-1">Adjacent Strength</div>
                  <p className="text-text-muted leading-relaxed">{c.strength}</p>
                </div>
                <div className="p-2.5 rounded bg-warning/5 border border-warning/20">
                  <div className="font-medium text-warning text-[11px] mb-1">What It Lacks (Pramaan Advantage)</div>
                  <p className="text-text leading-relaxed">{c.gap}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};

