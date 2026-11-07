import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit2,
  Plus,
  Building2,
  ShieldAlert,
  Languages,
  Download,
  Upload,
  FileText,
  ChevronDown,
} from 'lucide-react';
import {
  getBrandKits,
  updateBrandRule,
  createBrandRule,
  createBrandFact,
  updateBrandFact,
  createBrandKit,
  createClaimPattern,
  listClaimPatterns,
  createGlossaryTerm,
  listGlossaryTerms,
  exportBrandKit,
  bulkImportRules,
  extractGuidelineRules,
} from '../lib/api';
import { useApp } from '../lib/context';
import {
  RuleItem,
  FactItem,
  Severity,
  CreateRulePayload,
  CreateFactPayload,
  UpdateFactPayload,
  CreateBrandKitPayload,
  CreateClaimPayload,
  CreateGlossaryPayload,
  BulkImportItem,
} from '../lib/types';
import { StatCard, ScrollTabs, Chip, PillSelect } from '../components/ui';

export const BrandHub: React.FC = () => {
  const { role } = useApp();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlKit = searchParams.get('kit');

  const [selectedKitId, setSelectedKitId] = useState<string>(urlKit || '');
  const [activeTab, setActiveTab] = useState<string>('rules');

  // Brand Kit Creation modal state
  const [isCreatingKit, setIsCreatingKit] = useState(false);
  const [newKitName, setNewKitName] = useState('');
  const [newKitTagline, setNewKitTagline] = useState('');
  const [newKitIndustry, setNewKitIndustry] = useState('Technology');
  const [newKitDescription, setNewKitDescription] = useState('');
  const [newKitPrimaryColor, setNewKitPrimaryColor] = useState('#F26B2A');
  const [newKitVoiceTone, setNewKitVoiceTone] = useState('Clear, honest, evidence-backed');
  const [newKitReadingLevel, setNewKitReadingLevel] = useState(8);

  // Edit rule modal state
  const [editingRule, setEditingRule] = useState<RuleItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Create rule modal state
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [newRuleCategory, setNewRuleCategory] = useState('Guidelines');
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleSeverity, setNewRuleSeverity] = useState<Severity>('Major');
  const [newRuleBannedTerms, setNewRuleBannedTerms] = useState('');
  const [newRulePreferredReplacement, setNewRulePreferredReplacement] = useState('');
  const [newRuleAllowInQuotes, setNewRuleAllowInQuotes] = useState(false);
  const [newRulePlacementHint, setNewRulePlacementHint] = useState('any');
  const [newRuleReason, setNewRuleReason] = useState('');

  // Fact modals state
  const [isCreatingFact, setIsCreatingFact] = useState(false);
  const [newFactSubject, setNewFactSubject] = useState('');
  const [newFactValue, setNewFactValue] = useState('');
  const [newFactUnit, setNewFactUnit] = useState('');
  const [newFactPermittedWording, setNewFactPermittedWording] = useState('');
  const [newFactValidFrom, setNewFactValidFrom] = useState('2026-01-01');
  const [newFactValidTo, setNewFactValidTo] = useState('2026-12-31');
  const [newFactSource, setNewFactSource] = useState('Official Registry');

  const [editingFact, setEditingFact] = useState<FactItem | null>(null);
  const [editFactValue, setEditFactValue] = useState('');
  const [editFactPermittedWording, setEditFactPermittedWording] = useState('');
  const [editFactStatus, setEditFactStatus] = useState('active');

  // Claim modal state
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);
  const [newClaimPattern, setNewClaimPattern] = useState('');
  const [newClaimCategory, setNewClaimCategory] = useState('Performance');
  const [newClaimSeverity, setNewClaimSeverity] = useState<Severity>('Major');
  const [newClaimReason, setNewClaimReason] = useState('');
  const [newClaimFactId, setNewClaimFactId] = useState('');

  // Glossary modal state
  const [isCreatingGlossary, setIsCreatingGlossary] = useState(false);
  const [newGlossaryTerm, setNewGlossaryTerm] = useState('');
  const [newGlossaryCasing, setNewGlossaryCasing] = useState('');
  const [newGlossaryDefinition, setNewGlossaryDefinition] = useState('');

  // Import / Export modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'json' | 'extract'>('json');
  const [importJsonText, setImportJsonText] = useState('');
  const [guidelineDocText, setGuidelineDocText] = useState('');
  const [extractedRules, setExtractedRules] = useState<BulkImportItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const [modalError, setModalError] = useState<string | null>(null);

  const { data: kits, isLoading } = useQuery({
    queryKey: ['brandKits', role],
    queryFn: () => getBrandKits(role),
  });

  // Auto-select first kit if available
  useEffect(() => {
    if (kits && kits.length > 0) {
      if (!selectedKitId || !kits.some((k) => k.id === selectedKitId)) {
        const firstKit = kits[0];
        if (firstKit) {
          setSelectedKitId(firstKit.id);
        }
      }
    }
  }, [kits, selectedKitId]);

  const activeKit = kits?.find((k) => k.id === selectedKitId) || kits?.[0];

  // Queries for Claims and Glossary of active kit
  const { data: claimsList = [] } = useQuery({
    queryKey: ['claimsList', activeKit?.id],
    queryFn: () => (activeKit ? listClaimPatterns(activeKit.id) : Promise.resolve([])),
    enabled: !!activeKit?.id,
  });

  const { data: glossaryList = [] } = useQuery({
    queryKey: ['glossaryList', activeKit?.id],
    queryFn: () => (activeKit ? listGlossaryTerms(activeKit.id) : Promise.resolve([])),
    enabled: !!activeKit?.id,
  });

  const createKitMutation = useMutation({
    mutationFn: (payload: CreateBrandKitPayload) => createBrandKit(payload, role),
    onSuccess: (newKit) => {
      queryClient.invalidateQueries({ queryKey: ['brandKits'] });
      setIsCreatingKit(false);
      setSelectedKitId(newKit.id);
      setNewKitName('');
      setNewKitTagline('');
      setNewKitDescription('');
      setModalError(null);
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Failed to create brand kit');
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: () => {
      if (!editingRule || !activeKit) throw new Error('No rule selected');
      return updateBrandRule(
        activeKit.id,
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

  const createRuleMutation = useMutation({
    mutationFn: (payload: CreateRulePayload) => {
      if (!activeKit) throw new Error('No brand kit selected');
      return createBrandRule(activeKit.id, payload, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandKits'] });
      setIsCreatingRule(false);
      setNewRuleTitle('');
      setNewRuleText('');
      setNewRuleBannedTerms('');
      setNewRulePreferredReplacement('');
      setNewRuleReason('');
      setModalError(null);
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Failed to create rule');
    },
  });

  const createFactMutation = useMutation({
    mutationFn: (payload: CreateFactPayload) => {
      if (!activeKit) throw new Error('No brand kit selected');
      return createBrandFact(activeKit.id, payload, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandKits'] });
      setIsCreatingFact(false);
      setNewFactSubject('');
      setNewFactValue('');
      setNewFactUnit('');
      setNewFactPermittedWording('');
      setModalError(null);
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Failed to create fact');
    },
  });

  const updateFactMutation = useMutation({
    mutationFn: ({
      factId,
      payload,
    }: {
      factId: string;
      payload: UpdateFactPayload;
    }) => {
      if (!activeKit) throw new Error('No brand kit selected');
      return updateBrandFact(activeKit.id, factId, payload, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandKits'] });
      setEditingFact(null);
      setModalError(null);
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Failed to update fact');
    },
  });

  const createClaimMutation = useMutation({
    mutationFn: (payload: CreateClaimPayload) => {
      if (!activeKit) throw new Error('No brand kit selected');
      return createClaimPattern(activeKit.id, payload, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claimsList', activeKit?.id] });
      setIsCreatingClaim(false);
      setNewClaimPattern('');
      setNewClaimReason('');
      setNewClaimFactId('');
      setModalError(null);
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Failed to add claim policy');
    },
  });

  const createGlossaryMutation = useMutation({
    mutationFn: (payload: CreateGlossaryPayload) => {
      if (!activeKit) throw new Error('No brand kit selected');
      return createGlossaryTerm(activeKit.id, payload, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glossaryList', activeKit?.id] });
      setIsCreatingGlossary(false);
      setNewGlossaryTerm('');
      setNewGlossaryCasing('');
      setNewGlossaryDefinition('');
      setModalError(null);
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Failed to add glossary term');
    },
  });

  const importRulesMutation = useMutation({
    mutationFn: (items: BulkImportItem[]) => {
      if (!activeKit) throw new Error('No brand kit selected');
      return bulkImportRules(activeKit.id, items, role);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brandKits'] });
      setImportMsg(data.message);
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportMsg(null);
        setImportJsonText('');
        setExtractedRules([]);
      }, 1000);
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Import failed');
    },
  });

  const openEditModal = (rule: RuleItem) => {
    setEditingRule(rule);
    setEditTitle(rule.title);
    setEditText(rule.text);
    setEditReason('');
    setEditError(null);
  };

  const openCreateRuleModal = (category: string) => {
    setNewRuleCategory(category);
    setNewRuleTitle('');
    setNewRuleText('');
    setNewRuleSeverity('Major');
    setNewRuleBannedTerms('');
    setNewRulePreferredReplacement('');
    setNewRuleAllowInQuotes(false);
    setNewRulePlacementHint('any');
    setNewRuleReason('');
    setModalError(null);
    setIsCreatingRule(true);
  };

  const openEditFactModal = (fact: FactItem) => {
    setEditingFact(fact);
    setEditFactValue(fact.value);
    setEditFactPermittedWording(fact.permitted_wording);
    setEditFactStatus(fact.status);
    setModalError(null);
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
      label: 'Terminology & Glossary',
      count:
        (activeKit?.rules.filter((r) => r.category === 'Terminology').length || 0) +
        glossaryList.length,
    },
    {
      id: 'claims',
      label: 'Claims Policy',
      count:
        (activeKit?.rules.filter((r) => r.category === 'Promotional claims').length || 0) +
        claimsList.length,
    },
  ];

  const canManage = role === 'Brand manager' || role === 'Admin';

  return (
    <div className="space-y-6 max-w-app mx-auto py-2 w-full min-w-0">
      {/* Title & Brand Kit Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text break-anywhere">Brand Knowledge Hub</h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed break-anywhere">
            Approved guidelines, facts register, terminology constraints, and claims policies.
          </p>
        </div>

        {/* Mobile Brand Kit Select (< sm) */}
        <div className="sm:hidden w-full space-y-2 min-w-0">
          <PillSelect
            value={selectedKitId}
            onChange={setSelectedKitId}
            options={kits?.map((k) => ({ value: k.id, label: k.name })) || []}
            ariaLabel="Select Brand Kit"
            className="w-full"
          />
        </div>

        {/* Brand Kit Selector Pills (>= sm) */}
        <div className="hidden sm:flex flex-wrap items-center gap-1.5 p-1 rounded-pill bg-surface-2 border border-border/70 self-start sm:self-auto min-w-0">
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

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setIsCreatingKit(true);
              }}
              className="px-3 py-1.5 rounded-pill text-xs font-semibold text-orange-text hover:bg-surface transition-all flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Kit</span>
            </button>
          )}

          {canManage && activeKit && (
            <>
              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setIsImportModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-pill text-xs font-semibold text-text hover:bg-surface transition-all flex items-center space-x-1"
                title="Bulk import rules or extract from document"
              >
                <Upload className="w-3.5 h-3.5 text-orange-text" />
                <span>Import</span>
              </button>

              <button
                type="button"
                onClick={() => exportBrandKit(activeKit.id, 'json')}
                className="px-3 py-1.5 rounded-pill text-xs font-semibold text-text hover:bg-surface transition-all flex items-center space-x-1"
                title="Export brand kit JSON"
              >
                <Download className="w-3.5 h-3.5 text-text-muted" />
                <span>Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State when workspace has no brand kits */}
      {(!kits || kits.length === 0) && (
        <div className="py-16 text-center space-y-4 p-8 rounded-card border border-border bg-surface shadow-floating max-w-lg mx-auto w-full min-w-0">
          <Building2 className="w-12 h-12 text-orange-text mx-auto" />
          <h2 className="text-xl font-bold text-text">No brand kits yet</h2>
          <p className="text-xs text-text-muted leading-relaxed break-anywhere">
            Add your brand kit to configure guidelines, approved facts, terminology constraints, and start running reviews.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setIsCreatingKit(true)}
              className="px-5 py-2.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-sm transition-all"
            >
              + Create First Brand Kit
            </button>
          )}
        </div>
      )}

      {activeKit && (
        <div className="space-y-6 w-full min-w-0">
          {/* Row of Three Small StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full min-w-0">
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
          <div className="p-4 sm:p-6 rounded-card border border-border bg-surface shadow-floating flex flex-col md:flex-row justify-between gap-4 w-full min-w-0">
            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="text-xs uppercase tracking-wider text-orange-text font-bold">
                {activeKit.industry}
              </span>
              <h2 className="text-xl font-extrabold text-text tracking-tight break-anywhere">{activeKit.name}</h2>
              <p className="text-xs text-text-muted leading-relaxed max-w-xl break-anywhere">
                {activeKit.description}
              </p>
            </div>
            <div className="text-xs text-text-muted space-y-1 md:text-right border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-6 min-w-0 shrink-0">
              <div className="break-anywhere">
                <strong className="text-text">Voice & Tone: </strong>
                {activeKit.voice_tone}
              </div>
              <div>
                <strong className="text-text">Reading Level Target: </strong>
                Grade {activeKit.target_reading_level}
              </div>
            </div>
          </div>

          {/* Navigation ScrollTabs */}
          <ScrollTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* TAB 1: RULES & GUIDELINES */}
          {activeTab === 'rules' && (
            <div className="p-4 sm:p-5 rounded-card border border-border bg-surface shadow-floating space-y-3 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-between pb-2 border-b border-border/60 gap-2 min-w-0">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Active Brand Rules
                </span>
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => openCreateRuleModal('Guidelines')}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Guideline</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-text-muted">
                      Read-only view (Brand manager role required to edit)
                    </span>
                  )}
                </div>
              </div>

              {activeRules.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  No active rules yet. Add your brand rules to begin evidence-backed reviews.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {activeKit.rules.map((rule) => (
                    <div key={rule.id} className="py-4 space-y-2 first:pt-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                          <Chip variant="accent" size="sm">
                            {rule.id}
                          </Chip>
                          <span className="text-xs font-bold text-text break-anywhere">{rule.title}</span>
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

                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => openEditModal(rule)}
                            className="p-1.5 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 transition-colors shrink-0"
                            title="Edit rule and publish new version"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>

                      <p className="text-xs text-text-muted leading-relaxed break-anywhere">{rule.text}</p>

                      {/* Desktop Metadata Line (>= 768px) */}
                      <div className="hidden md:flex flex-wrap items-center gap-2 text-[11px] font-mono text-text-muted">
                        <span className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-pill border border-border/60">
                          <span className="text-text-muted">Category:</span>
                          <span className="text-text font-semibold">{rule.category}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-pill border border-border/60">
                          <span className="text-text-muted">v</span>
                          <span className="text-text font-semibold">{rule.version}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-pill border border-border/60">
                          <span className="text-text-muted">Owner:</span>
                          <span className="text-text font-semibold">{rule.owner}</span>
                        </span>
                        {rule.banned_terms && rule.banned_terms.length > 0 && (
                          <span className="inline-flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-pill border border-orange-500/20 text-orange-text break-anywhere">
                            <span>Banned:</span>
                            <span className="font-semibold">{rule.banned_terms.join(', ')}</span>
                          </span>
                        )}
                      </div>

                      {/* Mobile & Tablet Metadata with Details Accordion (< 768px) */}
                      <div className="md:hidden space-y-1.5 text-[11px] font-mono text-text-muted">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-pill border border-border/60">
                            <span className="text-text-muted">Category:</span>
                            <span className="text-text font-semibold">{rule.category}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-pill border border-border/60">
                            <span className="text-text-muted">v</span>
                            <span className="text-text font-semibold">{rule.version}</span>
                          </span>
                        </div>

                        {(rule.owner || (rule.banned_terms && rule.banned_terms.length > 0)) && (
                          <details className="group pt-0.5">
                            <summary className="cursor-pointer text-[11px] text-orange-text hover:underline inline-flex items-center gap-1 select-none font-sans font-medium">
                              <span>Details</span>
                              <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform duration-150 inline" />
                            </summary>
                            <div className="mt-1.5 p-2 rounded-inner bg-surface-2 border border-border/60 space-y-1 text-[11px] font-mono">
                              {rule.owner && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-text-muted">Owner:</span>
                                  <span className="text-text font-semibold break-anywhere">{rule.owner}</span>
                                </div>
                              )}
                              {rule.banned_terms && rule.banned_terms.length > 0 && (
                                <div className="flex flex-col gap-0.5 text-orange-text break-anywhere">
                                  <span className="font-semibold">Banned Terms:</span>
                                  <span>{rule.banned_terms.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FACTS REGISTER */}
          {activeTab === 'facts' && (
            <div className="p-4 sm:p-5 rounded-card border border-border bg-surface shadow-floating space-y-3 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-between pb-2 border-b border-border/60 gap-2 min-w-0">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Approved Facts Register
                </span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalError(null);
                      setIsCreatingFact(true);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Fact</span>
                  </button>
                )}
              </div>

              {activeKit.facts.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  No facts recorded yet. Add verifiable specifications and pricing to ground reviews.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {activeKit.facts.map((fact) => (
                    <div key={fact.id} className="py-4 space-y-2 first:pt-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                          <Chip variant="accent" size="sm">
                            {fact.id}
                          </Chip>
                          <span className="text-xs font-bold text-text break-anywhere">{fact.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <Chip variant={fact.status === 'active' ? 'success' : 'neutral'} size="sm">
                            {fact.status}
                          </Chip>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => openEditFactModal(fact)}
                              className="p-1.5 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                              title="Edit or supersede fact"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-inner bg-surface-2 font-mono text-xs text-text break-anywhere">
                        <strong className="text-orange-text">Permitted wording:</strong> &ldquo;{fact.permitted_wording}&rdquo;
                      </div>

                      {/* Desktop Facts Metadata (>= 768px) */}
                      <div className="hidden md:flex flex-wrap items-center gap-2 text-[11px] font-mono text-text-muted">
                        <span className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-pill border border-border/60">
                          <span className="text-text-muted">Value:</span>
                          <span className="text-text font-semibold">{fact.value} {fact.unit}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-pill border border-border/60">
                          <span className="text-text-muted">Valid:</span>
                          <span className="text-text font-semibold">{fact.valid_from} to {fact.valid_to}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-pill border border-border/60">
                          <span className="text-text-muted">Source:</span>
                          <span className="text-text font-semibold">{fact.source}</span>
                        </span>
                      </div>

                      {/* Mobile & Tablet Facts Metadata with Details Accordion (< 768px) */}
                      <div className="md:hidden space-y-1.5 text-[11px] font-mono text-text-muted">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 rounded-pill border border-border/60">
                            <span className="text-text-muted">Value:</span>
                            <span className="text-text font-semibold">{fact.value} {fact.unit}</span>
                          </span>
                        </div>

                        <details className="group pt-0.5">
                          <summary className="cursor-pointer text-[11px] text-orange-text hover:underline inline-flex items-center gap-1 select-none font-sans font-medium">
                            <span>Details</span>
                            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform duration-150 inline" />
                          </summary>
                          <div className="mt-1.5 p-2 rounded-inner bg-surface-2 border border-border/60 space-y-1 text-[11px] font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-text-muted">Valid:</span>
                              <span className="text-text font-semibold">{fact.valid_from} to {fact.valid_to}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-text-muted">Source:</span>
                              <span className="text-text font-semibold break-anywhere">{fact.source}</span>
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TERMINOLOGY & GLOSSARY */}
          {activeTab === 'glossary' && (
            <div className="p-4 sm:p-5 rounded-card border border-border bg-surface shadow-floating space-y-4 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-between pb-2 border-b border-border/60 gap-2 min-w-0">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Brand Glossary & Protected Casing
                </span>
                {canManage && (
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => openCreateRuleModal('Terminology')}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Term Rule</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalError(null);
                        setIsCreatingGlossary(true);
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Glossary Term</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Glossary Terms List */}
              {glossaryList.length > 0 && (
                <div className="space-y-2 w-full min-w-0">
                  <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Approved Brand Terms ({glossaryList.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                    {glossaryList.map((g, idx) => (
                      <div key={idx} className="p-3.5 rounded-inner bg-surface-2 border border-border space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-xs text-text break-anywhere">{g.preferred_casing}</span>
                          <span className="text-[10px] font-mono text-text-muted shrink-0">Exact Casing</span>
                        </div>
                        {g.definition && (
                          <p className="text-[11px] text-text-muted leading-relaxed break-anywhere">{g.definition}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terminology Rules from rules */}
              <div className="space-y-2 pt-2 w-full min-w-0">
                <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Terminology Rules & Conventions
                </div>
                <div className="divide-y divide-border/60">
                  {activeKit.rules
                    .filter((r) => r.category === 'Terminology')
                    .map((rule) => (
                      <div key={rule.id} className="py-3 space-y-1.5 first:pt-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center space-x-2 flex-wrap gap-1 min-w-0">
                            <Chip variant="accent" size="sm">
                              {rule.id}
                            </Chip>
                            <span className="text-xs font-bold text-text break-anywhere">{rule.title}</span>
                          </div>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => openEditModal(rule)}
                              className="p-1 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 transition-colors shrink-0"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-text-muted break-anywhere">{rule.text}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLAIMS POLICY */}
          {activeTab === 'claims' && (
            <div className="p-4 sm:p-5 rounded-card border border-border bg-surface shadow-floating space-y-4 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-between pb-2 border-b border-border/60 gap-2 min-w-0">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Promotional Claims & Substantiation Policy
                </span>
                {canManage && (
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => openCreateRuleModal('Promotional claims')}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Claims Rule</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalError(null);
                        setIsCreatingClaim(true);
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Claim Policy</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Claims Patterns List */}
              {claimsList.length > 0 && (
                <div className="space-y-2 w-full min-w-0">
                  <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Restricted Claim Patterns ({claimsList.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                    {claimsList.map((c, idx) => (
                      <div key={idx} className="p-3.5 rounded-inner bg-surface-2 border border-border space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-orange-text break-anywhere">
                            &ldquo;{c.pattern}&rdquo;
                          </span>
                          <Chip variant={c.severity === 'Blocker' ? 'danger' : 'accent'} size="sm">
                            {c.severity || 'Major'}
                          </Chip>
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed break-anywhere">{c.reason}</p>
                        {c.substantiating_fact_id && (
                          <div className="text-[10px] font-mono text-text break-anywhere">
                            Substantiating Fact ID: <strong>{c.substantiating_fact_id}</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Claims Rules */}
              <div className="space-y-2 pt-2 w-full min-w-0">
                <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Claims Compliance Rules
                </div>
                <div className="divide-y divide-border/60">
                  {activeKit.rules
                    .filter((r) => r.category === 'Promotional claims' || r.category === 'Messaging')
                    .map((rule) => (
                      <div key={rule.id} className="py-3 space-y-1.5 first:pt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Chip variant="accent" size="sm">
                              {rule.id}
                            </Chip>
                            <span className="text-xs font-bold text-text">{rule.title}</span>
                            <Chip variant={rule.severity === 'Blocker' ? 'danger' : 'accent'} size="sm">
                              {rule.severity}
                            </Chip>
                          </div>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => openEditModal(rule)}
                              className="p-1 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">{rule.text}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Create Brand Kit Modal */}
      {isCreatingKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-text flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-orange-text" />
              <span>Create New Brand Kit</span>
            </h3>

            {modalError && (
              <div className="p-3 rounded-inner bg-danger/10 text-danger text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Brand Name *</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={newKitName}
                onChange={(e) => setNewKitName(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Industry</label>
                <input
                  type="text"
                  placeholder="e.g. Fintech"
                  value={newKitIndustry}
                  onChange={(e) => setNewKitIndustry(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Primary Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newKitPrimaryColor}
                    onChange={(e) => setNewKitPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={newKitPrimaryColor}
                    onChange={(e) => setNewKitPrimaryColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs font-mono text-text"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Tagline / Mission</label>
              <input
                type="text"
                placeholder="e.g. Autonomous cloud security made simple"
                value={newKitTagline}
                onChange={(e) => setNewKitTagline(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Description</label>
              <textarea
                rows={2}
                placeholder="Brief summary of brand positioning and market segment..."
                value={newKitDescription}
                onChange={(e) => setNewKitDescription(e.target.value)}
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Voice & Tone Summary</label>
              <input
                type="text"
                placeholder="e.g. Precise, grounded, friendly, never sensational"
                value={newKitVoiceTone}
                onChange={(e) => setNewKitVoiceTone(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Target Reading Level (Grade {newKitReadingLevel})</label>
              <input
                type="number"
                min={4}
                max={16}
                value={newKitReadingLevel}
                onChange={(e) => setNewKitReadingLevel(Number(e.target.value) || 8)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingKit(false)}
                className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newKitName.trim()) return;
                  createKitMutation.mutate({
                    name: newKitName.trim(),
                    tagline: newKitTagline.trim(),
                    industry: newKitIndustry.trim(),
                    description: newKitDescription.trim(),
                    primary_color: newKitPrimaryColor,
                    voice_tone: newKitVoiceTone.trim(),
                    target_reading_level: newKitReadingLevel,
                  });
                }}
                disabled={createKitMutation.isPending || !newKitName.trim()}
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm"
              >
                {createKitMutation.isPending ? 'Creating...' : 'Create Brand Kit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Rule Modal */}
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
                  className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold disabled:opacity-50 shadow-sm"
                >
                  {updateRuleMutation.isPending ? 'Publishing...' : 'Publish New Version'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Create Rule Modal with Real-time Finding Preview */}
      {isCreatingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-text">
              Create New Brand Rule ({newRuleCategory})
            </h3>

            {modalError && (
              <div className="p-3 rounded-inner bg-danger/10 text-danger text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Rule Title *</label>
              <input
                type="text"
                placeholder="e.g. Accurate Battery Specifications"
                value={newRuleTitle}
                onChange={(e) => setNewRuleTitle(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Guideline Text & Instructions *</label>
              <textarea
                rows={3}
                placeholder="Describe what content is allowed or forbidden..."
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Severity</label>
                <select
                  value={newRuleSeverity}
                  onChange={(e) => setNewRuleSeverity(e.target.value as Severity)}
                  className="w-full px-3 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Blocker">Blocker</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                  <option value="Info">Info</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Placement Hint</label>
                <select
                  value={newRulePlacementHint}
                  onChange={(e) => setNewRulePlacementHint(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="any">Anywhere</option>
                  <option value="headline">Headlines only</option>
                  <option value="body">Body copy only</option>
                  <option value="CTA">Call to action only</option>
                  <option value="disclaimers">Disclaimers only</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">
                Banned Terms (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. cheap, miracle, 100% guarantee"
                value={newRuleBannedTerms}
                onChange={(e) => setNewRuleBannedTerms(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">
                Preferred Replacement (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. accessible value"
                value={newRulePreferredReplacement}
                onChange={(e) => setNewRulePreferredReplacement(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="allow-quotes-check"
                checked={newRuleAllowInQuotes}
                onChange={(e) => setNewRuleAllowInQuotes(e.target.checked)}
                className="rounded border-border text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="allow-quotes-check" className="text-xs text-text-muted select-none cursor-pointer">
                Allow banned terms when enclosed inside direct quotes (&ldquo;...&rdquo;)
              </label>
            </div>

            {/* Live Finding Preview */}
            <div className="p-3.5 rounded-inner bg-surface-2 border border-border space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Real-Time Finding Preview
              </span>
              <div className="text-xs font-mono space-y-1">
                <div>
                  <span className="text-text-muted">Flagged: </span>
                  <span className="flagged-span">
                    &ldquo;{newRuleBannedTerms.split(',')[0]?.trim() || 'example term'}&rdquo;
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Correction: </span>
                  <span className="font-semibold text-success-text">
                    {newRulePreferredReplacement || 'Remove or rewrite this phrase'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingRule(false)}
                className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newRuleTitle.trim() || !newRuleText.trim()) return;
                  const bannedList = newRuleBannedTerms
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                  createRuleMutation.mutate({
                    title: newRuleTitle,
                    text: newRuleText,
                    category: newRuleCategory,
                    severity: newRuleSeverity,
                    banned_terms: bannedList,
                    preferred_replacement: newRulePreferredReplacement.trim() || undefined,
                    allow_in_quotes: newRuleAllowInQuotes,
                    placement_hint: newRulePlacementHint,
                    reason: newRuleReason || undefined,
                  });
                }}
                disabled={
                  createRuleMutation.isPending ||
                  !newRuleTitle.trim() ||
                  !newRuleText.trim()
                }
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold disabled:opacity-50 shadow-sm"
              >
                {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Create Fact Modal */}
      {isCreatingFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-text">
              Add Approved Grounding Fact
            </h3>

            {modalError && (
              <div className="p-3 rounded-inner bg-danger/10 text-danger text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Subject / Entity *</label>
              <input
                type="text"
                placeholder="e.g. Free Tier Account Limit"
                value={newFactSubject}
                onChange={(e) => setNewFactSubject(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Value *</label>
                <input
                  type="text"
                  placeholder="e.g. 5 linked accounts"
                  value={newFactValue}
                  onChange={(e) => setNewFactValue(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Unit</label>
                <input
                  type="text"
                  placeholder="e.g. accounts / INR"
                  value={newFactUnit}
                  onChange={(e) => setNewFactUnit(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Permitted Wording *</label>
              <textarea
                rows={2}
                placeholder="Exact canonical phrase allowed in claims..."
                value={newFactPermittedWording}
                onChange={(e) => setNewFactPermittedWording(e.target.value)}
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Valid From</label>
                <input
                  type="text"
                  value={newFactValidFrom}
                  onChange={(e) => setNewFactValidFrom(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Valid To</label>
                <input
                  type="text"
                  value={newFactValidTo}
                  onChange={(e) => setNewFactValidTo(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Source Ref / Doc</label>
              <input
                type="text"
                value={newFactSource}
                onChange={(e) => setNewFactSource(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingFact(false)}
                className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newFactSubject.trim() || !newFactValue.trim() || !newFactPermittedWording.trim()) return;
                  createFactMutation.mutate({
                    subject: newFactSubject,
                    value: newFactValue,
                    unit: newFactUnit,
                    permitted_wording: newFactPermittedWording,
                    valid_from: newFactValidFrom,
                    valid_to: newFactValidTo,
                    source: newFactSource,
                  });
                }}
                disabled={
                  createFactMutation.isPending ||
                  !newFactSubject.trim() ||
                  !newFactValue.trim() ||
                  !newFactPermittedWording.trim()
                }
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold disabled:opacity-50 shadow-sm"
              >
                {createFactMutation.isPending ? 'Saving...' : 'Add Fact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Edit Fact Modal */}
      {editingFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text">
              Edit Fact: {editingFact.subject}
            </h3>

            {modalError && (
              <div className="p-3 rounded-inner bg-danger/10 text-danger text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Value</label>
              <input
                type="text"
                value={editFactValue}
                onChange={(e) => setEditFactValue(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Permitted Wording</label>
              <textarea
                rows={3}
                value={editFactPermittedWording}
                onChange={(e) => setEditFactPermittedWording(e.target.value)}
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Status</label>
              <select
                value={editFactStatus}
                onChange={(e) => setEditFactStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="active">active</option>
                <option value="superseded">superseded</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingFact(null)}
                className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  updateFactMutation.mutate({
                    factId: editingFact.id,
                    payload: {
                      value: editFactValue,
                      permitted_wording: editFactPermittedWording,
                      status: editFactStatus,
                    },
                  })
                }
                disabled={updateFactMutation.isPending}
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold shadow-sm"
              >
                {updateFactMutation.isPending ? 'Updating...' : 'Update Fact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Create Claim Pattern Modal */}
      {isCreatingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-orange-text" />
              <span>Add Restricted Claim Pattern</span>
            </h3>

            {modalError && (
              <div className="p-3 rounded-inner bg-danger/10 text-danger text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Restricted Pattern / Phrase *</label>
              <input
                type="text"
                placeholder="e.g. 100% secure, guaranteed return, clinically proven"
                value={newClaimPattern}
                onChange={(e) => setNewClaimPattern(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Category</label>
                <select
                  value={newClaimCategory}
                  onChange={(e) => setNewClaimCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ESG/Green">ESG / Green</option>
                  <option value="Performance">Performance / Returns</option>
                  <option value="Pricing">Pricing / Discount</option>
                  <option value="Superiority">Superiority / Superlative</option>
                  <option value="Medical">Medical / Health</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text">Severity</label>
                <select
                  value={newClaimSeverity}
                  onChange={(e) => setNewClaimSeverity(e.target.value as Severity)}
                  className="w-full px-3 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Blocker">Blocker</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Substantiating Fact ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. F-15 (Fact that proves this claim if present)"
                value={newClaimFactId}
                onChange={(e) => setNewClaimFactId(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Enforcement Reason *</label>
              <textarea
                rows={2}
                placeholder="Why is this claim restricted without verifiable evidence?..."
                value={newClaimReason}
                onChange={(e) => setNewClaimReason(e.target.value)}
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingClaim(false)}
                className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newClaimPattern.trim() || !newClaimReason.trim()) return;
                  createClaimMutation.mutate({
                    pattern: newClaimPattern.trim(),
                    category: newClaimCategory,
                    severity: newClaimSeverity,
                    substantiating_fact_id: newClaimFactId.trim() || undefined,
                    reason: newClaimReason.trim(),
                  });
                }}
                disabled={createClaimMutation.isPending || !newClaimPattern.trim() || !newClaimReason.trim()}
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold disabled:opacity-50 shadow-sm"
              >
                {createClaimMutation.isPending ? 'Adding...' : 'Add Claim Policy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Create Glossary Term Modal */}
      {isCreatingGlossary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text flex items-center space-x-2">
              <Languages className="w-4 h-4 text-orange-text" />
              <span>Add Brand Glossary Term</span>
            </h3>

            {modalError && (
              <div className="p-3 rounded-inner bg-danger/10 text-danger text-xs font-medium">
                {modalError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Term Word *</label>
              <input
                type="text"
                placeholder="e.g. Masala Chai / LedgerLeaf Plus"
                value={newGlossaryTerm}
                onChange={(e) => setNewGlossaryTerm(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Approved Preferred Casing *</label>
              <input
                type="text"
                placeholder="e.g. Masala Chai (exact capitalisation required)"
                value={newGlossaryCasing}
                onChange={(e) => setNewGlossaryCasing(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Definition / Context</label>
              <textarea
                rows={2}
                placeholder="Usage context and approved definition..."
                value={newGlossaryDefinition}
                onChange={(e) => setNewGlossaryDefinition(e.target.value)}
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingGlossary(false)}
                className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newGlossaryTerm.trim() || !newGlossaryCasing.trim()) return;
                  createGlossaryMutation.mutate({
                    term: newGlossaryTerm.trim(),
                    preferred_casing: newGlossaryCasing.trim(),
                    definition: newGlossaryDefinition.trim() || undefined,
                  });
                }}
                disabled={createGlossaryMutation.isPending || !newGlossaryTerm.trim() || !newGlossaryCasing.trim()}
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold disabled:opacity-50 shadow-sm"
              >
                {createGlossaryMutation.isPending ? 'Adding...' : 'Add Term'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Bulk Import & Guideline Extraction Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-text">Import Brand Rules & Guidelines</h3>
                <p className="text-xs text-text-muted">Import into active brand kit: {activeKit?.name}</p>
              </div>
              <div className="flex items-center space-x-1 p-1 rounded-pill bg-surface-2 border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setImportTab('json')}
                  className={`px-3 py-1 rounded-pill font-medium transition-colors ${
                    importTab === 'json' ? 'bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange' : 'text-text-muted hover:text-text'
                  }`}
                >
                  JSON / Template
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab('extract')}
                  className={`px-3 py-1 rounded-pill font-medium transition-colors ${
                    importTab === 'extract' ? 'bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange' : 'text-text-muted hover:text-text'
                  }`}
                >
                  Extract from Document
                </button>
              </div>
            </div>

            {importMsg && (
              <div className="p-3 rounded-inner bg-lime/10 border border-lime text-on-lime text-xs font-semibold">
                {importMsg}
              </div>
            )}

            {modalError && (
              <div className="p-3 rounded-inner bg-danger/10 text-danger text-xs font-medium">
                {modalError}
              </div>
            )}

            {importTab === 'json' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Paste JSON array of rules:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = [
                        {
                          category: 'Terminology',
                          title: 'Prohibit Unapproved Superlatives',
                          text: 'Never use superlative claims without factual substantiation.',
                          severity: 'Major',
                          banned_terms: ['industry-leading', 'best-in-class'],
                          preferred_replacement: 'proven'
                        },
                        {
                          category: 'Messaging',
                          title: 'Pricing Disclaimer',
                          text: 'Prices subject to local taxes and applicable delivery fees.',
                          severity: 'Blocker',
                          banned_terms: [],
                          preferred_replacement: 'Prices subject to local taxes and applicable delivery fees.'
                        }
                      ];
                      setImportJsonText(JSON.stringify(sample, null, 2));
                    }}
                    className="text-orange-text hover:underline font-semibold"
                  >
                    Load Sample Template
                  </button>
                </div>

                <textarea
                  rows={8}
                  placeholder="Paste JSON rules array here..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-inner border border-border bg-surface-2 text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                <div className="flex items-center justify-end space-x-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(importJsonText);
                        const items = Array.isArray(parsed) ? parsed : [parsed];
                        importRulesMutation.mutate(items);
                      } catch (e) {
                        setModalError('Invalid JSON format: ' + (e as Error).message);
                      }
                    }}
                    disabled={importRulesMutation.isPending || !importJsonText.trim()}
                    className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm"
                  >
                    {importRulesMutation.isPending ? 'Importing...' : 'Validate & Import'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-text-muted">
                  Paste raw guideline text (or handbook excerpt). The parser detects mandatory statements, banned terms, and spelling constraints:
                </p>

                <textarea
                  rows={6}
                  placeholder="e.g. Guidelines: Never use 'cheap'. Always include the pricing disclaimer. Products must be spelled as..."
                  value={guidelineDocText}
                  onChange={(e) => setGuidelineDocText(e.target.value)}
                  className="w-full p-3 text-xs rounded-inner border border-border bg-surface-2 text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!activeKit || !guidelineDocText.trim()) return;
                      setIsExtracting(true);
                      setModalError(null);
                      try {
                        const res = await extractGuidelineRules(activeKit.id, guidelineDocText, role);
                        setExtractedRules(res.proposed_items || []);
                      } catch (err) {
                        setModalError((err as Error).message || 'Extraction failed');
                      } finally {
                        setIsExtracting(false);
                      }
                    }}
                    disabled={isExtracting || !guidelineDocText.trim()}
                    className="px-4 py-1.5 rounded-pill border border-border bg-surface-2 text-xs font-semibold text-text hover:bg-surface flex items-center space-x-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-orange-text" />
                    <span>{isExtracting ? 'Extracting...' : 'Extract Draft Rules'}</span>
                  </button>

                  {extractedRules.length > 0 && (
                    <span className="text-xs text-orange-text font-bold">
                      {extractedRules.length} draft rule(s) detected
                    </span>
                  )}
                </div>

                {extractedRules.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <span className="text-xs font-bold text-text block">Preview Proposed Rules:</span>
                    <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-inner">
                      {extractedRules.map((r, i) => (
                        <div key={i} className="p-2.5 bg-surface-2/40 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-text">{r.title}</span>
                            <Chip variant="neutral" size="sm">{r.category} · {r.severity}</Chip>
                          </div>
                          <p className="text-text-muted text-[11px] line-clamp-2">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (extractedRules.length === 0) return;
                      importRulesMutation.mutate(extractedRules);
                    }}
                    disabled={importRulesMutation.isPending || extractedRules.length === 0}
                    className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm"
                  >
                    {importRulesMutation.isPending ? 'Importing...' : `Approve & Import (${extractedRules.length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
