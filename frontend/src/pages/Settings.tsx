import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  ShieldAlert,
  Download,
  User,
  Building2,
  Check,
} from 'lucide-react';
import { useApp } from '../lib/context';
import {
  updateWorkspaceSettings,
  deleteWorkspace,
  authUpdateProfile,
  authExportData,
  authDeleteAccount,
} from '../lib/api';

export const Settings: React.FC = () => {
  const { currentWorkspace, role, user, signOut, refreshWorkspaces, enterDemoWorkspace } = useApp();

  // Workspace Settings State
  const [wsName, setWsName] = useState(currentWorkspace?.name || '');
  const [wsIndustry, setWsIndustry] = useState(currentWorkspace?.industry || 'Technology');
  const [retentionDays, setRetentionDays] = useState(currentWorkspace?.retention_days || 90);
  const [aiEnabled, setAiEnabled] = useState(currentWorkspace?.ai_enabled || false);
  const [wsSaved, setWsSaved] = useState(false);

  // User Profile State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const isAdmin = role === 'Admin';
  const isDemo = currentWorkspace?.is_demo;

  const updateWsMutation = useMutation({
    mutationFn: () => {
      if (!currentWorkspace) throw new Error('No active workspace');
      return updateWorkspaceSettings(currentWorkspace.id, {
        name: wsName,
        industry: wsIndustry,
        retention_days: retentionDays,
        ai_enabled: aiEnabled,
      });
    },
    onSuccess: async () => {
      setWsSaved(true);
      setTimeout(() => setWsSaved(false), 2500);
      await refreshWorkspaces();
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to update workspace settings');
    },
  });

  const deleteWsMutation = useMutation({
    mutationFn: () => {
      if (!currentWorkspace) throw new Error('No active workspace');
      return deleteWorkspace(currentWorkspace.id);
    },
    onSuccess: async () => {
      alert('Workspace deleted.');
      await refreshWorkspaces();
      enterDemoWorkspace();
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to delete workspace');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      authUpdateProfile({
        full_name: fullName,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      }),
    onSuccess: () => {
      setProfileSaved(true);
      setProfileError(null);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setProfileSaved(false), 2500);
    },
    onError: (err: Error) => {
      setProfileError(err.message || 'Failed to update profile');
    },
  });

  const exportData = async () => {
    try {
      const data = await authExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pramaan_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e: any) {
      alert(e.message || 'Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete your personal account? This action cannot be undone.'
      )
    ) {
      try {
        await authDeleteAccount();
        signOut();
      } catch (e: any) {
        alert(e.message || 'Failed to delete account');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-app mx-auto py-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">Settings</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Manage workspace governance parameters, AI processing consent, and account credentials.
        </p>
      </div>

      {/* 1. Workspace Governance Settings */}
      {!isDemo && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-border/80">
            <Building2 className="w-4 h-4 text-orange-text" />
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Workspace Governance ({currentWorkspace?.name})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Workspace Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Primary Industry</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={wsIndustry}
                onChange={(e) => setWsIndustry(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text">
              Review Audit Log Retention Period
            </label>
            <select
              disabled={!isAdmin}
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full sm:w-64 px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
            >
              <option value={30}>30 Days (Standard)</option>
              <option value={90}>90 Days (Quarterly compliance)</option>
              <option value={365}>365 Days (Annual enterprise)</option>
            </select>
          </div>

          {/* AI Processing Settings */}
          <div className="p-4 rounded-inner bg-surface-2 border border-border/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-text flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-text" />
                  <span>External AI Analysis Processing</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed max-w-xl">
                  When enabled, drafts may invoke generative AI with automatic PII redaction for supplemental review checks.
                  All AI calls are logged to the immutable disclosure ledger. Deterministic checks always run offline.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
              </label>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between pt-2">
              {wsSaved ? (
                <span className="text-xs text-success-text font-semibold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Workspace settings updated!</span>
                </span>
              ) : <span />}

              <button
                type="button"
                onClick={() => updateWsMutation.mutate()}
                disabled={updateWsMutation.isPending}
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm"
              >
                {updateWsMutation.isPending ? 'Saving...' : 'Save Workspace Changes'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. User Profile Credentials */}
      {user && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-border/80">
            <User className="w-4 h-4 text-orange-text" />
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Account Profile & Credentials
            </span>
          </div>

          {profileError && (
            <div className="p-3 rounded-inner bg-danger/10 border border-danger/20 text-danger text-xs font-medium">
              {profileError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text-muted opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 space-y-3">
            <span className="text-xs font-bold text-text">Change Password</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-text-muted">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-text-muted">New Password (min 10 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSaved ? (
              <span className="text-xs text-success-text font-semibold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Profile updated successfully!</span>
              </span>
            ) : <span />}

            <button
              type="button"
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
              className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm"
            >
              {updateProfileMutation.isPending ? 'Updating...' : 'Update Account'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Data Portability & Danger Zone */}
      <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-border/80">
          <Download className="w-4 h-4 text-orange-text" />
          <span className="text-xs font-bold text-text uppercase tracking-wider">
            Data Portability & Account Controls
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-inner bg-surface-2">
          <div>
            <div className="text-xs font-bold text-text">Export My Account Data</div>
            <div className="text-[11px] text-text-muted">
              Download all your reviews, decisions, and memberships in JSON format.
            </div>
          </div>
          <button
            type="button"
            onClick={exportData}
            className="px-4 py-1.5 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium transition-colors shrink-0"
          >
            Export JSON
          </button>
        </div>

        {user && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-inner bg-danger/10 border border-danger/20">
            <div>
              <div className="text-xs font-bold text-danger">Delete Personal Account</div>
              <div className="text-[11px] text-text-muted">
                Permanently delete your account and personal identity data.
              </div>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="px-4 py-1.5 rounded-pill border border-danger/40 text-danger hover:bg-danger/20 text-xs font-semibold transition-colors shrink-0"
            >
              Delete Account
            </button>
          </div>
        )}

        {isAdmin && !isDemo && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-inner bg-danger/10 border border-danger/30">
            <div>
              <div className="text-xs font-bold text-danger">Delete Entire Workspace</div>
              <div className="text-[11px] text-text-muted">
                Irrevocably delete {currentWorkspace?.name} and all associated brand kits and reviews.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to permanently delete workspace '${currentWorkspace?.name}'? This cannot be undone.`
                  )
                ) {
                  deleteWsMutation.mutate();
                }
              }}
              disabled={deleteWsMutation.isPending}
              className="px-4 py-1.5 rounded-pill bg-danger text-white hover:opacity-90 text-xs font-semibold transition-all shrink-0"
            >
              {deleteWsMutation.isPending ? 'Deleting...' : 'Delete Workspace'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};