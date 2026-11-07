import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Workflow, 
  AlertTriangle, 
  Sparkles, 
  Users, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Lock 
} from 'lucide-react';
import { siteConfig } from '../config/site';

interface SectionProps {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SectionCard({ title, icon: Icon, badge, isOpen, onToggle, children }: SectionProps) {
  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden shadow-floating transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-2/60 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-pill bg-orange-500/10 flex items-center justify-center text-orange-text shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text tracking-tight flex items-center gap-2">
              <span>{title}</span>
              {badge && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-surface-2 text-text-muted">
                  {badge}
                </span>
              )}
            </h2>
          </div>
        </div>
        <div className="p-1 rounded-pill text-text-muted hover:text-text">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 text-xs text-text-muted leading-relaxed border-t border-border/60">
          {children}
        </div>
      )}
    </div>
  );
}

export function About() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    promise: true,
    workflow: true,
    boundaries: false,
    disclosure: false,
    team: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 max-w-reading mx-auto py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <img
          src="/logo-mark.svg"
          alt="Pramaan logo mark"
          className="w-16 h-16 rounded-[18px] shadow-sm shrink-0"
        />
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-semibold text-orange-text tracking-wide uppercase">
              About Pramaan
            </span>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-xs font-mono text-text-muted">
              प्रमाण (pramāṇa: proof, evidence)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">
            Evidence-backed Brand Governance
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
            Pramaan is an open, auditable compliance workbench built for brand managers, reviewers, and content creators.
          </p>
        </div>
      </div>

      {/* Accordion / Modular Cards */}
      <div className="space-y-4">
        {/* 1. What Pramaan does */}
        <SectionCard
          id="promise"
          title="What Pramaan Does"
          icon={ShieldCheck}
          badge="Core Promise"
          isOpen={!!openSections.promise}
          onToggle={() => toggleSection('promise')}
        >
          <div className="space-y-3 pt-1 text-text">
            <p className="text-sm font-medium leading-relaxed">
              Pramaan is an evidence-backed brand governance workbench that verifies marketing copy against approved brand guidelines and factual registers before publication.
            </p>
            <p className="leading-relaxed text-text-muted">
              It detects misleading claims, terminology violations, tone drift, and reading-level mismatches, grounding every finding in an exact source rule or fact from your brand knowledge base.
            </p>
            <p className="leading-relaxed text-text-muted">
              Human reviewers retain full decision authority to accept suggestions, edit text, or record justified overrides in an append-only audit ledger.
            </p>
          </div>
        </SectionCard>

        {/* 2. How it works (4 short steps) */}
        <SectionCard
          id="workflow"
          title="How It Works"
          icon={Workflow}
          badge="4 Steps"
          isOpen={!!openSections.workflow}
          onToggle={() => toggleSection('workflow')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-inner bg-surface-2 border border-border/80 space-y-1.5">
              <div className="flex items-center space-x-2 text-text font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-text flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Add Your Brand Rules</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed pl-7">
                Configure approved facts registers, terminology bans, claim guidelines, and reading-level standards in the Brand Knowledge Hub.
              </p>
            </div>

            <div className="p-4 rounded-inner bg-surface-2 border border-border/80 space-y-1.5">
              <div className="flex items-center space-x-2 text-text font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-text flex items-center justify-center text-[11px] font-bold">2</span>
                <span>Submit a Draft with its Purpose</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed pl-7">
                Define the draft's goal, target audience, core message, and non-negotiable locked phrases via the Purpose Card before scanning.
              </p>
            </div>

            <div className="p-4 rounded-inner bg-surface-2 border border-border/80 space-y-1.5">
              <div className="flex items-center space-x-2 text-text font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-text flex items-center justify-center text-[11px] font-bold">3</span>
                <span>Review Evidence-Linked Findings</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed pl-7">
                Inspect inline citations pointing to specific rule IDs, view purpose-preserving suggestions, and evaluate before/after diffs.
              </p>
            </div>

            <div className="p-4 rounded-inner bg-surface-2 border border-border/80 space-y-1.5">
              <div className="flex items-center space-x-2 text-text font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-text flex items-center justify-center text-[11px] font-bold">4</span>
                <span>A Human Decides</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed pl-7">
                Accept, edit, or override findings with required rationale. Transitions and approvals are recorded in an append-only audit trail.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* 3. What it does not do */}
        <SectionCard
          id="boundaries"
          title="What It Does Not Do"
          icon={AlertTriangle}
          badge="Boundaries"
          isOpen={!!openSections.boundaries}
          onToggle={() => toggleSection('boundaries')}
        >
          <div className="space-y-2.5 pt-1">
            <ul className="space-y-2 text-xs">
              <li className="flex items-start space-x-2">
                <span className="text-orange-text font-bold select-none">•</span>
                <span><strong>Does not auto-publish:</strong> Pramaan never automatically submits, publishes, or distributes marketing collateral without explicit human confirmation.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-text font-bold select-none">•</span>
                <span><strong>Does not certify legal compliance:</strong> Automated checks supplement, but do not replace, formal legal review or regulatory filings.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-text font-bold select-none">•</span>
                <span><strong>Scope of checks:</strong> A pass means only that no issue was detected by the specific checks and rules performed.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-text font-bold select-none">•</span>
                <span><strong>Fictional demo data:</strong> All brands, guidelines, and reviews presented in the sample kits (LedgerLeaf, AuraHealth, etc.) are strictly fictional.</span>
              </li>
            </ul>
          </div>
        </SectionCard>

        {/* 4. AI and data disclosure */}
        <SectionCard
          id="disclosure"
          title="AI and Data Disclosure"
          icon={Sparkles}
          badge="Transparency"
          isOpen={!!openSections.disclosure}
          onToggle={() => toggleSection('disclosure')}
        >
          <div className="space-y-3 pt-1">
            <p>
              Pramaan adheres to rigorous privacy and transparency principles across both local and AI-assisted workflows:
            </p>
            <div className="p-3.5 rounded-inner bg-surface-2 border border-border/80 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-text">
                <Lock className="w-3.5 h-3.5 text-orange-text" />
                <span>Confidential Mode</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                When Confidential Mode is enabled in the top bar, Pramaan makes zero external API calls. All heuristics, regex matching, readability algorithms, and claim checks run strictly locally on the server.
              </p>
            </div>
            <p className="text-[11px]">
              When Confidential Mode is inactive, external LLM calls (e.g., Gemini API) may process pre-redacted copy to generate tone suggestions and nuanced explanations.
            </p>
            <p className="text-[11px]">
              Built with AI assistance in the Google Antigravity IDE. Core technologies include React 19, Tailwind CSS v4, FastAPI, SQLAlchemy, and SQLite.
            </p>
            <div className="pt-1">
              <a
                href={siteConfig.aiDisclosureUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-medium text-orange-text hover:underline"
              >
                <span>Read the full AI & Tools Disclosure</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </SectionCard>

        {/* 5. Team */}
        <SectionCard
          id="team"
          title="Team & Documentation"
          icon={Users}
          badge="CodeNexus 2026"
          isOpen={!!openSections.team}
          onToggle={() => toggleSection('team')}
        >
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-inner bg-surface-2 border border-border/80">
              <div>
                <span className="text-[10px] font-mono uppercase text-orange-text font-bold">Project Submission</span>
                <div className="text-sm font-bold text-text mt-0.5">{siteConfig.competition}</div>
                <div className="text-xs text-text-muted mt-0.5">Team: {siteConfig.team} (Solo build)</div>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={siteConfig.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-pill bg-surface text-text hover:bg-surface-2 border border-border text-xs font-medium"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-text-muted" />
                </a>
                <a
                  href={siteConfig.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-pill bg-surface text-text hover:bg-surface-2 border border-border text-xs font-medium"
                >
                  <span>Project Docs</span>
                  <ExternalLink className="w-3 h-3 text-text-muted" />
                </a>
              </div>
            </div>
            <p className="text-[11px] text-text-muted">
              The full technical specification, user research, and architecture report are preserved in the repository documentation and the official submission PDF.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
