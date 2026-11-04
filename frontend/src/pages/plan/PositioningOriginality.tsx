import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Sparkles, Compass, CheckCircle2 } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const PositioningOriginality: React.FC = () => {
  const { positioning } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">10. Positioning & Originality</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          How Pramaan compares with DAMs, style checkers, and general AI, and what is genuinely new.
        </p>
      </div>

      {/* Genuinely New Innovations */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-orange-text" />
            <span>What is Genuinely New in Pramaan</span>
          </h2>
          <Chip variant="accent" size="sm">4 Original Pillars</Chip>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {positioning.genuinelyNew.map((item, i) => (
            <div key={i} className="p-5 rounded-card border border-orange-500/25 bg-orange-500/5 shadow-floating text-xs space-y-2">
              <div className="font-bold text-orange-text flex items-center space-x-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-text" />
                <span>Pillar {i + 1}</span>
              </div>
              <p className="text-text font-medium leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparative Landscape Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Compass className="w-4 h-4 text-orange-text" />
            <span>Adjacent Category Comparison</span>
          </h2>
          <Chip variant="neutral" size="sm">Competitive Landscape</Chip>
        </div>
        <div className="space-y-3">
          {positioning.comparison.map((c, i) => (
            <div key={i} className="p-5 rounded-card border border-border bg-surface shadow-floating text-xs space-y-3">
              <div className="font-bold text-text text-sm">{c.platform}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-inner bg-surface-2 border border-border/70 space-y-1">
                  <div className="font-semibold text-text-muted text-[11px]">Adjacent Strength</div>
                  <p className="text-text leading-relaxed text-xs">{c.strength}</p>
                </div>
                <div className="p-3.5 rounded-inner bg-orange-500/5 border border-orange-500/20 space-y-1">
                  <div className="font-semibold text-orange-text text-[11px]">What It Lacks (Pramaan Advantage)</div>
                  <p className="text-text leading-relaxed text-xs">{c.gap}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};
