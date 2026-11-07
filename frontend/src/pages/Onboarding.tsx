import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Building2, Palette, Users, Loader2 } from 'lucide-react';
import { useApp } from '../lib/context';
import { completeOnboarding } from '../lib/api';

const INDUSTRIES = [
  'Technology & SaaS',
  'Food & Beverage (D2C)',
  'Fintech & Financial Services',
  'Healthcare & Wellness',
  'E-commerce & Retail',
  'Media & Publishing',
  'Other',
];

const PRESET_COLORS = ['#FF8A4C', '#1F7A5C', '#2B4C7E', '#D9480F', '#087F5B', '#14110F'];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { currentWorkspace, refreshUser } = useApp();

  const [step, setStep] = useState<number>(1);
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || 'Acme Corp');
  const [industry, setIndustry] = useState('Technology & SaaS');

  // Step 2: Brand Kit
  const [brandName, setBrandName] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('en-IN');
  const [voiceTone, setVoiceTone] = useState('Warm, plain, grounded, never medical or sensational');
  const [readingLevel, setReadingLevel] = useState(8);
  const [selectedColor, setSelectedColor] = useState('#FF8A4C');

  // Step 3: Teammates
  const [inviteEmails, setInviteEmails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const emailList = inviteEmails
        .split('\n')
        .map((e) => e.trim())
        .filter(Boolean);

      await completeOnboarding({
        workspace_name: workspaceName,
        industry,
        brand_name: brandName || workspaceName,
        primary_language: primaryLanguage,
        voice_tone: voiceTone,
        target_reading_level: readingLevel,
        brand_colors: [selectedColor],
        invite_emails: emailList,
      });

      await refreshUser();
      navigate('/app/hub');
    } catch {
      navigate('/app/hub');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-300">
      {/* Wizard Header Progress */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-text">
          Set up your workspace
        </h1>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Start evidence-backed brand governance for your team in under 3 minutes.
        </p>

        {/* 3 Steps Indicator */}
        <div className="flex items-center justify-center space-x-3 pt-2">
          {[
            { num: 1, label: 'Workspace' },
            { num: 2, label: 'Brand Kit' },
            { num: 3, label: 'Invite Team' },
          ].map((s) => (
            <div key={s.num} className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 rounded-pill text-xs font-bold flex items-center justify-center transition-all ${
                  step === s.num
                    ? 'bg-text text-bg shadow-sm'
                    : step > s.num
                    ? 'bg-lime text-on-lime'
                    : 'bg-surface-2 text-text-muted border border-border'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className={`text-xs font-medium ${step >= s.num ? 'text-text' : 'text-text-muted'}`}>
                {s.label}
              </span>
              {s.num < 3 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="p-6 sm:p-8 rounded-card border border-border bg-surface shadow-floating space-y-6">
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center space-x-2.5 text-orange-text">
              <Building2 className="w-5 h-5" />
              <h2 className="text-base font-bold text-text">Company & Workspace Details</h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Workspace / Company Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!brandName) setBrandName(workspaceName);
                setStep(2);
              }}
              className="w-full py-2.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange font-semibold text-xs flex items-center justify-center space-x-1.5 hover:opacity-90 shadow-sm"
            >
              <span>Continue to Brand Kit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center space-x-2.5 text-orange-text">
              <Palette className="w-5 h-5" />
              <h2 className="text-base font-bold text-text">Your First Brand Kit</h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Acme Solar"
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Primary Spelling</label>
                <select
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                  className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="en-IN">Indian English (en-IN)</option>
                  <option value="en-GB">British English (en-GB)</option>
                  <option value="en-US">American English (en-US)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Target Reading Grade: {readingLevel}</label>
                <input
                  type="range"
                  min={5}
                  max={14}
                  value={readingLevel}
                  onChange={(e) => setReadingLevel(Number(e.target.value))}
                  className="w-full accent-orange-500 py-3"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Brand Voice & Tone</label>
              <textarea
                rows={2}
                value={voiceTone}
                onChange={(e) => setVoiceTone(e.target.value)}
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Primary Brand Color</label>
              <div className="flex items-center space-x-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-pill border-2 transition-all ${
                      selectedColor === c ? 'border-text scale-110 shadow-xs' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-pill border border-border text-xs text-text-muted hover:text-text"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2.5 px-6 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange font-semibold text-xs flex items-center space-x-1.5 hover:opacity-90 shadow-sm"
              >
                <span>Continue to Team Invites</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center space-x-2.5 text-orange-text">
              <Users className="w-5 h-5" />
              <h2 className="text-base font-bold text-text">Invite Teammates (Optional)</h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                Colleague Email Addresses (one per line)
              </label>
              <textarea
                rows={4}
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="colleague1@company.com&#10;colleague2@company.com"
                className="w-full p-3 rounded-inner border border-border bg-surface-2 text-xs text-text font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-[11px] text-text-muted">
                You can also generate shareable invite links anytime from the Team page.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-pill border border-border text-xs text-text-muted hover:text-text"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinish}
                className="py-2.5 px-6 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange font-semibold text-xs flex items-center space-x-1.5 hover:opacity-90 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Finish & Open Brand Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

