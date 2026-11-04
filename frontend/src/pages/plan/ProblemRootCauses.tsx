import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { AlertTriangle } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const ProblemRootCauses: React.FC = () => {
  const { problem } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">2. Problem & Root Causes</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Pre-publication brand erosion across multi-author and generative AI content workflows.
        </p>
      </div>

      <div className="p-6 rounded-card border border-border bg-surface shadow-floating text-xs sm:text-sm text-text leading-relaxed space-y-2">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">2.1 The Problem</h2>
        <p className="text-xs text-text-muted leading-relaxed">{problem.summary}</p>
      </div>

      {/* Six Risk Vectors as Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider">2.2 Six Vectors of Pre-Publication Risk</h2>
          <Chip variant="neutral" size="sm">6 Risk Vectors</Chip>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {problem.vectors.map((v, i) => (
            <div key={i} className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-2 text-xs">
              <div className="font-semibold text-text flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-text flex-shrink-0" />
                <span>{v.vector}</span>
              </div>
              <div>
                <span className="text-text-muted">Typical Failure: </span>
                <span className="text-text font-medium">{v.failure}</span>
              </div>
              <div className="text-[11px] text-text-muted pt-2 border-t border-border/50">
                <span className="font-medium text-text">Impact: </span>
                {v.impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2.3 Root Causes */}
      <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">2.3 Root Causes</h2>
        <ul className="space-y-2 text-xs text-text-muted">
          {problem.rootCauses.map((rc, i) => (
            <li key={i} className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
              <span className="leading-relaxed">{rc}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};
