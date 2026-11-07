import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';
import { acceptInvitation } from '../lib/api';
import { useApp } from '../lib/context';
import { AuthModal } from '../components/AuthModal';

export const AcceptInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, refreshWorkspaces, switchWorkspace } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.');
      return;
    }

    if (user) {
      // User is logged in, attempt to accept
      setLoading(true);
      acceptInvitation(token)
        .then(async (res) => {
          setSuccess(res.message);
          await refreshWorkspaces();
          switchWorkspace(res.workspace_id);
          setTimeout(() => navigate('/app/queue'), 1500);
        })
        .catch((err: Error) => {
          setError(err.message || 'Invitation is invalid or has expired.');
        })
        .finally(() => setLoading(false));
    }
  }, [token, user, navigate, refreshWorkspaces, switchWorkspace]);

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
      <div className="p-8 rounded-card border border-border bg-surface shadow-floating space-y-4">
        <div className="w-12 h-12 rounded-pill bg-orange-500/10 border border-orange-500/20 text-orange-text flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          Team Workspace Invitation
        </h1>

        {loading && (
          <div className="py-6 flex flex-col items-center justify-center space-y-2 text-xs text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin text-orange-text" />
            <span>Joining workspace...</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-inner bg-danger/10 border border-danger/20 text-danger text-xs font-medium space-y-1">
            <div className="font-bold">Unable to accept invitation</div>
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-inner bg-success/10 border border-success/20 text-success-text text-xs font-medium space-y-1">
            <div className="font-bold">Welcome to the team!</div>
            <div>{success} Redirecting to your workspace...</div>
          </div>
        )}

        {!user && !error && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-text-muted leading-relaxed">
              You've been invited to join a workspace on Pramaan. Sign in or create an account to accept the invitation.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-2.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-sm transition-all"
              >
                Sign in / Sign up to Accept
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="signup"
      />
    </div>
  );
};