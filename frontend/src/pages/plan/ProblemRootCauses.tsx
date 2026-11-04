import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { AlertTriangle } from 'lucide-react';

export const ProblemRootCauses: React.FC = () => {
  const { problem } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">2. Problem & Root Causes</h1>
        <p className="text-sm text-text-muted mt-1">
          Pre-publication brand erosion across multi-author and generative AI content workflows.
        </p>
      </div>

      <div className="p-5 rounded-card border border-border bg-surface text-xs sm:text-sm text-text leading-relaxed">
        <h2 className="text-sm font-bold text-text mb-2">2.1 The Problem</h2>
        <p className="text-text-muted">{problem.summary}</p>
      </div>

      {/* Six Risk Vectors as Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text">2.2 Six Vectors of Pre-Publication Risk</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {problem.vectors.map((v, i) => (
            <div key={i} className="p-4 rounded-card border border-border bg-surface space-y-2 text-xs">
              <div className="font-semibold text-text flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                <span>{v.vector}</span>
              </div>
              <div>
                <span className="text-text-muted">Typical Failure: </span>
                <span className="text-text">{v.failure}</span>
              </div>
              <div className="text-[11px] text-text-muted pt-1 border-t border-border/50">
                <span className="font-medium text-text">Impact: </span>
                {v.impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2.3 Root Causes */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-3">
        <h2 className="text-sm font-bold text-text">2.3 Root Causes</h2>
        <ul className="space-y-2 text-xs text-text-muted">
          {problem.rootCauses.map((rc, i) => (
            <li key={i} className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <span>{rc}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};

