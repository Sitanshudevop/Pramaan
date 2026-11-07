import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../lib/context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess,
}) => {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password.length < 10) {
          setError('Password must be at least 10 characters long.');
          setLoading(false);
          return;
        }
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-card border border-border bg-surface shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
            {mode === 'signup' ? 'Create your workspace' : 'Welcome back to Pramaan'}
          </h2>
          <p className="text-xs text-text-muted">
            {mode === 'signup'
              ? 'Evidence-backed brand governance for your own company and team.'
              : 'Sign in to access your tenant workspaces and reviews.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 rounded-pill bg-surface-2 border border-border">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-pill transition-all ${
              mode === 'signup'
                ? 'bg-surface text-text shadow-xs font-bold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Create Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-pill transition-all ${
              mode === 'signin'
                ? 'bg-surface text-text shadow-xs font-bold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-inner bg-danger/10 border border-danger/30 text-danger text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-text">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-text">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {mode === 'signup' && (
              <p className="text-[11px] text-text-muted pt-0.5">
                Minimum 10 characters with numbers or symbols. Hashed with Argon2id.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-pill bg-surface-dark text-white dark:bg-gradient-to-r dark:from-orange-400 dark:to-orange-500 dark:text-on-orange font-semibold text-xs hover:opacity-95 shadow-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account & Workspace' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Privacy Note */}
        <p className="text-[11px] text-text-muted text-center leading-normal">
          By signing up, you agree to our{' '}
          <a href="/terms" className="text-orange-text hover:underline">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-orange-text hover:underline">
            Privacy Policy
          </a>
          . Real tenant data is isolated.
        </p>
      </div>
    </div>
  );
};
