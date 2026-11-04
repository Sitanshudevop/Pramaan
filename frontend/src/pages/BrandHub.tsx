import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2 } from 'lucide-react';
import { getBrandKits, updateBrandRule } from '../lib/api';
import { useApp } from '../lib/context';
import { RuleItem } from '../lib/types';

export const BrandHub: React.FC = () => {
  const { role } = useApp();
  const queryClient = useQueryClient();

  const [selectedKitId, setSelectedKitId] = useState<string>('kettle-and-co');
  const [activeTab, setActiveTab] = useState<'rules' | 'facts' | 'glossary' | 'claims'>('rules');

  // Edit modal state
  const [editingRule, setEditingRule] = useState<RuleItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const { data: kits, isLoading } = useQuery({
    queryKey: ['brandKits', role],
    queryFn: () => getBrandKits(role),
  });

  const activeKit = kits?.find((k) => k.id === selectedKitId) || kits?.[0];

  const updateRuleMutation = useMutation({
    mutationFn: () => {
      if (!editingRule) throw new Error('No rule selected');
      return updateBrandRule(
        selectedKitId,
        editingRule.id,
        {
          title: editTitle,
          text: editText,
          reason: editReason,
        },
        role
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandKits'] });
      setEditingRule(null);
      setEditReason('');
    },
    onError: (err: Error) => {
      setEditError(err.message || 'Failed to update rule');
    },
  });

  const openEditModal = (rule: RuleItem) => {
    setEditingRule(rule);
    setEditTitle(rule.title);
    setEditText(rule.text);
    setEditReason('');
    setEditError(null);
  };

  if (isLoading) {
    return <div className="py-24 text-center text-xs text-text-muted">Loading Brand Knowledge Hub...</div>;
  }

  return (
    <div className="space-y-6 max-w-app mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Brand Knowledge Hub</h1>
          <p className="text-sm text-text-muted mt-1">
            Approved guidelines, facts register, terminology constraints, and claims policies.
          </p>
        </div>

        {/* Brand Kit Selector */}
        <div className="flex items-center space-x-2">
          {kits?.map((k) => (
            <button
              key={k.id}
              onClick={() => setSelectedKitId(k.id)}
              className={`px-3 py-1.5 rounded-btn text-xs font-semibold transition-colors ${
                selectedKitId === k.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface border border-border text-text hover:bg-surface-2'
              }`}
            >
              {k.name}
            </button>
          ))}
        </div>
      </div>

      {activeKit && (
        <div className="space-y-6">
          {/* Brand Kit Overview Card */}
          <div className="p-5 rounded-card border border-border bg-surface flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-accent font-semibold">
                {activeKit.industry}
              </div>
              <h2 className="text-lg font-bold text-text">{activeKit.name}</h2>
              <p className="text-xs text-text-muted max-w-xl">{activeKit.description}</p>
            </div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-text-muted">Brand Voice: </span>
                <span className="font-medium text-text">{activeKit.voice_tone}</span>
              </div>
              <div>
                <span className="text-text-muted">Target Reading Level: </span>
                <span className="font-medium text-text">Grade {activeKit.target_reading_level}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border space-x-4 text-xs">
            <button
              onClick={() => setActiveTab('rules')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'rules'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              All Rules ({activeKit.rules.length})
            </button>
            <button
              onClick={() => setActiveTab('facts')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'facts'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Facts Register ({activeKit.facts.length})
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'claims'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Claims Policy
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'glossary'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Glossary
            </button>
          </div>

          {/* Tab Content: Rules */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              {activeKit.rules.map((r) => (
                <div key={r.id} className="p-4 rounded-card border border-border bg-surface space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-accent">{r.id}</span>
                      <span className="text-xs font-semibold text-text">{r.title}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-surface-2 text-text-muted uppercase font-medium">
                        {r.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono text-text-muted">v{r.version}</span>
                      {role === 'Brand manager' && (
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1 rounded text-text-muted hover:text-accent hover:bg-surface-2"
                          title="Edit rule and publish new version"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-text-muted leading-relaxed">{r.text}</p>

                  <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between text-[11px] text-text-muted gap-2">
                    <div>Source: {r.source}</div>
                    <div>
                      Owner: {r.owner} · Effective: {r.effective_from}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content: Facts Register */}
          {activeTab === 'facts' && (
            <div className="space-y-3">
              {activeKit.facts.map((f) => (
                <div key={f.id} className="p-4 rounded-card border border-border bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-accent">{f.id}</span>
                      <span className="text-xs font-semibold text-text">{f.subject}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        f.status === 'active'
                          ? 'bg-success/15 text-success'
                          : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted">Approved Value: </span>
                      <span className="font-mono font-medium text-text">{f.value}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Validity Window: </span>
                      <span className="text-text">
                        {f.valid_from} to {f.valid_to}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-text-muted">
                    <span className="font-medium text-text">Permitted Wording: </span>
                    <span>&ldquo;{f.permitted_wording}&rdquo;</span>
                  </div>

                  <div className="pt-2 border-t border-border text-[11px] text-text-muted flex justify-between">
                    <span>Source: {f.source}</span>
                    <span>Owner: {f.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content: Claims Policy */}
          {activeTab === 'claims' && (
            <div className="space-y-3">
              {activeKit.rules
                .filter((r) => r.category === 'Promotional claims')
                .map((r) => (
                  <div key={r.id} className="p-4 rounded-card border border-border bg-surface space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-accent">{r.id}</span>
                      <span className="text-xs font-semibold text-text">{r.title}</span>
                    </div>
                    <p className="text-xs text-text-muted">{r.text}</p>
                  </div>
                ))}
            </div>
          )}

          {/* Tab Content: Glossary */}
          {activeTab === 'glossary' && (
            <div className="space-y-3">
              {activeKit.rules
                .filter((r) => r.category === 'Terminology')
                .map((r) => (
                  <div key={r.id} className="p-4 rounded-card border border-border bg-surface space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-accent">{r.id}</span>
                      <span className="text-xs font-semibold text-text">{r.title}</span>
                    </div>
                    <p className="text-xs text-text-muted">{r.text}</p>
                    {r.banned_terms && r.banned_terms.length > 0 && (
                      <div className="flex items-center space-x-1.5 text-xs">
                        <span className="text-text-muted">Prohibited Words:</span>
                        {r.banned_terms.map((w) => (
                          <span
                            key={w}
                            className="px-1.5 py-0.5 rounded bg-danger/10 text-danger text-[11px] font-mono"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md p-5 rounded-card bg-surface border border-border shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-text">Edit Rule {editingRule.id}</h3>

            {editError && <div className="p-2 rounded bg-danger/10 text-danger text-xs">{editError}</div>}

            <div>
              <label className="block text-xs font-medium text-text mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-btn border border-border bg-surface-2 text-xs text-text"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">Specification Text</label>
              <textarea
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2.5 rounded-btn border border-border bg-surface-2 text-xs text-text"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">
                Version Change Reason (Mandatory)
              </label>
              <input
                type="text"
                placeholder="e.g. Updated for seasonal campaign guidance"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full px-3 py-1.5 rounded-btn border border-border bg-surface-2 text-xs text-text"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingRule(null)}
                className="px-3 py-1.5 rounded-btn border border-border text-xs text-text hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                onClick={() => updateRuleMutation.mutate()}
                disabled={updateRuleMutation.isPending || !editReason.trim()}
                className="px-4 py-1.5 rounded-btn bg-accent text-white text-xs font-medium disabled:opacity-50"
              >
                {updateRuleMutation.isPending ? 'Publishing...' : 'Publish New Version'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
