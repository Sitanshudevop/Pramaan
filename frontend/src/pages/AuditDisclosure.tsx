import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Cpu, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import {
  getAuditLogs,
  getDisclosureLedger,
  exportAuditLogs,
  verifyAuditIntegrity,
  setConfidentialModeBackend,
} from '../lib/api';
import { useApp } from '../lib/context';
import { AuditVerifyResult } from '../lib/types';
import { PillTabs, Chip } from '../components/ui';

export const AuditDisclosure: React.FC = () => {
  const { role, confidentialMode, setConfidentialMode } = useApp();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('audit');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(null);

  const { data: auditLogs, isLoading: loadingAudit } = useQuery({
    queryKey: ['auditLogs', role],
    queryFn: () => getAuditLogs(role),
  });

  const { data: disclosures, isLoading: loadingDisc } = useQuery({
    queryKey: ['disclosures', role],
    queryFn: () => getDisclosureLedger(role),
  });

  const { data: verifyData } = useQuery({
    queryKey: ['auditVerify', role],
    queryFn: () => verifyAuditIntegrity(role),
  });

  const effectiveVerify = verifyResult || verifyData;

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      await exportAuditLogs(format, role);
    } catch (err) {
      alert((err as Error).message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyAuditIntegrity(role);
      setVerifyResult(res);
    } catch (err) {
      alert((err as Error).message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleConfidential = async () => {
    try {
      const next = !confidentialMode;
      await setConfidentialModeBackend(next, role);
      setConfidentialMode(next);
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    } catch (err) {
      alert((err as Error).message || 'Failed to update confidential mode');
    }
  };

  const filteredAuditLogs = (auditLogs || []).filter((entry) => {
    if (roleFilter !== 'ALL' && entry.actor_role !== roleFilter) return false;
    return true;
  });

  const tabs = [
    { id: 'audit', label: 'Append-Only Audit Log', count: auditLogs?.length || 0 },
    { id: 'disclosure', label: 'AI Processing Disclosure Ledger', count: disclosures?.length || 0 },
  ];

  return (
    <div className="space-y-6 max-w-app mx-auto py-2">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">Audit & AI Disclosure</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Immutable append-only governance trail and runtime AI model processing ledger.
        </p>
      </div>

      {/* Confidential Mode Card */}
      <div className="p-6 rounded-card border border-border bg-surface shadow-floating flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <span className="font-bold text-sm text-text">Confidential Mode</span>
            <Chip variant={confidentialMode ? 'success' : 'neutral'} size="sm" dot>
              {confidentialMode ? 'Active (Offline Only)' : 'Inactive (AI Layer Active)'}
            </Chip>
          </div>
          <p className="text-xs text-text-muted max-w-xl leading-relaxed">
            When Confidential Mode is active, all external AI calls are severed. Pramaan operates purely on local deterministic rules with zero external network egress.
          </p>
        </div>

        {role === 'Admin' && (
          <button
            onClick={handleToggleConfidential}
            className="px-5 py-2 rounded-pill text-xs font-semibold bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto"
          >
            {confidentialMode ? 'Disable Confidential Mode' : 'Enable Confidential Mode'}
          </button>
        )}
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-4 rounded-card border border-border bg-surface-2 flex items-start space-x-3 text-xs text-text-muted">
        <Lock className="w-4 h-4 text-orange-text mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-semibold text-text">Zero-Content Logging Commitment</span>
          <p className="leading-relaxed">
            In strict compliance with Pramaan security policy, draft content and user prompts are NEVER stored in application logs or the audit trail. Records contain action metadata, timestamps, character counts, and identifiers only.
          </p>
        </div>
      </div>

      {/* Cryptographic Verification Banner */}
      {effectiveVerify && (
        <div className="p-4 rounded-card border border-success/40 bg-success/10 text-xs font-mono space-y-1">
          <div className="flex items-center space-x-2 font-bold text-success-text font-sans">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {effectiveVerify.total_records > 0
                ? 'Audit Trail Integrity Confirmed'
                : 'No Events Yet'}
            </span>
          </div>
          <div className="text-text">
            Status: <span className="font-bold uppercase">{effectiveVerify.status}</span> · Total Records: {effectiveVerify.total_records}
          </div>
          <div className="text-[11px] text-text-muted break-all">
            Head Hash (SHA-256): {effectiveVerify.latest_hash}
          </div>
        </div>
      )}

      {/* PillTabs Selector & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PillTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'audit' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-3.5 py-1.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-xs flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Verifying...' : 'Verify Trail Integrity'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5 text-text-muted" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5 text-text-muted" />
              <span>JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Audit Log Table */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-3">
          {/* Role Filter Pills */}
          <div className="flex items-center space-x-1.5 pb-2 border-b border-border/60">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mr-1">
              Actor Role:
            </span>
            {['ALL', 'Creator', 'Reviewer', 'Brand manager', 'Admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-pill text-xs font-medium transition-colors ${
                  roleFilter === r
                    ? 'bg-text text-bg font-bold shadow-xs'
                    : 'bg-surface-2 text-text-muted hover:text-text'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {loadingAudit ? (
              <div className="py-12 text-center text-xs text-text-muted font-mono">Loading audit trail...</div>
            ) : filteredAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-muted space-y-3">
                <p>No events match this filter.</p>
                <button
                  type="button"
                  onClick={() => setRoleFilter('ALL')}
                  className="px-4 py-1.5 rounded-pill bg-surface-2 border border-border text-text hover:bg-border text-xs font-semibold transition-colors"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/80 text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Seq</th>
                    <th className="py-3 px-3">Timestamp (UTC)</th>
                    <th className="py-3 px-3">Actor Role</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Target Entity</th>
                    <th className="py-3 px-3">Metadata Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-mono">
                  {filteredAuditLogs.map((entry) => (
                    <tr key={entry.seq} className="hover:bg-surface-2/60 transition-colors">
                      <td className="py-3 px-3 text-orange-text font-bold">#{entry.seq}</td>
                      <td className="py-3 px-3 text-text-muted text-[11px]">
                        {new Date(entry.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-text font-sans">{entry.actor_role}</td>
                      <td className="py-3 px-3">
                        <Chip variant="neutral" size="sm">
                          {entry.action}
                        </Chip>
                      </td>
                      <td className="py-3 px-3 text-text">
                        {entry.entity}: <span className="text-orange-text">{entry.entity_id}</span>
                      </td>
                      <td className="py-3 px-3 text-text-muted text-[11px] max-w-xs truncate">
                        {JSON.stringify(entry.detail)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: AI Disclosure Ledger */}
      {activeTab === 'disclosure' && (
        <div className="p-5 rounded-card border border-border bg-surface shadow-floating overflow-x-auto">
          {loadingDisc ? (
            <div className="py-12 text-center text-xs text-text-muted font-mono">Loading disclosure ledger...</div>
          ) : !disclosures || disclosures.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">No AI processing requests recorded yet.</div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Review ID</th>
                  <th className="py-3 px-3">AI Provider</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">Data Class</th>
                  <th className="py-3 px-3">PII Redacted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono">
                {disclosures.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-2/60 transition-colors">
                    <td className="py-3 px-3 text-text-muted text-[11px]">
                      {new Date(d.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-3 text-orange-text font-bold">{d.review_id}</td>
                    <td className="py-3 px-3 font-semibold text-text flex items-center space-x-1.5 pt-3">
                      <Cpu className="w-3.5 h-3.5 text-text-muted" />
                      <span>{d.provider}</span>
                    </td>
                    <td className="py-3 px-3 text-text">{d.model}</td>
                    <td className="py-3 px-3">
                      <Chip variant="neutral" size="sm">
                        {d.data_class}
                      </Chip>
                    </td>
                    <td className="py-3 px-3">
                      {d.pii_redacted ? (
                        <Chip variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                          Redacted
                        </Chip>
                      ) : (
                        <span className="text-text-muted text-[11px]">Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
