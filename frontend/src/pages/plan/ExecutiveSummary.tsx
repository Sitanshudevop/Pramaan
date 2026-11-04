import React from 'react';
import { PLAN_DATA } from '../../content/planContent';

export const ExecutiveSummary: React.FC = () => {
  const { executiveSummary, submissionDetails } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">1. Executive Summary</h1>
        <p className="text-sm text-text-muted mt-1">
          Intelligent brand-governance platform for pre-publication content review.
        </p>
      </div>

      {/* Submission details card */}
      <div className="p-4 rounded-card border border-border bg-surface grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-text-muted">Team: </span>
          <span className="font-semibold text-text">{submissionDetails.teamName}</span> ({submissionDetails.teamSize})
        </div>
        <div>
          <span className="text-text-muted">Team Lead: </span>
          <span className="text-text">{submissionDetails.teamLead}</span>
        </div>
      </div>

      {/* Problem & Solution Blocks */}
      <div className="space-y-4 text-xs sm:text-sm text-text leading-relaxed">
        <div className="p-5 rounded-card border border-border bg-surface space-y-2">
          <h2 className="text-sm font-bold text-text">The Problem</h2>
          <p className="text-text-muted">{executiveSummary.problem}</p>
        </div>

        <div className="p-5 rounded-card border border-border bg-surface space-y-2">
          <h2 className="text-sm font-bold text-text">The Solution</h2>
          <p className="text-text-muted">{executiveSummary.solution}</p>
        </div>
      </div>

      {/* Three Commitments */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text">Three Commitments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {executiveSummary.commitments.map((c, i) => (
            <div key={i} className="p-4 rounded-card border border-border bg-surface space-y-1.5 text-xs">
              <div className="font-semibold text-text">{c.title}</div>
              <p className="text-text-muted">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Round 1 Judging Alignment */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text">Judging Alignment (100 Points)</h2>
        <div className="p-4 rounded-card border border-border bg-surface space-y-2 text-xs">
          {executiveSummary.judgingAlignment.map((j, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/50 gap-1 last:border-none last:pb-0">
              <div className="space-y-0.5">
                <span className="font-semibold text-text">{j.criterion}</span>
                <div className="text-[11px] text-text-muted">{j.address}</div>
              </div>
              <span className="font-bold text-accent px-2 py-0.5 rounded bg-accent-soft self-start sm:self-auto">
                {j.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};
