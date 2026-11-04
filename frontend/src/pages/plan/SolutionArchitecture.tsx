import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Layers, Shield, CheckCircle2, Cpu } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const SolutionArchitecture: React.FC = () => {
  const { solution } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">5. Proposed Solution & Architecture</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Guiding product principles, system modules, and the 8 pre-publication detection categories.
        </p>
      </div>

      {/* Guiding Principles */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
          <Shield className="w-4 h-4 text-orange-text" />
          <span>Non-Negotiable Product Principles</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {solution.principles.map((p, i) => (
            <div key={i} className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-2 text-xs">
              <div className="font-bold text-text text-sm flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-orange-text shrink-0" />
                <span>{p.principle}</span>
              </div>
              <p className="text-text-muted leading-relaxed">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Functional Modules */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-orange-text" />
            <span>Core System Modules</span>
          </h2>
          <Chip variant="neutral" size="sm">5 Modules</Chip>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {solution.modules.map((m, i) => (
            <div key={i} className="p-4 rounded-card border border-border bg-surface shadow-floating text-xs space-y-1.5">
              <div className="font-bold text-text">{m.module}</div>
              <p className="text-text-muted leading-relaxed">{m.capability}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8 Detection Categories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-orange-text" />
            <span>The Eight Detection Categories</span>
          </h2>
          <Chip variant="accent" size="sm">8 Engine Categories</Chip>
        </div>
        <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-floating">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 border-b border-border text-text-muted font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Checking Method</th>
                <th className="px-4 py-3">Grounding Source & Limitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {solution.detectionCategories.map((c, i) => (
                <tr key={i} className="hover:bg-surface-2/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-text whitespace-nowrap">{c.category}</td>
                  <td className="px-4 py-3 text-text-muted">{c.method}</td>
                  <td className="px-4 py-3 text-text-muted">{c.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
};
