import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Building2,
  FileText,
  Sliders,
  ShieldCheck,
  Bell,
  Database,
  Lock,
  AlertTriangle,
  Check,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Info,
  Laptop,
} from 'lucide-react';
import { useApp } from '../lib/context';
import {
  getWorkspaceSettings,
  updateWorkspaceSettingsFull,
  getContentTypes,
  createContentType,
  updateContentType,
  archiveContentType,
  runRetentionPolicy,
  exportWorkspaceData,
  getActiveSessions,
  revokeSession,
  revokeOtherSessions,
  getNotificationPreferences,
  updateNotificationPreferences,
  authUpdateProfile,
  authExportData,
  authDeleteAccount,
  deleteWorkspace,
  setConfidentialModeBackend,
} from '../lib/api';
import { ContentType, ActiveSession } from '../lib/types';
import { PillTabs, PillSelect, Chip } from '../components/ui';
import { useToast } from '../lib/toast';

const AVATAR_COLORS = [
  '#E06D3B', // Terracotta
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
];

export const Settings: React.FC = () => {
  const { showToast } = useToast();
  const {
    currentWorkspace,
    role,
    user,
    theme,
    setTheme,
    confidentialMode,
    setConfidentialMode,
    signOut,
    refreshWorkspaces,
    refreshUser,
    enterDemoWorkspace,
  } = useApp();

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab from query param or default 'profile'
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const isDemo = currentWorkspace?.is_demo ?? true;
  const isAdmin = role === 'Admin';
  const isBrandManager = role === 'Brand manager' || isAdmin;
  const wsId = currentWorkspace?.id || 'ws-demo';

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------
  const { data: wsSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['workspaceSettings', wsId],
    queryFn: () => getWorkspaceSettings(wsId),
    enabled: !!wsId,
  });

  const { data: contentTypes, refetch: refetchContentTypes } = useQuery({
    queryKey: ['contentTypes', wsId],
    queryFn: () => getContentTypes(wsId, true),
    enabled: !!wsId,
  });

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['activeSessions'],
    queryFn: () => getActiveSessions(),
  });

  const { data: notifPrefs, refetch: refetchNotifPrefs } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () => getNotificationPreferences(),
  });

  // -------------------------------------------------------------------------
  // Form State: 1. Profile
  // -------------------------------------------------------------------------
  const [fullName, setFullName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#E06D3B');
  const [notifLanguage, setNotifLanguage] = useState('en-IN');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAvatarColor(user.avatar_color || '#E06D3B');
      setNotifLanguage(user.notification_language || 'en-IN');
    }
  }, [user]);

  // -------------------------------------------------------------------------
  // Form State: 2. Workspace
  // -------------------------------------------------------------------------
  const [wsName, setWsName] = useState('');
  const [wsIndustry, setWsIndustry] = useState('');
  const [wsLogoUrl, setWsLogoUrl] = useState('');
  const [wsTimezone, setWsTimezone] = useState('Asia/Kolkata');
  const [wsDateFormat, setWsDateFormat] = useState('YYYY-MM-DD');
  const [defaultBrandKit, setDefaultBrandKit] = useState('kettle-and-co');
  const [defaultSpelling, setDefaultSpelling] = useState('en-IN');

  useEffect(() => {
    if (wsSettings) {
      setWsName(wsSettings.name || '');
      setWsIndustry(wsSettings.industry || 'Technology');
      setWsLogoUrl(wsSettings.logo_url || '');
      setWsTimezone(wsSettings.timezone || 'Asia/Kolkata');
      setWsDateFormat(wsSettings.date_format || 'YYYY-MM-DD');
      setDefaultBrandKit(wsSettings.default_brand_kit_id || 'kettle-and-co');
      setDefaultSpelling(wsSettings.default_spelling || 'en-IN');
    }
  }, [wsSettings]);

  // -------------------------------------------------------------------------
  // Form State: 3. Content Types
  // -------------------------------------------------------------------------
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [newTypeReqApproval, setNewTypeReqApproval] = useState(false);
  const [newTypeReviewer, setNewTypeReviewer] = useState('');

  // -------------------------------------------------------------------------
  // Form State: 4. Review Policy
  // -------------------------------------------------------------------------
  const [approvalSeverity, setApprovalSeverity] = useState('Blocker');
  const [autoAssignMode, setAutoAssignMode] = useState('off');
  const [slaHours, setSlaHours] = useState(48);
  const [policySaved, setPolicySaved] = useState(false);

  useEffect(() => {
    if (wsSettings) {
      setApprovalSeverity(wsSettings.manager_approval_severity || 'Blocker');
      setAutoAssignMode(wsSettings.auto_assign_mode || 'off');
      setSlaHours(wsSettings.sla_hours || 48);
    }
  }, [wsSettings]);

  // -------------------------------------------------------------------------
  // Form State: 5. AI and Privacy
  // -------------------------------------------------------------------------
  const [aiEnabled, setAiEnabled] = useState(true);
  const [redactionOptions, setRedactionOptions] = useState({
    emails: true,
    phones: true,
    cards: true,
  });
  const [aiSaved, setAiSaved] = useState(false);

  useEffect(() => {
    if (wsSettings) {
      setAiEnabled(wsSettings.ai_enabled);
      try {
        const parsed = JSON.parse(wsSettings.redaction_options_json || '{}');
        setRedactionOptions({
          emails: parsed.emails ?? true,
          phones: parsed.phones ?? true,
          cards: parsed.cards ?? true,
        });
      } catch {
        // fallback
      }
    }
  }, [wsSettings]);

  // -------------------------------------------------------------------------
  // Form State: 6. Notifications
  // -------------------------------------------------------------------------
  const [notifEvents, setNotifEvents] = useState({
    assigned: true,
    mentions: true,
    changes_requested: true,
    approved: true,
    overdue: true,
  });
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    if (notifPrefs) {
      setNotifEvents({
        assigned: notifPrefs.assigned,
        mentions: notifPrefs.mentions,
        changes_requested: notifPrefs.changes_requested,
        approved: notifPrefs.approved,
        overdue: notifPrefs.overdue,
      });
      setQuietHoursEnabled(notifPrefs.quiet_hours_enabled);
      if (notifPrefs.quiet_hours_start) setQuietStart(notifPrefs.quiet_hours_start);
      if (notifPrefs.quiet_hours_end) setQuietEnd(notifPrefs.quiet_hours_end);
    }
  }, [notifPrefs]);

  // -------------------------------------------------------------------------
  // Form State: 7. Data and Retention
  // -------------------------------------------------------------------------
  const [retentionDays, setRetentionDays] = useState(90);
  const [isPruning, setIsPruning] = useState(false);

  useEffect(() => {
    if (wsSettings) {
      setRetentionDays(wsSettings.retention_days ?? 90);
    }
  }, [wsSettings]);

  // -------------------------------------------------------------------------
  // Form State: 9. Danger Zone
  // -------------------------------------------------------------------------
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------
  const profileMutation = useMutation({
    mutationFn: () =>
      authUpdateProfile({
        full_name: fullName,
        avatar_color: avatarColor,
        notification_language: notifLanguage,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      }),
    onSuccess: async () => {
      setProfileSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setProfileSaved(false), 2500);
      showToast('Profile credentials updated successfully.', 'success');
      await refreshUser();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to update profile', 'error');
    },
  });

  const workspaceMutation = useMutation({
    mutationFn: () =>
      updateWorkspaceSettingsFull(wsId, {
        name: wsName,
        industry: wsIndustry,
        logo_url: wsLogoUrl,
        timezone: wsTimezone,
        date_format: wsDateFormat,
        default_brand_kit_id: defaultBrandKit,
        default_spelling: defaultSpelling,
      }),
    onSuccess: async () => {
      showToast('Workspace settings saved.', 'success');
      await refetchSettings();
      await refreshWorkspaces();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to update workspace', 'error');
    },
  });

  const policyMutation = useMutation({
    mutationFn: () =>
      updateWorkspaceSettingsFull(wsId, {
        manager_approval_severity: approvalSeverity,
        auto_assign_mode: autoAssignMode,
        sla_hours: slaHours,
      }),
    onSuccess: async () => {
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 2500);
      showToast('Review policy updated.', 'success');
      await refetchSettings();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to update review policy', 'error');
    },
  });

  const aiPrivacyMutation = useMutation({
    mutationFn: () =>
      updateWorkspaceSettingsFull(wsId, {
        ai_enabled: aiEnabled,
        redaction_options_json: JSON.stringify(redactionOptions),
      }),
    onSuccess: async () => {
      setAiSaved(true);
      setTimeout(() => setAiSaved(false), 2500);
      showToast('AI and privacy configuration updated.', 'success');
      await refetchSettings();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to update AI settings', 'error');
    },
  });

  const toggleConfidential = async () => {
    try {
      const next = !confidentialMode;
      await setConfidentialModeBackend(next, role);
      setConfidentialMode(next);
      queryClient.invalidateQueries({ queryKey: ['workspaceSettings'] });
      showToast(
        next
          ? 'Confidential Mode enabled. Zero external AI egress.'
          : 'Confidential Mode disabled. Generative layer active.',
        'info'
      );
    } catch (err) {
      showToast((err as Error).message || 'Failed to toggle confidential mode', 'error');
    }
  };

  const notifMutation = useMutation({
    mutationFn: () =>
      updateNotificationPreferences({
        ...notifEvents,
        quiet_hours_enabled: quietHoursEnabled,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
      }),
    onSuccess: async () => {
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
      showToast('Notification preferences saved.', 'success');
      await refetchNotifPrefs();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to update notification preferences', 'error');
    },
  });

  const retentionDaysMutation = useMutation({
    mutationFn: () =>
      updateWorkspaceSettingsFull(wsId, {
        retention_days: retentionDays,
      }),
    onSuccess: async () => {
      showToast('Retention period updated.', 'success');
      await refetchSettings();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to update retention schedule', 'error');
    },
  });

  const handleRunRetention = async () => {
    if (
      !window.confirm(
        `Are you sure you want to run retention cleanup now? Reviews older than ${retentionDays} days will be deleted.`
      )
    )
      return;

    setIsPruning(true);
    try {
      const res = await runRetentionPolicy(wsId);
      showToast(res.message, 'success');
      await refetchSettings();
    } catch (err) {
      showToast((err as Error).message || 'Retention execution failed', 'error');
    } finally {
      setIsPruning(false);
    }
  };

  const handleExportPersonal = async () => {
    try {
      const data = await authExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pramaan_personal_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('Personal data export downloaded.', 'success');
    } catch (err) {
      showToast((err as Error).message || 'Export failed', 'error');
    }
  };

  const handleExportWorkspace = async () => {
    try {
      await exportWorkspaceData(wsId);
      showToast('Workspace data archive downloaded.', 'success');
    } catch (err) {
      showToast((err as Error).message || 'Workspace export failed', 'error');
    }
  };

  const handleAddContentType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      await createContentType(wsId, {
        name: newTypeName.trim(),
        description: newTypeDesc.trim() || undefined,
        requires_manager_approval: newTypeReqApproval,
        default_reviewer_id: newTypeReviewer || undefined,
      });
      setNewTypeName('');
      setNewTypeDesc('');
      setNewTypeReqApproval(false);
      setNewTypeReviewer('');
      setShowAddTypeModal(false);
      showToast('Content format added.', 'success');
      await refetchContentTypes();
    } catch (err) {
      showToast((err as Error).message || 'Failed to create content format', 'error');
    }
  };

  const handleToggleManagerSignoff = async (ct: ContentType) => {
    try {
      await updateContentType(wsId, ct.id, {
        requires_manager_approval: !ct.requires_manager_approval,
      });
      showToast(
        !ct.requires_manager_approval
          ? `Manager sign-off required for '${ct.name}'.`
          : `Manager sign-off removed for '${ct.name}'.`,
        'info'
      );
      await refetchContentTypes();
    } catch (err) {
      showToast((err as Error).message || 'Failed to update content format', 'error');
    }
  };

  const handleArchiveContentType = async (ctId: string) => {
    try {
      await archiveContentType(wsId, ctId);
      showToast('Content format archived.', 'info');
      await refetchContentTypes();
    } catch (err) {
      showToast((err as Error).message || 'Failed to archive content format', 'error');
    }
  };

  const handleRevokeSession = async (sessId: string) => {
    try {
      await revokeSession(sessId);
      showToast('Session revoked.', 'info');
      await refetchSessions();
    } catch (err) {
      showToast((err as Error).message || 'Failed to revoke session', 'error');
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      const res = await revokeOtherSessions();
      showToast(res.message, 'success');
      await refetchSessions();
    } catch (err) {
      showToast((err as Error).message || 'Failed to revoke other sessions', 'error');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (isDemo) return;
    if (deleteConfirmationName !== currentWorkspace?.name) {
      showToast(`Please type '${currentWorkspace?.name}' exactly to confirm.`, 'error');
      return;
    }
    try {
      await deleteWorkspace(wsId);
      showToast('Workspace deleted permanently.', 'info');
      await refreshWorkspaces();
      enterDemoWorkspace();
    } catch (err) {
      showToast((err as Error).message || 'Failed to delete workspace', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (isDemo) return;
    if (
      !window.confirm(
        'Are you sure you want to delete your personal account? This action cannot be undone.'
      )
    )
      return;
    try {
      await authDeleteAccount();
      showToast('Account deleted.', 'info');
      await signOut();
    } catch (err) {
      showToast((err as Error).message || 'Failed to delete account', 'error');
    }
  };

  // -------------------------------------------------------------------------
  // Tabs Navigation Configuration
  // -------------------------------------------------------------------------
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'content_types', label: 'Content types', count: contentTypes?.filter((c) => !c.is_archived).length },
    { id: 'review_policy', label: 'Review policy' },
    { id: 'ai_privacy', label: 'AI and privacy' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'data_retention', label: 'Data & retention' },
    { id: 'security', label: 'Security' },
    { id: 'danger_zone', label: 'Danger zone' },
  ];

  return (
    <div className="space-y-6 max-w-app mx-auto py-3">
      {/* Page Title & Demo Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Settings</h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Workspace governance control centre, approval gates, retention schedules, and account parameters.
          </p>
        </div>

        {isDemo && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-pill bg-orange-500/10 border border-orange-500/20 text-orange-text text-[11px] font-medium self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Changes in the Demo workspace reset daily.</span>
          </div>
        )}
      </div>

      {/* Responsive Horizontal PillTabs */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <PillTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: Profile */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-6">
          <div>
            <div className="flex items-center space-x-2 pb-1.5 border-b border-border/80">
              <User className="w-4 h-4 text-orange-text" />
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                Personal Identity & Credentials
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Manage your display identity, avatar styling, password credentials, and application theme.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Display Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || (isDemo ? 'demo@example.com' : '')}
                className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text-muted opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text">Avatar Palette Accent</label>
            <div className="flex items-center space-x-3">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    avatarColor === c ? 'ring-2 ring-text ring-offset-2 ring-offset-surface scale-110' : 'hover:opacity-80'
                  }`}
                  aria-label={`Select color ${c}`}
                >
                  {avatarColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Theme & Notification Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-border/60">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Interface Theme</label>
              <div className="flex items-center space-x-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`px-3.5 py-1.5 rounded-pill text-xs font-medium capitalize transition-colors ${
                      theme === t
                        ? 'bg-text text-bg font-bold shadow-xs'
                        : 'bg-surface-2 text-text-muted hover:text-text'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Notification Language</label>
              <PillSelect
                value={notifLanguage}
                onChange={setNotifLanguage}
                options={[
                  { value: 'en-IN', label: 'en-IN (English - India)' },
                  { value: 'en-GB', label: 'en-GB (English - UK)' },
                  { value: 'en-US', label: 'en-US (English - US)' },
                ]}
                ariaLabel="Select language"
              />
            </div>
          </div>

          {/* Change Password */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <span className="text-xs font-bold text-text">Change Password</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] text-text-muted">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-text-muted">New Password (min 10 characters)</label>
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

          {/* Card Footer: Save & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/80">
            <div className="text-[11px] text-text-muted">
              {profileSaved ? (
                <span className="text-success-text font-semibold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Profile updated successfully!</span>
                </span>
              ) : (
                <span>Updates immediately reflect across author badges and reviewer assignments.</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => profileMutation.mutate()}
              disabled={profileMutation.isPending}
              className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm self-start sm:self-auto"
            >
              {profileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: Workspace */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'workspace' && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/80">
            <div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-orange-text" />
                <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                  Workspace Governance Configuration
                </h2>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Configure foundational workspace metadata, default brand guidelines, and locale standards.
              </p>
            </div>

            {!isAdmin && (
              <Chip variant="neutral" size="sm">
                Only an Admin can change this
              </Chip>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Workspace Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Primary Industry</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={wsIndustry}
                onChange={(e) => setWsIndustry(e.target.value)}
                className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Workspace Logo URL</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={wsLogoUrl}
                onChange={(e) => setWsLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Operating Timezone</label>
              <PillSelect
                value={wsTimezone}
                onChange={setWsTimezone}
                options={[
                  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +05:30)' },
                  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
                  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                ]}
                ariaLabel="Select timezone"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Default Date Format</label>
              <PillSelect
                value={wsDateFormat}
                onChange={setWsDateFormat}
                options={[
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO 8601)' },
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Indian / British)' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Standard)' },
                ]}
                ariaLabel="Select date format"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Default Brand Kit</label>
              <PillSelect
                value={defaultBrandKit}
                onChange={setDefaultBrandKit}
                options={[
                  { value: 'kettle-and-co', label: 'Kettle & Co. (D2C Chai & Beverages)' },
                  { value: 'ledgerleaf', label: 'LedgerLeaf (Fintech & Lending)' },
                ]}
                ariaLabel="Select default brand kit"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">Default Spelling Variant</label>
              <PillSelect
                value={defaultSpelling}
                onChange={setDefaultSpelling}
                options={[
                  { value: 'en-IN', label: 'en-IN (Indian English, Oxford -ise/-our)' },
                  { value: 'en-GB', label: 'en-GB (British English)' },
                  { value: 'en-US', label: 'en-US (American English)' },
                ]}
                ariaLabel="Select spelling variant"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/80">
            <div className="text-[11px] text-text-muted flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Last changed by{' '}
                <span className="font-semibold text-text">
                  {wsSettings?.last_changed_by || 'Meera Kapoor'}
                </span>{' '}
                on{' '}
                {wsSettings?.last_changed_at
                  ? new Date(wsSettings.last_changed_at).toLocaleDateString()
                  : 'Sep 12, 2026'}
              </span>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => workspaceMutation.mutate()}
                disabled={workspaceMutation.isPending}
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm self-start sm:self-auto"
              >
                {workspaceMutation.isPending ? 'Saving...' : 'Save Workspace Changes'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 3: Content Types */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'content_types' && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/80">
            <div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-orange-text" />
                <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                  Content Formats & Approvals
                </h2>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Define content formats, approval workflow gates, and default reviewer assignments.
              </p>
            </div>

            {isBrandManager ? (
              <button
                type="button"
                onClick={() => setShowAddTypeModal(true)}
                className="px-4 py-1.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
              >
                + Add Content Format
              </button>
            ) : (
              <Chip variant="neutral" size="sm">
                Only Admin or Brand manager can edit
              </Chip>
            )}
          </div>

          {/* Add Content Type Modal */}
          {showAddTypeModal && (
            <form
              onSubmit={handleAddContentType}
              className="p-4 rounded-card border border-orange-500/30 bg-surface-2 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text">New Content Format</span>
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="text-xs text-text-muted hover:text-text"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-text">Format Name</label>
                  <input
                    type="text"
                    required
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g. Press Release, Push Notification"
                    className="w-full px-3 py-1.5 rounded-inner border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-text">Description</label>
                  <input
                    type="text"
                    value={newTypeDesc}
                    onChange={(e) => setNewTypeDesc(e.target.value)}
                    placeholder="Short description of format intent"
                    className="w-full px-3 py-1.5 rounded-inner border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="newReqMgr"
                    checked={newTypeReqApproval}
                    onChange={(e) => setNewTypeReqApproval(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="newReqMgr" className="text-xs text-text font-medium cursor-pointer">
                    Requires Brand Manager Sign-off Before Approval
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-text">Default Reviewer</label>
                  <PillSelect
                    value={newTypeReviewer}
                    onChange={setNewTypeReviewer}
                    options={[
                      { value: '', label: 'Unassigned (Queue Pickup)' },
                      { value: 'usr-rohan', label: 'Rohan Mehta (Reviewer)' },
                      { value: 'usr-dev', label: 'Dev Malhotra (Reviewer)' },
                      { value: 'usr-anika', label: 'Anika Rao (Brand manager)' },
                    ]}
                    ariaLabel="Select default reviewer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90"
                >
                  Create Format
                </button>
              </div>
            </form>
          )}

          {/* List of Content Types */}
          <div className="divide-y divide-border/60">
            {contentTypes?.map((ct) => (
              <div key={ct.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-text">{ct.name}</span>
                    {ct.requires_manager_approval && (
                      <Chip variant="accent" size="sm">
                        Requires Manager Approval
                      </Chip>
                    )}
                    {ct.is_archived && (
                      <Chip variant="neutral" size="sm">
                        Archived
                      </Chip>
                    )}
                  </div>
                  {ct.description && (
                    <p className="text-[11px] text-text-muted">{ct.description}</p>
                  )}
                  <div className="text-[10px] text-text-muted">
                    Default Assignee:{' '}
                    <span className="font-semibold text-text">
                      {ct.default_reviewer_name || 'Queue pickup'}
                    </span>
                  </div>
                </div>

                {isBrandManager && !ct.is_archived && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleManagerSignoff(ct)}
                      className="px-2.5 py-1 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-[11px] font-medium"
                    >
                      {ct.requires_manager_approval ? 'Remove Sign-off Gate' : 'Require Sign-off Gate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchiveContentType(ct.id)}
                      className="p-1.5 text-text-muted hover:text-danger rounded-full transition-colors"
                      title="Archive content format"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 4: Review Policy */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'review_policy' && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/80">
            <div>
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-orange-text" />
                <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                  Review & Approval Policies
                </h2>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Govern approval thresholds, reviewer escalation gates, and review turnaround SLAs.
              </p>
            </div>

            {!isBrandManager && (
              <Chip variant="neutral" size="sm">
                Only Admin or Brand manager can edit
              </Chip>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-card bg-surface-2 border border-border/80 space-y-2">
              <label className="block text-xs font-semibold text-text">
                Severities Requiring Manager Sign-Off
              </label>
              <p className="text-[11px] text-text-muted">
                When content violations match this severity threshold, a Reviewer cannot approve alone; approval is routed to a Brand Manager.
              </p>
              <PillSelect
                value={approvalSeverity}
                onChange={setApprovalSeverity}
                options={[
                  { value: 'Blocker', label: 'Blockers Only (Standard Governance)' },
                  { value: 'Major', label: 'Blockers & Major Issues (Strict Regulatory Compliance)' },
                ]}
                ariaLabel="Select approval severity threshold"
              />
            </div>

            <div className="p-4 rounded-card bg-surface-2 border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-text">Mandatory Override Justification</div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Requires reviewers and creators to document reasons when dismissing or overriding brand rules.
                  </p>
                </div>
                <Chip variant="success" size="sm">
                  Locked ON (Enforced)
                </Chip>
              </div>
            </div>

            <div className="p-4 rounded-card bg-surface-2 border border-border/80 space-y-2">
              <label className="block text-xs font-semibold text-text">Auto-Assignment Pipeline</label>
              <p className="text-[11px] text-text-muted">
                Controls how unassigned reviews are automatically dispatched upon creator submission.
              </p>
              <PillSelect
                value={autoAssignMode}
                onChange={setAutoAssignMode}
                options={[
                  { value: 'off', label: 'Off (Leave unassigned in Queue)' },
                  { value: 'by_brand_kit', label: 'By Brand Kit & Content Format (Domain Specialist)' },
                  { value: 'round_robin', label: 'Round Robin across Active Reviewers' },
                ]}
                ariaLabel="Select auto-assign mode"
              />
            </div>

            <div className="p-4 rounded-card bg-surface-2 border border-border/80 space-y-2">
              <label className="block text-xs font-semibold text-text">Turnaround SLA Threshold (Hours)</label>
              <p className="text-[11px] text-text-muted">
                Reviews pending in queue past this duration are marked Overdue and highlighted with red SLA alerts.
              </p>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min={1}
                  max={720}
                  disabled={!isBrandManager}
                  value={slaHours}
                  onChange={(e) => setSlaHours(Number(e.target.value))}
                  className="w-32 px-3.5 py-2 rounded-inner border border-border bg-surface text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
                />
                <span className="text-xs text-text-muted">hours (Default: 48h)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/80">
            <div className="text-[11px] text-text-muted">
              {policySaved ? (
                <span className="text-success-text font-semibold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Review policy saved successfully!</span>
                </span>
              ) : (
                <span>Gates take effect immediately for active submissions in queue.</span>
              )}
            </div>

            {isBrandManager && (
              <button
                type="button"
                onClick={() => policyMutation.mutate()}
                disabled={policyMutation.isPending}
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm self-start sm:self-auto"
              >
                {policyMutation.isPending ? 'Saving...' : 'Save Review Policy'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 5: AI and Privacy */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'ai_privacy' && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/80">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-orange-text" />
                <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                  AI Model Processing & Confidentiality
                </h2>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Control generative AI assistance, strict offline Confidential Mode, and PII redaction.
              </p>
            </div>

            {!isAdmin && (
              <Chip variant="neutral" size="sm">
                Only an Admin can change this
              </Chip>
            )}
          </div>

          {/* AI Toggle with Consent Record */}
          <div className="p-4 rounded-card bg-surface-2 border border-border/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-text">External AI Analysis Engine</div>
                <p className="text-[11px] text-text-muted mt-0.5 max-w-xl leading-relaxed">
                  When enabled, drafts may invoke generative models for supplemental review checks. All external calls are logged to the immutable disclosure ledger. Deterministic checks always run locally offline.
                </p>
                <div className="mt-2 text-[10px] text-text-muted font-mono">
                  Consent Record: Authorized by{' '}
                  <span className="font-semibold text-text">
                    {wsSettings?.ai_consent_by_name || 'Meera Kapoor'}
                  </span>{' '}
                  (Policy {wsSettings?.ai_consent_version || 'v1.2-enterprise'}).
                </div>
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

          {/* Confidential Mode Switch */}
          <div className="p-4 rounded-card bg-surface-2 border border-border/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-text flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-orange-text" />
                  <span>Confidential Mode (Zero Network Egress)</span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 max-w-xl leading-relaxed">
                  When active, external AI network egress is severed immediately. The app operates in 100% deterministic offline verification mode.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleConfidential}
                disabled={!isAdmin}
                className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all ${
                  confidentialMode
                    ? 'bg-success text-white'
                    : 'bg-surface border border-border text-text hover:bg-surface-2'
                }`}
              >
                {confidentialMode ? 'Confidential: Active' : 'Enable Confidential'}
              </button>
            </div>
          </div>

          {/* Automatic PII Redaction Options */}
          <div className="p-4 rounded-card bg-surface-2 border border-border/80 space-y-3">
            <div className="text-xs font-bold text-text">Automatic PII Redaction Policies</div>
            <p className="text-[11px] text-text-muted">
              Pre-strip sensitive tokens before any supplemental external analysis.
            </p>

            <div className="space-y-2 pt-1">
              {[
                { key: 'emails', label: 'Email Addresses (redacted to [EMAIL_REDACTED])' },
                { key: 'phones', label: 'Phone Numbers & Country Codes (redacted to [PHONE_REDACTED])' },
                { key: 'cards', label: 'Financial Identifiers & Long Digit Runs (redacted to [CARD_REDACTED])' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`redact-${key}`}
                    disabled={!isAdmin}
                    checked={redactionOptions[key as keyof typeof redactionOptions]}
                    onChange={(e) =>
                      setRedactionOptions((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor={`redact-${key}`} className="text-xs text-text cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Link to Disclosure Ledger */}
          <div className="flex items-center justify-between p-3.5 rounded-inner bg-surface-2">
            <div>
              <div className="text-xs font-bold text-text">AI Processing Disclosure Ledger</div>
              <div className="text-[11px] text-text-muted">
                Audit complete history of models, tokens, and redaction verifications.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/audit')}
              className="px-3.5 py-1.5 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium flex items-center space-x-1"
            >
              <span>Open Ledger</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/80">
            <div className="text-[11px] text-text-muted">
              {aiSaved && (
                <span className="text-success-text font-semibold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>AI and privacy settings updated!</span>
                </span>
              )}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => aiPrivacyMutation.mutate()}
                disabled={aiPrivacyMutation.isPending}
                className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm self-start sm:self-auto"
              >
                {aiPrivacyMutation.isPending ? 'Saving...' : 'Save AI Settings'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 6: Notifications */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'notifications' && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-6">
          <div className="pb-2 border-b border-border/80">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-orange-text" />
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                Notification Subscriptions & Quiet Hours
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Customize which governance events generate in-app alerts and notifications.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-text">In-App Notification Triggers</span>
            {[
              { key: 'assigned', label: 'Review Assigned to Me', desc: 'When a creator or admin assigns a review to you.' },
              { key: 'mentions', label: '@Mentions in Review Comments', desc: 'When another reviewer tags you in draft discussions.' },
              { key: 'changes_requested', label: 'Changes Requested on My Submissions', desc: 'When a reviewer asks for draft revisions.' },
              { key: 'approved', label: 'Review Approved or Rejected', desc: 'When content finishes final governance review.' },
              { key: 'overdue', label: 'Review SLA Overdue Warnings', desc: 'When items in queue exceed turnaround threshold.' },
            ].map(({ key, label, desc }) => (
              <div
                key={key}
                className="flex items-start justify-between p-3.5 rounded-inner bg-surface-2 gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-text">{label}</div>
                  <div className="text-[11px] text-text-muted">{desc}</div>
                </div>

                <input
                  type="checkbox"
                  checked={notifEvents[key as keyof typeof notifEvents]}
                  onChange={(e) =>
                    setNotifEvents((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  className="rounded text-orange-500 focus:ring-orange-500 mt-1"
                />
              </div>
            ))}
          </div>

          {/* Quiet Hours */}
          <div className="p-4 rounded-card bg-surface-2 border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-text">Quiet Hours Schedule</div>
                <div className="text-[11px] text-text-muted">
                  Silence non-critical notifications during focus or off-work hours.
                </div>
              </div>

              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="rounded text-orange-500 focus:ring-orange-500"
              />
            </div>

            {quietHoursEnabled && (
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="px-2.5 py-1 rounded-inner border border-border bg-surface text-xs text-text"
                />
                <span className="text-xs text-text-muted">to</span>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="px-2.5 py-1 rounded-inner border border-border bg-surface text-xs text-text"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/80">
            <div className="text-[11px] text-text-muted">
              {notifSaved && (
                <span className="text-success-text font-semibold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Notification preferences saved!</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => notifMutation.mutate()}
              disabled={notifMutation.isPending}
              className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm self-start sm:self-auto"
            >
              {notifMutation.isPending ? 'Saving...' : 'Save Notification Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 7: Data & Retention */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'data_retention' && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-6">
          <div className="pb-2 border-b border-border/80">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-orange-text" />
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                Data Portability, Retention & Pruning
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Download account data portability archives, configure retention schedules, and execute pruning sweeps.
            </p>
          </div>

          {/* Personal Data Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-inner bg-surface-2 border border-border/80">
            <div>
              <div className="text-xs font-bold text-text">Export My Account Data (JSON)</div>
              <div className="text-[11px] text-text-muted mt-0.5">
                Download your authored reviews, comments, and personal membership profile.
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportPersonal}
              className="px-4 py-1.5 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium flex items-center space-x-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-text-muted" />
              <span>Export Personal Data</span>
            </button>
          </div>

          {/* Workspace Data Retention Schedule (Admin only) */}
          <div className="p-4 rounded-card bg-surface-2 border border-border/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-text">Workspace Review Retention Schedule</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Automated retention threshold for aging review content and associated snapshots.
                </div>
              </div>
              {!isAdmin && <Chip variant="neutral" size="sm">Admin Only</Chip>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PillSelect
                value={String(retentionDays)}
                onChange={(val) => setRetentionDays(Number(val))}
                options={[
                  { value: '30', label: '30 Days (Standard Startup)' },
                  { value: '90', label: '90 Days (Quarterly Compliance)' },
                  { value: '365', label: '365 Days (Annual Enterprise Audit)' },
                  { value: '0', label: 'Indefinite (Keep all records)' },
                ]}
                ariaLabel="Select retention period"
              />

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => retentionDaysMutation.mutate()}
                  disabled={retentionDaysMutation.isPending}
                  className="px-4 py-1.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {retentionDaysMutation.isPending ? 'Updating...' : 'Save Retention Schedule'}
                </button>
              )}
            </div>

            {isAdmin && (
              <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-text-muted">
                  Manually purge reviews older than {retentionDays} days immediately.
                </div>
                <button
                  type="button"
                  onClick={handleRunRetention}
                  disabled={isPruning}
                  className="px-3.5 py-1.5 rounded-pill border border-danger/40 text-danger hover:bg-danger/10 text-xs font-semibold flex items-center space-x-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPruning ? 'animate-spin' : ''}`} />
                  <span>{isPruning ? 'Pruning Records...' : 'Execute Retention Cleanup Now'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Workspace Full Data Export */}
          {isAdmin && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-inner bg-surface-2 border border-border/80">
              <div>
                <div className="text-xs font-bold text-text">Export Complete Workspace Data</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Export brand kits, active rules, facts register, and review summary as JSON.
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportWorkspace}
                className="px-4 py-1.5 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium flex items-center space-x-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-text-muted" />
                <span>Export Workspace (JSON)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 8: Security */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-6">
          <div className="pb-2 border-b border-border/80">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-orange-text" />
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                Active Sessions & Device Security
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Inspect authenticated browser sessions, monitor device access, and audit log credentials.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text">Active User Sessions</span>
              <button
                type="button"
                onClick={handleRevokeOtherSessions}
                className="text-[11px] text-danger hover:underline font-semibold"
              >
                Sign Out of All Other Devices
              </button>
            </div>

            <div className="divide-y divide-border/60">
              {sessions?.map((sess: ActiveSession) => (
                <div key={sess.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <Laptop className="w-4 h-4 text-text-muted" />
                    <div>
                      <div className="text-xs font-semibold text-text flex items-center space-x-1.5">
                        <span>{sess.device_info}</span>
                        {sess.is_current && (
                          <Chip variant="success" size="sm">
                            This Device
                          </Chip>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted font-mono">
                        {sess.ip_address} · Signed in {new Date(sess.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {!sess.is_current && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.id)}
                      className="px-3 py-1 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Audit Log Link */}
          <div className="flex items-center justify-between p-3.5 rounded-inner bg-surface-2">
            <div>
              <div className="text-xs font-bold text-text">Append-Only Audit Log</div>
              <div className="text-[11px] text-text-muted">
                Inspect cryptographically verified SHA-256 hash chains of all tenant activity.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/audit')}
              className="px-3.5 py-1.5 rounded-pill border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium flex items-center space-x-1"
            >
              <span>View Audit Log</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 9: Danger Zone */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'danger_zone' && (
        <div className="p-6 rounded-card border border-danger/30 bg-surface shadow-floating space-y-6">
          <div className="pb-2 border-b border-danger/20">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <h2 className="text-sm font-bold text-danger uppercase tracking-wider">
                Irreversible Danger Zone Actions
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Permanently terminate workspaces or delete personal accounts. These actions cannot be undone.
            </p>
          </div>

          {isDemo && (
            <div className="p-4 rounded-card bg-orange-500/10 border border-orange-500/30 text-xs text-orange-text flex items-center space-x-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>Destructive actions are disabled in the Demo workspace.</span>
            </div>
          )}

          {/* Delete Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-inner bg-danger/10 border border-danger/20">
            <div>
              <div className="text-xs font-bold text-danger">Delete Personal Account</div>
              <div className="text-[11px] text-text-muted mt-0.5">
                Permanently delete your account, credentials, and personal identity. Authored reviews remain anonymized.
              </div>
            </div>
            <button
              type="button"
              disabled={isDemo}
              onClick={handleDeleteAccount}
              className="px-4 py-1.5 rounded-pill border border-danger/40 text-danger hover:bg-danger/20 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Delete Account
            </button>
          </div>

          {/* Delete Entire Workspace (Admin only) */}
          {isAdmin && (
            <div className="p-4 rounded-inner bg-danger/10 border border-danger/30 space-y-3">
              <div>
                <div className="text-xs font-bold text-danger">Delete Entire Workspace</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Irrevocably delete workspace '{currentWorkspace?.name}' and all associated brand kits, rules, facts, and reviews.
                </div>
              </div>

              {!isDemo && (
                <div className="space-y-2 pt-2">
                  <label className="block text-[11px] text-text-muted">
                    Type <span className="font-bold text-text">{currentWorkspace?.name}</span> to confirm:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={deleteConfirmationName}
                      onChange={(e) => setDeleteConfirmationName(e.target.value)}
                      placeholder={currentWorkspace?.name}
                      className="px-3 py-1.5 rounded-inner border border-border bg-surface text-xs text-text focus:outline-none focus:ring-1 focus:ring-danger"
                    />
                    <button
                      type="button"
                      onClick={handleDeleteWorkspace}
                      disabled={deleteConfirmationName !== currentWorkspace?.name}
                      className="px-4 py-1.5 rounded-pill bg-danger text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
