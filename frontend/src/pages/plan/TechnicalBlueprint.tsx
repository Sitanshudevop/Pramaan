import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Terminal, Cpu, Database } from 'lucide-react';

export const TechnicalBlueprint: React.FC = () => {
  const { technical } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">8. Technical Blueprint & AI Architecture</h1>
        <p className="text-sm text-text-muted mt-1">
          Six-stage hybrid verification pipeline, deterministic safeguards, and proof-or-abstain grounding.
        </p>
      </div>

      {/* Six-Stage Pipeline */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-accent" />
          <span>Six-Stage Verification Pipeline</span>
        </h2>
        <div className="space-y-3">
          {technical.pipeline.map((stage, i) => (
            <div key={i} className="p-4 rounded-card border border-border bg-surface text-xs space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded bg-accent/10 text-accent font-bold flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                <span className="font-semibold text-text text-sm">{stage.name}</span>
              </div>
              <p className="text-text-muted leading-relaxed pl-7">{stage.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack Summary Grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-accent" />
          <span>Core Technology Stack Choices</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-card border border-border bg-surface space-y-1">
            <div className="font-semibold text-text">Backend & Engine</div>
            <p className="text-text-muted">
              Python 3.12, FastAPI, Pydantic v2 (extra=&quot;forbid&quot;), SQLite/PostgreSQL, SQLAlchemy 2, rank_bm25, textstat.
            </p>
          </div>
          <div className="p-4 rounded-card border border-border bg-surface space-y-1">
            <div className="font-semibold text-text">Frontend Workspace</div>
            <p className="text-text-muted">
              React 18, TypeScript strict, Vite, Tailwind CSS, TanStack Query, Lucide icons, accessible keyboard focus.
            </p>
          </div>
          <div className="p-4 rounded-card border border-border bg-surface space-y-1">
            <div className="font-semibold text-text">Security & Integrity</div>
            <p className="text-text-muted">
              Strict CSP &amp; security headers, PII redaction gateway before AI, server-side RBAC, append-only audit trail.
            </p>
          </div>
          <div className="p-4 rounded-card border border-border bg-surface space-y-1">
            <div className="font-semibold text-text">Grounding & Evaluation</div>
            <p className="text-text-muted">
              Deterministic rule matching, BM25 active-set search, Gemini 2.5 Flash with fallback to deterministic NullProvider.
            </p>
          </div>
        </div>
      </section>

      {/* Evaluation and Reliability */}
      <section className="p-4 rounded-card border border-border bg-surface space-y-2 text-xs">
        <h2 className="font-semibold text-text flex items-center space-x-2">
          <Database className="w-4 h-4 text-accent" />
          <span>Evaluation Benchmark Target</span>
        </h2>
        <p className="text-text-muted leading-relaxed">
          Pramaan’s golden test set includes 22 curated test drafts evaluating claim precision, recall, and zero false positives on clean drafts.
          All findings are validated by an independent post-LLM code verifier that drops invalid citations.
        </p>
      </section>
    </article>
  );
};
