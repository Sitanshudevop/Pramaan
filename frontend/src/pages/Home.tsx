import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, UserCheck, Play, PlusCircle } from 'lucide-react';
import { Chip, GlowBackdrop, FloatingCards } from '../components/ui';
import { useApp } from '../lib/context';
import { useToast } from '../lib/toast';
import { AuthModal } from '../components/AuthModal';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentWorkspace, enterDemoWorkspace, setRole } = useApp();
  const { showToast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleCreateWorkspace = () => {
    if (user) {
      navigate('/app/onboarding');
    } else {
      setAuthMode('signup');
      setAuthModalOpen(true);
    }
  };

  const handleTryDemo = () => {
    enterDemoWorkspace();
    setRole('Creator');
    showToast('Switched role to Creator (Priya Nair) to submit sample reviews.', 'info');
    navigate('/app/new');
  };

  return (
    <div className="relative max-w-app mx-auto py-6 sm:py-10 space-y-16">
      {/* Background Decorative Atmosphere */}
      <GlowBackdrop intensity="normal" />

      {/* Hero Section with Left Content & Right Floating 3D Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-2 sm:pt-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="flex items-center space-x-2">
            <Chip variant="accent" size="sm" dot>
              Multi-Tenant Brand Governance Platform
            </Chip>
            {user && (
              <Chip variant="neutral" size="sm">
                Signed in as {user.email}
              </Chip>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.08]">
            Evidence-backed brand governance, before you publish.
          </h1>

          <p className="text-base sm:text-lg text-text-muted leading-relaxed font-normal">
            &ldquo;Every finding has evidence. Every correction preserves the creator’s purpose. Every final decision remains human.&rdquo;
          </p>

          {/* Action Buttons: Primary (Real Workspace) & Secondary (Demo) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {user ? (
              <button
                onClick={() => navigate('/app/hub')}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-pill bg-surface-dark text-white dark:bg-gradient-to-r dark:from-orange-400 dark:to-orange-500 dark:text-on-orange font-semibold text-sm hover:opacity-95 shadow-md transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <span>Go to {currentWorkspace?.name || 'Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreateWorkspace}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-pill bg-surface-dark text-white dark:bg-gradient-to-r dark:from-orange-400 dark:to-orange-500 dark:text-on-orange font-semibold text-sm hover:opacity-95 shadow-md transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create your workspace</span>
              </button>
            )}

            <button
              onClick={handleTryDemo}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-pill border border-border bg-surface text-text font-medium text-sm hover:bg-surface-2 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <Play className="w-3.5 h-3.5 text-orange-text fill-orange-text" />
              <span>Try a sample review</span>
            </button>

            <button
              onClick={() => navigate('/app/hub')}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-pill border border-border bg-surface text-text font-medium text-sm hover:bg-surface-2 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <span>Open Brand Hub</span>
            </button>
          </div>

          <div className="flex items-center space-x-4 text-xs text-text-muted pt-1">
            <span>✓ Complete tenant isolation</span>
            <span>·</span>
            <span>✓ Proof-or-abstain engine</span>
            <span>·</span>
            <span>✓ Human decision authority</span>
          </div>
        </div>

        {/* Right Column: Floating Cards (5 cols) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <FloatingCards
            brandKitCount={2}
            activeRulesCount={14}
            verifiedFindingsRate={100}
          />
        </div>
      </section>

      {/* Three Core Commitments Cards */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold tracking-wider text-text-muted uppercase">
            Guiding Commitments
          </span>
          <div className="h-px bg-border flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Commitment 1 */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-3 transition-all hover:border-text-muted/40">
            <div className="w-10 h-10 rounded-pill bg-orange-500/10 text-orange-text flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-text tracking-tight">1. Proof for every finding</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Each flagged issue cites an active rule or fact ID. If no approved source exists, Pramaan marks it &ldquo;Unsupported&rdquo; or &ldquo;Needs human judgement&rdquo; — never &ldquo;false&rdquo; without proof.
            </p>
          </div>

          {/* Commitment 2 */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-3 transition-all hover:border-text-muted/40">
            <div className="w-10 h-10 rounded-pill bg-orange-500/10 text-orange-text flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-text tracking-tight">2. Purpose-preserving fixes</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Suggestions are verified against the violated rule and the creator’s Purpose Card. Goal, audience, key message, and locked brand phrases are preserved intact.
            </p>
          </div>

          {/* Commitment 3 */}
          <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-3 transition-all hover:border-text-muted/40">
            <div className="w-10 h-10 rounded-pill bg-orange-500/10 text-orange-text flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-text tracking-tight">3. Human decides</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Zero automatic publishing, rewriting, or sign-offs. Every status transition records actor, role, timestamp, and explanation in an append-only audit trail.
            </p>
          </div>
        </div>
      </section>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => navigate('/app/onboarding')}
      />
    </div>
  );
};
