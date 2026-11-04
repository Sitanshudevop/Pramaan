import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getBrandKits, getSampleDrafts, createReview } from '../lib/api';
import { useApp } from '../lib/context';
import { SampleDraft } from '../lib/types';

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

  return (
    <div className="max-w-reading mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">New Content Review</h1>
        <p className="text-sm text-text-muted mt-1">
          Submit draft copy alongside creator intent to evaluate guidelines, terminology, and facts.
        </p>
      </div>

      {/* One-Click Sample Presets */}
      {samples && samples.length > 0 && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text uppercase tracking-wider">
              Quick Judge Testing (One-Click Samples)
            </span>
            <span className="text-[11px] text-text-muted">Pre-fills draft & purpose card</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {samples.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applySample(s)}
                className="text-left p-3 rounded-btn border border-border bg-surface-2 hover:border-accent/40 transition-colors text-xs space-y-1"
              >
                <div className="font-semibold text-text flex items-center justify-between">
                  <span>Sample {idx + 1}</span>
                  <span className="text-[10px] text-accent font-medium">{s.brand_kit_id}</span>
                </div>
                <div className="text-text-muted line-clamp-2 text-[11px]">{s.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Review Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="p-3.5 rounded-card bg-danger/10 border border-danger/20 text-danger text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Step 1: Brand Kit & Metadata */}
        <div className="p-5 rounded-card border border-border bg-surface space-y-4">
          <h2 className="text-sm font-semibold text-text flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-bold">
              1
            </span>
            <span>Target Brand & Format</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand-kit-select" className="block text-xs font-medium text-text mb-1">Brand Kit</label>
              <select
                id="brand-kit-select"
                value={selectedKit}
                onChange={(e) => {
                  setSelectedKit(e.target.value);
                  if (e.target.value === 'kettle-and-co') setLockedPhrasesStr('Masala Chai');
                  else setLockedPhrasesStr('LedgerLeaf Plus');
                }}
                disabled={loadingKits}
                className="w-full px-3 py-2 rounded-btn border border-border bg-surface-2 text-text text-xs focus:ring-1 focus:ring-accent"
              >
                {brandKits?.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.industry})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="content-type-select" className="block text-xs font-medium text-text mb-1">Content Type</label>
              <select
                id="content-type-select"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-border bg-surface-2 text-text text-xs focus:ring-1 focus:ring-accent"
              >
                <option value="Promotional Email">Promotional Email</option>
                <option value="Social Media Post">Social Media Post</option>
                <option value="In-App Announcement">In-App Announcement</option>
                <option value="Landing Page Copy">Landing Page Copy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Purpose Card */}
        <div className="p-5 rounded-card border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-bold">
                2
              </span>
              <span>Creator Purpose Card</span>
            </h2>
            <span className="text-[11px] text-text-muted">Guards suggestions against intent drift</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-input" className="block text-xs font-medium text-text mb-1">Primary Goal</label>
              <input
                id="goal-input"
                type="text"
                placeholder="e.g. Announce new spiced blend"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-border bg-surface-2 text-text text-xs focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="audience-input" className="block text-xs font-medium text-text mb-1">Target Audience</label>
              <input
                id="audience-input"
                type="text"
                placeholder="e.g. Urban tea enthusiasts"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-border bg-surface-2 text-text text-xs focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="key-message-input" className="block text-xs font-medium text-text mb-1">Key Message (Must Convey)</label>
            <input
              id="key-message-input"
              type="text"
              placeholder="e.g. Authentic artisanal Masala Chai from organic tea leaves"
              value={keyMessage}
              onChange={(e) => setKeyMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-border bg-surface-2 text-text text-xs focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cta-input" className="block text-xs font-medium text-text mb-1">Call to Action (CTA)</label>
              <input
                id="cta-input"
                type="text"
                placeholder="e.g. Order today on our website"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-border bg-surface-2 text-text text-xs focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="locked-phrases-input" className="block text-xs font-medium text-text mb-1">
                Must-Keep Locked Phrases (comma-separated)
              </label>
              <input
                id="locked-phrases-input"
                type="text"
                placeholder="e.g. Masala Chai, Kettle & Co."
                value={lockedPhrasesStr}
                onChange={(e) => setLockedPhrasesStr(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-border bg-surface-2 text-text text-xs focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center space-x-2">
            <input
              type="checkbox"
              id="ai-declaration"
              checked={aiDeclared}
              onChange={(e) => setAiDeclared(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent"
            />
            <label htmlFor="ai-declaration" className="text-xs text-text cursor-pointer select-none">
              I used generative AI assistance in drafting this content
            </label>
          </div>
        </div>

        {/* Step 3: Content Paste */}
        <div className="p-5 rounded-card border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-bold">
                3
              </span>
              <span>Draft Content</span>
            </h2>
            <span className="text-[11px] text-text-muted">{content.length} / 20,000 characters</span>
          </div>

          <textarea
            rows={7}
            placeholder="Paste your content text here (plain text or Markdown)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={20000}
            className="w-full p-3 rounded-btn border border-border bg-surface-2 text-text text-xs font-sans focus:ring-1 focus:ring-accent leading-relaxed"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="submit"
            disabled={reviewMutation.isPending}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-btn bg-accent text-white font-medium text-sm hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            {reviewMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Checks...</span>
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
  );
};
