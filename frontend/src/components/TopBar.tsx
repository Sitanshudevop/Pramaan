import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Monitor,
  Shield,
  ShieldCheck,
  UserCheck,
  X,
  ChevronDown,
  Building2,
  Plus,
  LogOut,
  LogIn,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../lib/context';
import { Role } from '../lib/types';
import { Chip, PillSelect } from './ui';
import { AuthModal } from './AuthModal';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api';

interface TopBarProps {
  onMenuClick: () => void;
}

const ROLES: Role[] = ['Creator', 'Reviewer', 'Brand manager', 'Admin'];

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Overview';
  if (pathname === '/app/onboarding') return 'Workspace Setup';
  if (pathname === '/app/new') return 'New Content Review';
  if (pathname.startsWith('/app/review')) return 'Review Findings';
  if (pathname === '/app/queue') return 'Review Queue';
  if (pathname === '/app/hub') return 'Brand Knowledge Hub';
  if (pathname === '/app/audit') return 'Audit & AI Disclosure';
  if (pathname === '/app/insights') return 'Brand Insights & Radar';
  if (pathname === '/about') return 'About Pramaan';
  return 'Pramaan';
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    currentWorkspace,
    workspaces,
    isDemoMode,
    role,
    setRole,
    theme,
    setTheme,
    confidentialMode,
    setConfidentialMode,
    signOut,
    switchWorkspace,
    enterDemoWorkspace,
  } = useApp();

  const [showDemoNotice, setShowDemoNotice] = useState(true);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentWorkspace?.id, user?.id],
    queryFn: getNotifications,
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const roleOptions = ROLES.map((r) => ({
    value: r,
    label: `Role: ${r}`,
  }));

  const pageTitle = getPageTitle(location.pathname);

  return (
    <>
      <header className="h-14 border-b border-border/80 bg-surface sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
        {/* Left Side: Page Title, Workspace Dropdown & Mobile Drawer Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-pill border border-border text-text-muted hover:text-text lg:hidden"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-text tracking-tight select-none">
            {pageTitle}
          </span>

          <span className="text-border hidden sm:inline">|</span>

          {/* Tenant Workspace Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-pill border border-border bg-surface-2 hover:bg-surface text-xs font-semibold text-text transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-orange-text" />
              <span className="max-w-[140px] truncate">
                {currentWorkspace?.name || 'Demo Workspace'}
              </span>
              {currentWorkspace?.is_demo && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-pill bg-orange-500/10 text-orange-text font-bold">
                  Demo
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>

            {workspaceDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-card border border-border bg-surface shadow-floating py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Workspaces
                </div>

                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setWorkspaceDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-surface-2 transition-colors ${
                      currentWorkspace?.id === ws.id ? 'font-bold text-orange-text' : 'text-text'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    <span className="text-[10px] text-text-muted capitalize">{ws.role}</span>
                  </button>
                ))}

                <div className="border-t border-border my-1" />

                {/* Demo Workspace entry */}
                <button
                  type="button"
                  onClick={() => {
                    enterDemoWorkspace();
                    setWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 hover:bg-surface-2 transition-colors ${
                    currentWorkspace?.is_demo ? 'font-bold text-orange-text' : 'text-text'
                  }`}
                >
                  <span>Demo Workspace (Fictional)</span>
                </button>

                <div className="border-t border-border my-1" />

                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceDropdownOpen(false);
                      navigate('/app/onboarding');
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center space-x-1.5 text-text hover:bg-surface-2 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-text" />
                    <span>Create new workspace</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceDropdownOpen(false);
                      setAuthMode('signup');
                      setAuthModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center space-x-1.5 text-text hover:bg-surface-2 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-text" />
                    <span>Sign up for a workspace</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-2.5">
          {/* 1. Confidential Mode Chip */}
          <button
            type="button"
            onClick={() => setConfidentialMode(!confidentialMode)}
            title={
              confidentialMode
                ? 'Confidential Mode: ON (Deterministic offline only, zero external AI calls)'
                : 'Confidential Mode: OFF (AI layer active with PII redaction)'
            }
            style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
            className="no-orange-outline rounded-pill outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none border-0 ring-0 ring-offset-0"
          >
            {confidentialMode ? (
              <Chip variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />} className="border-0 shadow-none">
                <span className="hidden sm:inline">Confidential ON</span>
              </Chip>
            ) : (
              <Chip variant="outline" size="sm" icon={<Shield className="w-3 h-3 text-text-muted" />} className="border-0 shadow-none">
                <span className="hidden sm:inline">Confidential OFF</span>
              </Chip>
            )}
          </button>

          {/* 2. Role Selector (in Demo) OR Fixed Role Badge (in Real Workspace) */}
          {isDemoMode ? (
            <PillSelect
              value={role}
              onChange={(val) => setRole(val as Role)}
              options={roleOptions}
              ariaLabel="Demo Role Switcher"
              icon={<UserCheck className="w-3.5 h-3.5 text-orange-text" />}
            />
          ) : (
            <Chip variant="neutral" size="sm" icon={<UserCheck className="w-3 h-3 text-orange-text" />}>
              <span>Role: {role}</span>
            </Chip>
          )}

          {/* 3. Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-1.5 rounded-pill border border-border text-text-muted hover:text-text hover:bg-surface-2 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
              title="Notifications"
              aria-label={`Notifications: ${unreadCount} unread`}
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-card bg-surface border border-border shadow-xl z-50 overflow-hidden text-xs">
                <div className="px-3.5 py-2.5 border-b border-border flex items-center justify-between bg-surface-2/60">
                  <span className="font-bold text-text">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => readAllMutation.mutate()}
                      className="text-[11px] text-orange-text hover:underline flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-text-muted">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.is_read) readMutation.mutate(n.id);
                          if (n.link) {
                            setNotifDropdownOpen(false);
                            navigate(n.link);
                          }
                        }}
                        className={`p-3 cursor-pointer hover:bg-surface-2 transition-colors ${
                          !n.is_read ? 'bg-orange-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className={`font-semibold text-text ${!n.is_read ? 'text-orange-text' : ''}`}>
                            {n.title}
                          </span>
                          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1" />}
                        </div>
                        <p className="text-text-muted text-[11px] mt-0.5 line-clamp-2">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Theme Toggle */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-1.5 rounded-pill border border-border text-text-muted hover:text-text hover:bg-surface-2 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
            title={`Theme: ${theme}. Click to switch.`}
            aria-label={`Cycle theme: current ${theme}`}
          >
            {theme === 'light' && <Sun className="w-3.5 h-3.5" />}
            {theme === 'dark' && <Moon className="w-3.5 h-3.5" />}
            {theme === 'system' && <Monitor className="w-3.5 h-3.5" />}
          </button>

          {/* 4. User Account Menu or Sign In */}
          {user ? (
            <button
              type="button"
              onClick={signOut}
              title={`Signed in as ${user.email}. Click to sign out.`}
              className="p-1.5 rounded-pill border border-border text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setAuthModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center space-x-1 px-3 py-1 rounded-pill bg-surface border border-border text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Dismissible Thin Strip for Fictional Demo Notice ONLY in Demo Workspace */}
      {isDemoMode && showDemoNotice && (
        <div className="bg-surface-2/80 border-b border-border/60 px-4 py-1 text-[11px] text-text-muted flex items-center justify-between select-none">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
            <span className="truncate">
              Demo workspace notice: All brand kits, facts registers, and sample reviews are fictional.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoNotice(false)}
            className="p-1 text-text-muted hover:text-text rounded-pill transition-colors shrink-0 ml-2"
            aria-label="Dismiss notice"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => navigate('/app/hub')}
      />
    </>
  );
};
