import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, UserCheck, BookOpen, AlertCircle } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-reading mx-auto py-8 space-y-12">
      {/* Hero Section */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-accent-soft text-accent text-xs font-semibold">
          <span>CodeNexus India 2026</span>
          <span className="text-text-muted">·</span>
          <span>Round 2 Solo Build</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
          Pramaan: Evidence-backed brand governance, before you publish.
        </h1>
        <p className="text-base sm:text-lg text-text-muted leading-relaxed italic">
          &ldquo;Every finding has evidence. Every correction preserves the creator’s purpose. Every final decision remains human.&rdquo;
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={() => navigate('/app/new')}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-btn bg-accent text-white font-medium text-sm hover:opacity-95 shadow-sm transition-opacity"
        >
          <span>Try a sample review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/app/hub')}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-btn border border-border bg-surface text-text font-medium text-sm hover:bg-surface-2 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-text-muted" />
          <span>Open Brand Hub</span>
        </button>
      </div>

      {/* Three Commitments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-card border border-border bg-surface space-y-2.5">
          <div className="w-8 h-8 rounded-btn bg-accent-soft text-accent flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-text">1. Proof for every finding</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Each flagged issue cites an active rule or fact ID. If no approved source exists, the status is &ldquo;Unsupported&rdquo; or &ldquo;Needs human judgement&rdquo; — never &ldquo;false&rdquo;.
          </p>
        </div>

        <div className="p-5 rounded-card border border-border bg-surface space-y-2.5">
          <div className="w-8 h-8 rounded-btn bg-accent-soft text-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-text">2. Purpose-preserving fixes</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Suggestions are re-checked against the violated rule and the creator’s Purpose Card. Locked phrases are never stripped.
          </p>
        </div>

        <div className="p-5 rounded-card border border-border bg-surface space-y-2.5">
          <div className="w-8 h-8 rounded-btn bg-accent-soft text-accent flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-text">3. Human decides</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            No auto-apply, auto-approve, or auto-publish. Every status transition records actor, role, timestamp, and justification.
          </p>
        </div>
      </div>

      {/* Honesty Banner */}
      <div className="p-4 rounded-card border border-border bg-surface-2 flex items-start space-x-3 text-xs text-text-muted">
        <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <span className="font-semibold text-text">Verification boundary notice:</span>
          <p>
            A pass means only that no issue was detected by the checks performed. Pramaan provides editorial and brand risk mitigation; it does not claim legal compliance certification or guaranteed regulatory immunity.
          </p>
        </div>
      </div>

      {/* Footer Disclosures */}
      <footer className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center text-xs text-text-muted gap-2">
        <div>Demo brand kits and drafts are fictional and authored for CodeNexus India 2026.</div>
        <div>Runtime AI disclosure: Google Gemini with PII sanitization.</div>
      </footer>
    </div>
  );
};

