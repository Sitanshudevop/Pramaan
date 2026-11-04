import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Layers, Shield, CheckCircle2, Cpu } from 'lucide-react';

export const SolutionArchitecture: React.FC = () => {
  const { solution } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">5. Proposed Solution & Architecture</h1>
        <p className="text-sm text-text-muted mt-1">
          Guiding product principles, system modules, and the 8 pre-publication detection categories.
        </p>
      </div>

      {/* Guiding Principles */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Shield className="w-4 h-4 text-accent" />
          <span>Non-Negotiable Product Principles</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {solution.principles.map((p, i) => (
            <div key={i} className="p-4 rounded-card border border-border bg-surface space-y-1.5 text-xs">
              <div className="font-semibold text-text text-sm flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                <span>{p.principle}</span>
              </div>
              <p className="text-text-muted leading-relaxed">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Functional Modules */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Layers className="w-4 h-4 text-accent" />
          <span>Core System Modules</span>
        </h2>
        <div className="space-y-2">
          {solution.modules.map((m, i) => (
            <div key={i} className="p-3.5 rounded-card border border-border bg-surface text-xs space-y-1">
              <div className="font-semibold text-text">{m.module}</div>
              <p className="text-text-muted leading-relaxed">{m.capability}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8 Detection Categories */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-accent" />
          <span>The Eight Detection Categories</span>
        </h2>
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-muted border-b border-border text-text font-medium">
              <tr>
                <th className="px-3.5 py-2.5">Category</th>
                <th className="px-3.5 py-2.5">Checking Method</th>
                <th className="px-3.5 py-2.5">Grounding Source & Limitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {solution.detectionCategories.map((c, i) => (
                <tr key={i} className="hover:bg-surface-muted/30">
                  <td className="px-3.5 py-2.5 font-medium text-text whitespace-nowrap">{c.category}</td>
                  <td className="px-3.5 py-2.5 text-text-muted">{c.method}</td>
                  <td className="px-3.5 py-2.5 text-text-muted">{c.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
};

