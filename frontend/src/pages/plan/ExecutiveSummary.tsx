import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { GlowBackdrop, Chip } from '../../components/ui';

export const ExecutiveSummary: React.FC = () => {
  const { executiveSummary, submissionDetails } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">1. Executive Summary</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Intelligent brand-governance platform for pre-publication content review.
        </p>
      </div>

      {/* Submission details card */}
      <div className="p-5 rounded-card border border-border bg-surface shadow-floating grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-text-muted">Team: </span>
          <span className="font-bold text-text">{submissionDetails.teamName}</span> ({submissionDetails.teamSize})
        </div>
        <div>
          <span className="text-text-muted">Team Lead: </span>
          <span className="text-text font-medium">{submissionDetails.teamLead}</span>
        </div>
      </div>

      {/* Problem & Solution Blocks */}
      <div className="space-y-4 text-xs sm:text-sm text-text leading-relaxed">
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-2">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">The Problem</h2>
          <p className="text-xs text-text-muted leading-relaxed">{executiveSummary.problem}</p>
        </div>

        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-2">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">The Solution</h2>
          <p className="text-xs text-text-muted leading-relaxed">{executiveSummary.solution}</p>
        </div>
      </div>

      {/* Three Commitments */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">Three Commitments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {executiveSummary.commitments.map((c, i) => (
            <div key={i} className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-1.5 text-xs">
              <div className="font-bold text-text">{c.title}</div>
              <p className="text-text-muted leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Round 1 Judging Alignment */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">Judging Alignment (100 Points)</h2>
        <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-2.5 text-xs">
          {executiveSummary.judgingAlignment.map((j, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/50 gap-2 last:border-none last:pb-0">
              <div className="space-y-0.5">
                <span className="font-bold text-text">{j.criterion}</span>
                <div className="text-[11px] text-text-muted">{j.address}</div>
              </div>
              <Chip variant="accent" size="sm">
                {j.points} pts
              </Chip>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};
