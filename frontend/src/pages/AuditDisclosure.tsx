import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, Cpu, EyeOff } from 'lucide-react';
import { getAuditLogs, getDisclosureLedger } from '../lib/api';
import { useApp } from '../lib/context';

export const AuditDisclosure: React.FC = () => {
  const { role, confidentialMode, setConfidentialMode } = useApp();
  const [activeTab, setActiveTab] = useState<'audit' | 'disclosure'>('audit');

  const { data: auditLogs, isLoading: loadingAudit } = useQuery({
    queryKey: ['auditLogs', role],
    queryFn: () => getAuditLogs(role),
  });

  const { data: disclosures, isLoading: loadingDisc } = useQuery({
    queryKey: ['disclosures', role],
    queryFn: () => getDisclosureLedger(role),
  });

  return (
    <div className="space-y-6 max-w-app mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Audit & AI Disclosure</h1>
        <p className="text-sm text-text-muted mt-1">
          Immutable append-only governance trail and runtime AI model processing ledger.
        </p>
      </div>

      {/* Confidential Mode Card */}
      <div className="p-5 rounded-card border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-text">Confidential Mode Status</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                confidentialMode
                  ? 'bg-success/15 text-success'
                  : 'bg-surface-2 text-text-muted'
              }`}
            >
              {confidentialMode ? 'Active (Offline Only)' : 'Inactive (AI Layer Active)'}
            </span>
          </div>
          <p className="text-xs text-text-muted max-w-xl">
            When Confidential Mode is active, all external AI calls are severed. Pramaan operates purely on local deterministic checks with zero external network egress.
          </p>
        </div>

        {role === 'Admin' && (
          <button
            onClick={() => setConfidentialMode(!confidentialMode)}
            className={`px-3 py-1.5 rounded-btn text-xs font-semibold border transition-colors ${
              confidentialMode
                ? 'bg-success text-white border-success'
                : 'bg-surface-2 text-text border-border hover:bg-surface'
            }`}
          >
            {confidentialMode ? 'Disable Confidential Mode' : 'Enable Confidential Mode'}
          </button>
        )}
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-4 rounded-card border border-border bg-surface-2 flex items-start space-x-3 text-xs text-text-muted">
        <Lock className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <span className="font-semibold text-text">Zero-Content Logging Commitment:</span>
          <p>
            In strict compliance with Pramaan security policy, draft content and user prompts are NEVER stored in application logs or the audit trail. Records contain action metadata, timestamps, character sizes, and identifiers only.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-4 text-xs">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 font-medium transition-colors border-b-2 ${
            activeTab === 'audit'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Append-Only Audit Log ({auditLogs?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('disclosure')}
          className={`pb-2.5 font-medium transition-colors border-b-2 ${
            activeTab === 'disclosure'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          AI Processing Disclosure Ledger ({disclosures?.length || 0})
        </button>
      </div>

      {/* Audit Log Table / Cards */}
      {activeTab === 'audit' && (
        <div className="space-y-2">
          {loadingAudit ? (
            <div className="py-12 text-center text-xs text-text-muted">Loading audit log...</div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="p-6 rounded-card border border-border bg-surface text-center text-xs text-text-muted">
              No audit records logged yet.
            </div>
          ) : (
            auditLogs.map((entry) => (
              <div
                key={entry.seq}
                className="p-3.5 rounded-card border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-text-muted">#{entry.seq}</span>
                    <span className="font-semibold text-text capitalize">
                      {entry.action.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-2 text-text-muted">
                      Role: {entry.actor_role}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-text-muted">
                    Entity: {entry.entity} · ID: {entry.entity_id}
                  </div>
                </div>

                <div className="text-right text-[11px] text-text-muted space-y-0.5">
                  <div>{new Date(entry.created_at).toLocaleString()}</div>
                  <div className="font-mono text-[10px] text-text-muted">
                    {JSON.stringify(entry.detail)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* AI Disclosure Ledger */}
      {activeTab === 'disclosure' && (
        <div className="space-y-2">
          {loadingDisc ? (
            <div className="py-12 text-center text-xs text-text-muted">Loading disclosure ledger...</div>
          ) : !disclosures || disclosures.length === 0 ? (
            <div className="p-6 rounded-card border border-border bg-surface text-center text-xs text-text-muted">
              No external AI calls logged. (Pure deterministic executions or Confidential Mode active).
            </div>
          ) : (
            disclosures.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-card border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-3.5 h-3.5 text-accent" />
                    <span className="font-semibold text-text">{d.provider}</span>
                    <span className="font-mono text-[11px] text-text-muted">({d.model})</span>
                    {d.pii_redacted && (
                      <span className="px-1.5 py-0.2 rounded bg-success/10 text-success text-[10px] font-medium flex items-center space-x-1">
                        <EyeOff className="w-3 h-3" />
                        <span>PII Redacted</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Review: <span className="font-mono">{d.review_id}</span> · Data Class: {d.data_class}
                  </div>
                </div>

                <div className="text-right text-[11px] text-text-muted space-y-0.5">
                  <div>{new Date(d.created_at).toLocaleString()}</div>
                  <div className="font-mono text-[10px]">{d.token_count} tokens processed</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
