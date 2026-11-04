import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Scale, AlertCircle } from 'lucide-react';

export const EvidenceRegister: React.FC = () => {
  const { evidence } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">3. Evidence Register</h1>
        <p className="text-sm text-text-muted mt-1">
          Empirical signals and published secondary data motivating pre-publication governance.
        </p>
      </div>

      {/* Mandatory Evidence Limit Callout */}
      <div className="p-4 rounded-card border border-warning/30 bg-warning/5 text-xs text-text space-y-1">
        <div className="font-bold flex items-center space-x-1.5 text-warning">
          <AlertCircle className="w-4 h-4" />
          <span>EVIDENCE LIMIT CALLOUT</span>
        </div>
        <p className="text-text-muted leading-relaxed">{evidence.callout}</p>
      </div>

      {/* Evidence Signals as Cards */}
      <div className="space-y-3">
        {evidence.signals.map((sig, i) => (
          <div key={i} className="p-4 rounded-card border border-border bg-surface space-y-2 text-xs">
            <div className="font-semibold text-text text-sm flex items-center space-x-2">
              <Scale className="w-4 h-4 text-accent" />
              <span>{sig.signal}</span>
            </div>
            <p className="text-text font-medium leading-relaxed">{sig.finding}</p>
            <div className="text-[11px] text-text-muted pt-1 border-t border-border/50">
              <span className="font-medium text-text">Source & Limitation: </span>
              {sig.source}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};

