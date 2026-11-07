import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Building2,
  Clock,
} from 'lucide-react';
import { useApp } from '../lib/context';
import { Role, Invitation } from '../lib/types';
import {
  listWorkspaceMembers,
  createInvitation,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} from '../lib/api';
import { Chip } from '../components/ui';

const ROLES: Role[] = ['Admin', 'Brand manager', 'Reviewer', 'Creator'];

export const Team: React.FC = () => {
  const { currentWorkspace, role: myRole, user } = useApp();
  const queryClient = useQueryClient();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Creator');
  const [createdInvite, setCreatedInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsId = currentWorkspace?.id || 'ws-demo';

  const { data: members, isLoading } = useQuery({
    queryKey: ['workspaceMembers', wsId],
    queryFn: () => listWorkspaceMembers(wsId),
    enabled: !!currentWorkspace && !currentWorkspace.is_demo,
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      createInvitation(wsId, {
        email: inviteEmail.trim() || undefined,
        role: inviteRole,
        max_uses: 1,
      }),
    onSuccess: (data) => {
      setCreatedInvite(data);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create invite');
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: Role }) =>
      updateWorkspaceMemberRole(wsId, userId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceMembers', wsId] });
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to update member role');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeWorkspaceMember(wsId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceMembers', wsId] });
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to remove member');
    },
  });

  const handleCopyInvite = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdmin = myRole === 'Admin';
  const canManage = myRole === 'Admin' || myRole === 'Brand manager';

  if (currentWorkspace?.is_demo) {
    return (
      <div className="max-w-app mx-auto py-12 text-center space-y-4">
        <div className="p-8 rounded-card border border-border bg-surface shadow-floating max-w-md mx-auto space-y-3">
          <Building2 className="w-10 h-10 text-orange-text mx-auto" />
          <h2 className="text-xl font-bold text-text">Demo Workspace</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Team collaboration and invite links require a registered workspace.
            Sign up or create your workspace to invite teammates and assign roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-app mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Team & Members</h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Manage workspace teammates, membership roles, and shareable invitation links.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setCreatedInvite(null);
              setInviteEmail('');
              setInviteRole('Creator');
              setErrorMessage(null);
              setInviteModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 shadow-sm transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Teammate</span>
          </button>
        )}
      </div>

      {/* Members List Card */}
      <div className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-orange-text" />
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Active Teammates ({members?.length || 0})
            </span>
          </div>
          <span className="text-[11px] text-text-muted font-mono">
            Workspace: {currentWorkspace?.name}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-text-muted font-mono">
            Loading workspace team...
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {members?.map((mem) => {
              const isMe = mem.user_id === user?.id;
              return (
                <div key={mem.user_id} className="py-3.5 flex items-center justify-between gap-4 first:pt-1">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-pill bg-surface-2 border border-border flex items-center justify-center font-bold text-xs text-orange-text shrink-0">
                      {mem.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-text truncate">
                          {mem.full_name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-pill bg-orange-500/10 text-orange-text font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted font-mono truncate">
                        {mem.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {/* Role selector for Admin, Chip for others */}
                    {isAdmin && !isMe ? (
                      <select
                        value={mem.role}
                        onChange={(e) =>
                          roleMutation.mutate({
                            userId: mem.user_id,
                            newRole: e.target.value as Role,
                          })
                        }
                        disabled={roleMutation.isPending}
                        className="text-xs font-semibold px-2.5 py-1 rounded-pill border border-border bg-surface-2 text-text focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Chip
                        variant={
                          mem.role === 'Admin'
                            ? 'accent'
                            : mem.role === 'Brand manager'
                            ? 'success'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {mem.role}
                      </Chip>
                    )}

                    {/* Remove Member button (Admin only, not self) */}
                    {isAdmin && !isMe && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${mem.full_name} from workspace?`)) {
                            removeMutation.mutate(mem.user_id);
                          }
                        }}
                        disabled={removeMutation.isPending}
                        title="Remove member from workspace"
                        className="p-1.5 rounded-pill text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-card bg-surface border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-orange-text" />
                <span>Invite Teammate</span>
              </h3>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-text-muted hover:text-text text-sm"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-inner bg-danger/10 border border-danger/20 text-danger text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {!createdInvite ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="teammate@company.com (leave blank for open link)"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-[11px] text-text-muted">
                    If SMTP is not configured, an instant copyable link will be created.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text">
                    Workspace Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className="w-full px-3.5 py-2 rounded-inner border border-border bg-surface-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 rounded-pill border border-border text-xs text-text hover:bg-surface-2 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => inviteMutation.mutate()}
                    disabled={inviteMutation.isPending}
                    className="px-5 py-2 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm"
                  >
                    {inviteMutation.isPending ? 'Generating...' : 'Create Invite Link'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-inner bg-success/10 border border-success/30 text-success-text text-xs space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Invite link ready!</span>
                  </div>
                  <div className="text-[11px]">
                    Share this link with your teammate. It grants{' '}
                    <strong>{createdInvite.role}</strong> access to {currentWorkspace?.name}.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text">
                    Shareable Invitation URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={createdInvite.invite_url}
                      className="w-full px-3 py-2 rounded-inner border border-border bg-surface-2 text-xs font-mono text-text select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyInvite(createdInvite.invite_url)}
                      className="px-3 py-2 rounded-inner bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold shrink-0 flex items-center space-x-1 hover:opacity-90"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted flex items-center space-x-1 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>Link valid for 7 days. Single use.</span>
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-5 py-2 rounded-pill bg-surface-2 border border-border text-xs text-text font-semibold hover:bg-surface"
                  >
                    Done
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