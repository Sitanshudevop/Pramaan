import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { ShieldCheck, FileCheck2 } from 'lucide-react';

export const ResponsibleDesign: React.FC = () => {
  const { responsible } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">9. Responsible Design & Governance</h1>
        <p className="text-sm text-text-muted mt-1">
          Human oversight, privacy and confidentiality, transparency ledgers, and fairness standards.
        </p>
      </div>

      {/* Commitments List */}
      <section className="space-y-3">
        {responsible.areas.map((item, i) => (
          <div key={i} className="p-4 rounded-card border border-border bg-surface text-xs space-y-1.5">
            <div className="font-semibold text-text text-sm flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>{item.area}</span>
            </div>
            <p className="text-text-muted leading-relaxed">{item.commitment}</p>
          </div>
        ))}
      </section>

      {/* Voluntary Reference Frameworks */}
      <section className="p-4 rounded-card border border-border bg-surface-muted space-y-2 text-xs">
        <div className="font-semibold text-text flex items-center space-x-1.5">
          <FileCheck2 className="w-4 h-4 text-accent" />
          <span>Voluntary Reference Frameworks</span>
        </div>
        <p className="text-text-muted leading-relaxed">
          NIST AI Risk Management Framework (AI RMF) for identifying and managing AI verification risks; W3C WCAG 2.2 AA for product UI accessibility and automated contrast checks. (No formal third-party certification claimed).
        </p>
      </section>
    </article>
  );
};
