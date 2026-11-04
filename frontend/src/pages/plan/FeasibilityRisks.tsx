import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';

export const FeasibilityRisks: React.FC = () => {
  const { feasibility } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">11. Feasibility & Risk Register</h1>
        <p className="text-sm text-text-muted mt-1">
          Architectural feasibility, practical mitigations, and openly stated technical limitations.
        </p>
      </div>

      {/* Rationale */}
      <section className="p-4 rounded-card border border-border bg-surface text-xs space-y-1.5">
        <h2 className="font-semibold text-text text-sm flex items-center space-x-1.5">
          <CheckCircle className="w-4 h-4 text-accent" />
          <span>Feasibility Rationale</span>
        </h2>
        <p className="text-text-muted leading-relaxed">{feasibility.rationale}</p>
      </section>

      {/* Risk Register Table */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <span>Risk Register & Concrete Mitigations</span>
        </h2>
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-muted border-b border-border text-text font-medium">
              <tr>
                <th className="px-3.5 py-2.5 w-1/3">Identified Risk</th>
                <th className="px-3.5 py-2.5">Built-in Engineering Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {feasibility.risks.map((r, i) => (
                <tr key={i} className="hover:bg-surface-muted/30">
                  <td className="px-3.5 py-2.5 font-medium text-text align-top">{r.risk}</td>
                  <td className="px-3.5 py-2.5 text-text-muted leading-relaxed">{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Known Limitations */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span>Openly Stated Known Limits</span>
        </h2>
        <div className="p-4 rounded-card border border-warning/30 bg-warning/5 text-xs text-text space-y-2">
          {feasibility.knownLimits.map((limit, i) => (
            <div key={i} className="flex items-start space-x-2">
              <span className="text-warning font-bold shrink-0">•</span>
              <p className="text-text-muted leading-relaxed">{limit}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};

