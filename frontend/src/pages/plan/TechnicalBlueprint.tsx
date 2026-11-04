import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Terminal, Cpu, Database } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const TechnicalBlueprint: React.FC = () => {
  const { technical } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">8. Technical Blueprint & AI Architecture</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Six-stage hybrid verification pipeline, deterministic safeguards, and proof-or-abstain grounding.
        </p>
      </div>

      {/* Six-Stage Pipeline */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-orange-text" />
            <span>Six-Stage Verification Pipeline</span>
          </h2>
          <Chip variant="accent" size="sm">Hybrid Pipeline</Chip>
        </div>
        <div className="space-y-3">
          {technical.pipeline.map((stage, i) => (
            <div key={i} className="p-5 rounded-card border border-border bg-surface shadow-floating text-xs space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-surface-dark border border-orange-500/80 text-orange-text font-bold flex items-center justify-center text-xs shrink-0">
                  {i + 1}
                </span>
                <span className="font-bold text-text text-sm">{stage.name}</span>
              </div>
              <p className="text-text-muted leading-relaxed pl-8">{stage.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack Summary Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-orange-text" />
            <span>Core Technology Stack Choices</span>
          </h2>
          <Chip variant="neutral" size="sm">Architecture Specs</Chip>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-2">
            <div className="font-bold text-text text-sm">Backend & Engine</div>
            <p className="text-text-muted leading-relaxed">
              Python 3.12, FastAPI, Pydantic v2 (extra=&quot;forbid&quot;), SQLite/PostgreSQL, SQLAlchemy 2, rank_bm25, textstat.
            </p>
          </div>
          <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-2">
            <div className="font-bold text-text text-sm">Frontend Workspace</div>
            <p className="text-text-muted leading-relaxed">
              React 18, TypeScript strict, Vite, Tailwind CSS, TanStack Query, Lucide icons, accessible keyboard focus.
            </p>
          </div>
          <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-2">
            <div className="font-bold text-text text-sm">Security & Integrity</div>
            <p className="text-text-muted leading-relaxed">
              Strict CSP &amp; security headers, PII redaction gateway before AI, server-side RBAC, append-only audit trail.
            </p>
          </div>
          <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-2">
            <div className="font-bold text-text text-sm">Grounding & Evaluation</div>
            <p className="text-text-muted leading-relaxed">
              Deterministic rule matching, BM25 active-set search, Gemini 2.5 Flash with fallback to deterministic NullProvider.
            </p>
          </div>
        </div>
      </section>

      {/* Evaluation and Reliability */}
      <section className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-2 text-xs">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
          <Database className="w-4 h-4 text-orange-text" />
          <span>Evaluation Benchmark Target</span>
        </h2>
        <p className="text-text-muted leading-relaxed text-xs">
          Pramaan’s golden test set includes 22 curated test drafts evaluating claim precision, recall, and zero false positives on clean drafts.
          All findings are validated by an independent post-LLM code verifier that drops invalid citations.
        </p>
      </section>
    </article>
  );
};
