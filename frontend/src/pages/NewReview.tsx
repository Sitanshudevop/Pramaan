import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { getBrandKits, getSampleDrafts, createReview } from '../lib/api';
import { useApp } from '../lib/context';
import { SampleDraft } from '../lib/types';
import { PillSelect, Chip } from '../components/ui';

export const NewReview: React.FC = () => {
  const navigate = useNavigate();
  const { role, confidentialMode } = useApp();

  // Queries
  const { data: brandKits, isLoading: loadingKits } = useQuery({
    queryKey: ['brandKits', role],
    queryFn: () => getBrandKits(role),
  });

  const { data: samples } = useQuery({
    queryKey: ['sampleDrafts'],
    queryFn: () => getSampleDrafts(),
  });

  // Form State
  const [selectedKit, setSelectedKit] = useState<string>('kettle-and-co');
  const [content, setContent] = useState<string>('');
  const [contentType, setContentType] = useState<string>('Promotional Email');
  const [aiDeclared, setAiDeclared] = useState<boolean>(false);

  // Purpose Card State
  const [goal, setGoal] = useState<string>('');
  const [audience, setAudience] = useState<string>('');
  const [keyMessage, setKeyMessage] = useState<string>('');
  const [cta, setCta] = useState<string>('');
  const [lockedPhrasesStr, setLockedPhrasesStr] = useState<string>('Masala Chai');

  const [formError, setFormError] = useState<string | null>(null);

  // Auto-select first kit
  useEffect(() => {
    if (brandKits && brandKits.length > 0 && !selectedKit) {
      const first = brandKits[0];
      if (first) {
        setSelectedKit(first.id);
      }
    }
  }, [brandKits, selectedKit]);

  // "Use Sample" pre-fill
  const applySample = (sample: SampleDraft) => {
    setSelectedKit(sample.brand_kit_id);
    setContent(sample.content);
    setContentType(sample.content_type);
    setAiDeclared(sample.ai_declared);
    setGoal(sample.purpose_card.goal);
    setAudience(sample.purpose_card.audience);
    setKeyMessage(sample.purpose_card.key_message);
    setCta(sample.purpose_card.call_to_action);
    setLockedPhrasesStr(sample.purpose_card.locked_phrases.join(', '));
    setFormError(null);
  };

  // Review Submission Mutation
  const reviewMutation = useMutation({
    mutationFn: () => {
      const lockedPhrases = lockedPhrasesStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      return createReview(
        {
          brand_kit_id: selectedKit,
          content,
          content_type: contentType,
          purpose_card: {
            goal,
            audience,
            key_message: keyMessage,
            call_to_action: cta,
            locked_phrases: lockedPhrases,
            content_type: contentType,
            ai_declared: aiDeclared,
          },
          ai_declared: aiDeclared,
        },
        role,
        confidentialMode
      );
    },
    onSuccess: (data) => {
      navigate(`/app/review/${data.id}`);
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Failed to submit review');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setFormError('Please enter or paste content to review.');
      return;
    }
    if (!goal.trim() || !audience.trim() || !keyMessage.trim() || !cta.trim()) {
      setFormError('Please complete all Purpose Card fields.');
      return;
    }
    setFormError(null);
    reviewMutation.mutate();
  };

  const kitOptions =
    brandKits?.map((k) => ({
      value: k.id,
      label: `${k.name} (${k.industry})`,
    })) || [];

  const contentTypeOptions = [
    { value: 'Promotional Email', label: 'Promotional Email' },
    { value: 'Social Media Post', label: 'Social Media Post' },
    { value: 'In-App Announcement', label: 'In-App Announcement' },
    { value: 'Landing Page Copy', label: 'Landing Page Copy' },
  ];

  return (
    <div className="max-w-[800px] mx-auto py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-text">New Content Review</h1>
        <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
          Evaluate draft copy against active rules, claims policies, and approved facts before publishing.
        </p>
      </div>

      {/* Quick Judge Sample Text Buttons */}
      {samples && samples.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 pb-2">
          <span className="text-[11px] font-semibold text-text-muted mr-1">Try Sample:</span>
          {samples.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => applySample(s)}
              className="px-3 py-1 rounded-pill text-xs font-medium border border-border bg-surface text-text hover:border-orange-500/50 hover:bg-surface-2 transition-all shadow-xs flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-orange-text" />
              <span>Sample {idx + 1} ({s.brand_kit_id === 'kettle-and-co' ? 'Kettle & Co.' : 'LedgerLeaf'})</span>
            </button>
          ))}
        </div>
      )}

      {/* Single Centered Main Card */}
      <div className="p-6 sm:p-8 rounded-card border border-border bg-surface shadow-floating">
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="p-3.5 rounded-inner bg-danger/10 border border-danger/30 text-danger text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{formError}</span>
            </div>
          )}

          {/* Section: Configuration Controls (Pill Selects) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border/80">
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">
                Target Brand Kit
              </label>
              <PillSelect
                value={selectedKit}
                onChange={(val) => {
                  setSelectedKit(val);
                  if (val === 'kettle-and-co') setLockedPhrasesStr('Masala Chai');
                  else setLockedPhrasesStr('LedgerLeaf Plus');
                }}
                options={kitOptions}
                ariaLabel="Brand Kit selection"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">
                Content Format
              </label>
              <PillSelect
                value={contentType}
                onChange={setContentType}
                options={contentTypeOptions}
                ariaLabel="Content Type selection"
                className="w-full"
              />
            </div>
          </div>

          {/* Section: Draft Copy Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="content-input" className="text-xs font-semibold text-text">
                Draft Content (Text)
              </label>
              <span className="text-[11px] font-mono text-text-muted">
                {content.length} / 20,000 chars
              </span>
            </div>
            <textarea
              id="content-input"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste promotional copy, announcement, or email text here to run checks..."
              className="w-full p-4 rounded-inner border border-border bg-surface-2 text-text text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-text-muted/60 font-sans resize-y transition-colors"
            />
          </div>

          {/* Section: Purpose Card in Two Columns on Desktop */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Creator Purpose Card
              </span>
              <Chip variant="accent" size="sm">
                Intent Preserved
              </Chip>
            </div>

            <div className="p-5 rounded-inner bg-surface-2 border border-border/70 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="goal-input" className="block text-[11px] font-semibold text-text mb-1">
                  Primary Goal
                </label>
                <input
                  id="goal-input"
                  type="text"
                  placeholder="e.g. Announce new product launch"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface text-text text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-text-muted/60"
                />
              </div>

              <div>
                <label htmlFor="audience-input" className="block text-[11px] font-semibold text-text mb-1">
                  Target Audience
                </label>
                <input
                  id="audience-input"
                  type="text"
                  placeholder="e.g. Health-conscious professionals"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface text-text text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-text-muted/60"
                />
              </div>

              <div>
                <label htmlFor="keymessage-input" className="block text-[11px] font-semibold text-text mb-1">
                  Key Message
                </label>
                <input
                  id="keymessage-input"
                  type="text"
                  placeholder="e.g. Fresh organic ingredients"
                  value={keyMessage}
                  onChange={(e) => setKeyMessage(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface text-text text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-text-muted/60"
                />
              </div>

              <div>
                <label htmlFor="cta-input" className="block text-[11px] font-semibold text-text mb-1">
                  Call to Action (CTA)
                </label>
                <input
                  id="cta-input"
                  type="text"
                  placeholder="e.g. Order today on our website"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface text-text text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-text-muted/60"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="locked-input" className="block text-[11px] font-semibold text-text mb-1">
                  Locked Phrases (Comma-separated; AI suggestions must preserve)
                </label>
                <input
                  id="locked-input"
                  type="text"
                  placeholder="e.g. Masala Chai, Kettle & Co."
                  value={lockedPhrasesStr}
                  onChange={(e) => setLockedPhrasesStr(e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-pill border border-border bg-surface text-text text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-text-muted/60"
                />
              </div>
            </div>
          </div>

          {/* AI Disclosure Toggle */}
          <div className="flex items-center space-x-2.5 pt-1">
            <input
              type="checkbox"
              id="ai-declaration"
              checked={aiDeclared}
              onChange={(e) => setAiDeclared(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
            />
            <label htmlFor="ai-declaration" className="text-xs text-text cursor-pointer select-none">
              Declare AI assistance was used in drafting this content (recorded in disclosure ledger)
            </label>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-text-muted hidden sm:inline">
              Deterministic + AI Proof-or-Abstain verification
            </span>
            <button
              type="submit"
              disabled={reviewMutation.isPending || loadingKits}
              className="inline-flex items-center justify-center space-x-2 px-7 py-3 rounded-pill bg-surface-dark text-white dark:bg-gradient-to-r dark:from-orange-400 dark:to-orange-500 dark:text-on-orange font-semibold text-xs hover:opacity-95 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 ml-auto focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Verification...</span>
                </>
              ) : (
                <>
                  <span>Run Review</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
