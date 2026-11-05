import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2 } from 'lucide-react';
import { getBrandKits, updateBrandRule } from '../lib/api';
import { useApp } from '../lib/context';
import { RuleItem } from '../lib/types';
import { StatCard, PillTabs, Chip } from '../components/ui';

export const BrandHub: React.FC = () => {
  const { role } = useApp();
  const queryClient = useQueryClient();

  const [selectedKitId, setSelectedKitId] = useState<string>('kettle-and-co');
  const [activeTab, setActiveTab] = useState<string>('rules');

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
    return (
      <div className="py-24 text-center text-xs text-text-muted font-mono">
        Loading Brand Knowledge Hub...
      </div>
    );
  }

  const activeRules = activeKit?.rules.filter((r) => r.status === 'active') || [];
  const activeFacts = activeKit?.facts.filter((f) => f.status === 'active') || [];
  const supersededFacts = activeKit?.facts.filter((f) => f.status === 'superseded') || [];

  const tabs = [
    { id: 'rules', label: 'Guidelines & Rules', count: activeRules.length },
    { id: 'facts', label: 'Approved Facts Register', count: activeKit?.facts.length || 0 },
    {
      id: 'glossary',
      label: 'Terminology',
      count: activeKit?.rules.filter((r) => r.category === 'Terminology').length || 0,
    },
    {
      id: 'claims',
      label: 'Claims Policy',
      count: activeKit?.rules.filter((r) => r.category === 'Promotional claims').length || 0,
    },
  ];

  return (
    <div className="space-y-6 max-w-app mx-auto py-2">
      {/* Title & Brand Kit Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Brand Knowledge Hub</h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Approved guidelines, facts register, terminology constraints, and claims policies.
          </p>
        </div>

        {/* Brand Kit Selector Pills */}
        <div className="flex items-center space-x-1.5 p-1 rounded-pill bg-surface-2 border border-border/70 self-start sm:self-auto">
          {kits?.map((k) => (
            <button
              key={k.id}
              onClick={() => setSelectedKitId(k.id)}
              className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition-all ${
                selectedKitId === k.id
                  ? 'bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {k.name}
            </button>
          ))}
        </div>
      </div>

      {activeKit && (
        <div className="space-y-6">
          {/* Row of Three Small StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Active Guidelines"
              value={activeRules.length}
              hint="Rules verified in review passes"
            />
            <StatCard
              label="Approved Facts"
              value={activeFacts.length}
              delta={{ direction: 'up', label: 'Active Records' }}
              hint="Grounding truth register"
            />
            <StatCard
              label="Superseded Facts"
              value={supersededFacts.length}
              hint="Historical records flagged if used"
            />
          </div>

          {/* Brand Kit Overview Description Card */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-floating flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-orange-text font-bold">
                {activeKit.industry}
              </span>
              <h2 className="text-xl font-extrabold text-text tracking-tight">{activeKit.name}</h2>
              <p className="text-xs text-text-muted leading-relaxed max-w-xl">
                {activeKit.description}
              </p>
            </div>
            <div className="text-xs text-text-muted space-y-1 md:text-right border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-6">
              <div>
                <strong className="text-text">Voice & Tone: </strong>
                {activeKit.voice_tone}
              </div>
              <div>
                <strong className="text-text">Reading Level Target: </strong>
                Grade {activeKit.target_reading_level}
              </div>
            </div>
          </div>

          {/* Navigation PillTabs */}
          <PillTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* TAB 1: RULES & GUIDELINES */}
          {activeTab === 'rules' && (
            <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Active Brand Rules
                </span>
                <span className="text-[11px] text-text-muted">
                  {role === 'Brand manager' || role === 'Admin'
                    ? 'Click edit to publish a new rule version'
                    : 'Read-only view (Brand manager role required to edit)'}
                </span>
              </div>

              <div className="divide-y divide-border/60">
                {activeKit.rules.map((rule) => (
                  <div key={rule.id} className="py-4 space-y-2 first:pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <Chip variant="accent" size="sm">
                          {rule.id}
                        </Chip>
                        <span className="text-xs font-bold text-text">{rule.title}</span>
                        <Chip
                          variant={
                            rule.severity === 'Blocker'
                              ? 'danger'
                              : rule.severity === 'Major'
                              ? 'accent'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {rule.severity}
                        </Chip>
                      </div>

                      {role === 'Brand manager' || role === 'Admin' ? (
                        <button
                          type="button"
                          onClick={() => openEditModal(rule)}
                          className="p-1.5 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                          title="Edit rule and publish new version"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span
                          className="text-[10px] text-text-muted opacity-60 font-medium"
                          title="Editing guidelines requires Brand manager role. Switch role in the top bar."
                        >
                          Manager only
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed">{rule.text}</p>

                    <div className="flex items-center space-x-3 text-[11px] font-mono text-text-muted">
                      <span>Category: {rule.category}</span>
                      <span>·</span>
                      <span>v{rule.version}</span>
                      <span>·</span>
                      <span>Owner: {rule.owner}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FACTS REGISTER */}
          {activeTab === 'facts' && (
            <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-3">
              <div className="pb-2 border-b border-border/60">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Approved Facts Register
                </span>
              </div>

              <div className="divide-y divide-border/60">
                {activeKit.facts.map((fact) => (
                  <div key={fact.id} className="py-4 space-y-2 first:pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <Chip variant="accent" size="sm">
                          {fact.id}
                        </Chip>
                        <span className="text-xs font-bold text-text">{fact.subject}</span>
                      </div>
                      <Chip variant={fact.status === 'active' ? 'success' : 'neutral'} size="sm">
                        {fact.status}
                      </Chip>
                    </div>

                    <div className="p-3 rounded-inner bg-surface-2 font-mono text-xs text-text">
                      <strong className="text-orange-text">Permitted wording:</strong> &ldquo;{fact.permitted_wording}&rdquo;
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-text-muted">
                      <span>Value: {fact.value}</span>
                      <span>·</span>
                      <span>Valid: {fact.valid_from} to {fact.valid_to}</span>
                      <span>·</span>
                      <span>Source: {fact.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TERMINOLOGY */}
          {activeTab === 'glossary' && (
            <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-3">
              <div className="divide-y divide-border/60">
                {activeKit.rules
                  .filter((r) => r.category === 'Terminology')
                  .map((rule) => (
                    <div key={rule.id} className="py-3.5 space-y-1.5 first:pt-1">
                      <div className="flex items-center space-x-2">
                        <Chip variant="accent" size="sm">
                          {rule.id}
                        </Chip>
                        <span className="text-xs font-bold text-text">{rule.title}</span>
                      </div>
                      <p className="text-xs text-text-muted">{rule.text}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: CLAIMS POLICY */}
          {activeTab === 'claims' && (
            <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-3">
              <div className="divide-y divide-border/60">
                {activeKit.rules
                  .filter((r) => r.category === 'Promotional claims' || r.category === 'Messaging')
                  .map((rule) => (
                    <div key={rule.id} className="py-3.5 space-y-1.5 first:pt-1">
                      <div className="flex items-center space-x-2">
                        <Chip variant="accent" size="sm">
                          {rule.id}
                        </Chip>
                        <span className="text-xs font-bold text-text">{rule.title}</span>
                        <Chip variant={rule.severity === 'Blocker' ? 'danger' : 'accent'} size="sm">
                          {rule.severity}
                        </Chip>
                      </div>
                      <p className="text-xs text-text-muted">{rule.text}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text">
              Edit Rule {editingRule.id} (Version {editingRule.version})
            </h3>

            {editError && (
              <div className="p-3 rounded-inner bg-danger/10 text-danger text-xs font-medium">
                {editError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Rule Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Rule Text & Guidance</label>
              <textarea
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">
                Version Change Reason (Mandatory)
              </label>
              <input
                type="text"
                placeholder="e.g. Updated for seasonal campaign guidance"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {!editReason.trim() ? (
                <span className="text-[11px] text-orange-text font-medium">Change reason required</span>
              ) : <span />}

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => updateRuleMutation.mutate()}
                  disabled={updateRuleMutation.isPending || !editReason.trim()}
                  title={!editReason.trim() ? 'Enter a version change reason above' : undefined}
                  className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold disabled:opacity-50 shadow-sm"
                >
                  {updateRuleMutation.isPending ? 'Publishing...' : 'Publish New Version'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
