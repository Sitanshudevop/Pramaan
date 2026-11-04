import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const FeasibilityRisks: React.FC = () => {
  const { feasibility } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">11. Feasibility & Risk Register</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Architectural feasibility, practical mitigations, and openly stated technical limitations.
        </p>
      </div>

      {/* Rationale */}
      <section className="p-6 rounded-card border border-border bg-surface shadow-floating text-xs space-y-2">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-orange-text" />
          <span>Feasibility Rationale</span>
        </h2>
        <p className="text-text-muted leading-relaxed text-xs">{feasibility.rationale}</p>
      </section>

      {/* Risk Register Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-text" />
            <span>Risk Register & Concrete Mitigations</span>
          </h2>
          <Chip variant="neutral" size="sm">5 Risk Entries</Chip>
        </div>
        <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-floating">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 border-b border-border text-text-muted font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-1/3">Identified Risk</th>
                <th className="px-4 py-3">Built-in Engineering Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {feasibility.risks.map((r, i) => (
                <tr key={i} className="hover:bg-surface-2/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-text align-top">{r.risk}</td>
                  <td className="px-4 py-3 text-text-muted leading-relaxed">{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Known Limitations */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-orange-text" />
            <span>Openly Stated Known Limits</span>
          </h2>
          <Chip variant="accent" size="sm">Transparency</Chip>
        </div>
        <div className="p-5 rounded-card border border-orange-500/25 bg-orange-500/5 shadow-floating text-xs text-text space-y-2.5">
          {feasibility.knownLimits.map((limit, i) => (
            <div key={i} className="flex items-start space-x-2.5">
              <span className="text-orange-text font-bold shrink-0">•</span>
              <p className="text-text-muted leading-relaxed">{limit}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};
