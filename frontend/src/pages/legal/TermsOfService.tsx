import React from 'react';
import { BookOpen } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div className="space-y-2 border-b border-border pb-4">
        <div className="flex items-center space-x-2 text-orange-text text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl font-extrabold text-text tracking-tight">Terms of Service</h1>
        <p className="text-xs text-text-muted">Last updated: November 2026 · Version 2.0</p>
      </div>

      <div className="prose prose-sm text-text text-xs leading-relaxed space-y-4">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-text">1. Scope of Service</h2>
          <p className="text-text-muted">
            Pramaan provides deterministic and evidence-grounded brand governance tooling for enterprise and creator
            teams. Pramaan evaluates copy against user-configured brand rules, terminology policies, and facts registers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text">2. Human-in-the-Loop Authority</h2>
          <p className="text-text-muted">
            Pramaan's automated findings and suggested corrections serve as advisory compliance signals.
            <strong> Final approval authority remains exclusively with human reviewers and brand managers.</strong> Pramaan
            does not replace certified legal counsel or statutory regulatory submissions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text">3. Honesty & Abstention Doctrine</h2>
          <p className="text-text-muted">
            In accordance with our core operating tenets, Pramaan will never fabricate a guideline citation or generate
            an ungrounded hallucination. A pass verdict indicates solely that no violations were detected by the active checks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text">4. Acceptable Use</h2>
          <p className="text-text-muted">
            Users may not attempt cross-tenant intrusion, automated denial-of-service, or the publication of defamatory,
            fraudulent, or illegal content.
          </p>
        </section>
      </div>
    </div>
  );
};
