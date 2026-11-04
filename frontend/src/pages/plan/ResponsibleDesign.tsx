import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { ShieldCheck, FileCheck2 } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const ResponsibleDesign: React.FC = () => {
  const { responsible } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">9. Responsible Design & Governance</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Human oversight, privacy and confidentiality, transparency ledgers, and fairness standards.
        </p>
      </div>

      {/* Commitments List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-orange-text" />
            <span>Governance Commitments</span>
          </h2>
          <Chip variant="neutral" size="sm">6 Pillars</Chip>
        </div>
        <div className="space-y-3">
          {responsible.areas.map((item, i) => (
            <div key={i} className="p-5 rounded-card border border-border bg-surface shadow-floating text-xs space-y-2">
              <div className="font-bold text-text text-sm flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span>{item.area}</span>
              </div>
              <p className="text-text-muted leading-relaxed pl-4">{item.commitment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Voluntary Reference Frameworks */}
      <section className="p-5 rounded-card border border-border bg-surface-2 space-y-2 text-xs">
        <div className="font-bold text-text flex items-center space-x-2">
          <FileCheck2 className="w-4 h-4 text-orange-text" />
          <span>Voluntary Reference Frameworks</span>
        </div>
        <p className="text-text-muted leading-relaxed">
          NIST AI Risk Management Framework (AI RMF) for identifying and managing AI verification risks; W3C WCAG 2.2 AA for product UI accessibility and automated contrast checks. (No formal third-party certification claimed).
        </p>
      </section>
    </article>
  );
};
