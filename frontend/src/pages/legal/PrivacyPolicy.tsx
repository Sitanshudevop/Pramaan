import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div className="space-y-2 border-b border-border pb-4">
        <div className="flex items-center space-x-2 text-orange-text text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Pramaan Trust & Governance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-text tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-text-muted">Last updated: November 2026 · Version 2.0</p>
      </div>

      <div className="prose prose-sm text-text text-xs leading-relaxed space-y-4">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-text">1. Core Data Principles</h2>
          <p className="text-text-muted">
            Pramaan is built on the strict doctrine of <em>Proof-or-Abstain</em>. We do not monetize,
            train open foundation models on, or sell your proprietary brand guidelines, unpublished marketing drafts,
            or employee identity data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text">2. Tenant Isolation & Data Ownership</h2>
          <p className="text-text-muted">
            All customer records—including brand kits, facts registers, drafts, and compliance audit logs—are
            strictly partitioned by tenant workspace ID. Cross-tenant access is prohibited at both the database
            and API layer. You retain complete ownership of all submitted text and guidelines.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text">3. Confidential Mode & Generative AI</h2>
          <p className="text-text-muted">
            When <strong>Confidential Mode</strong> is enabled (ON), all checks run deterministically on our offline
            verification engine. Zero external LLM or cloud API calls are made. When Confidential Mode is disabled,
            any external analysis utilizes automated client-side PII redaction and records an immutable entry in the
            AI Disclosure Ledger.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text">4. Password & Session Security</h2>
          <p className="text-text-muted">
            User authentication credentials are protected using memory-hard <strong>Argon2id</strong> hashing with salt.
            Sessions are managed via cryptographically rotated tokens stored in secure, SameSite=Lax HTTP-only cookies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text">5. Data Retention & Right to Erasure</h2>
          <p className="text-text-muted">
            Workspace administrators configure automated retention windows (30, 90, or 365 days). Users can export
            their full personal history in JSON format or trigger complete account deletion at any time in Account Settings.
          </p>
        </section>
      </div>
    </div>
  );
};
