import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  Shield,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Building2,
  Plus,
  LogOut,
  LogIn,
  Bell,
  CheckCheck,
  Settings,
  MoreVertical,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../lib/context';
import { DEMO_CAST } from '../lib/types';
import { Chip } from './ui';
import { AuthModal } from './AuthModal';
import { Logo } from './Logo';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api';

interface TopBarProps {
  drawerOpen: boolean;
  onHamburgerClick: () => void;
  hamburgerRef?: React.RefObject<HTMLButtonElement>;
  desktopMode: 'expanded' | 'rail';
}

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Overview';
  if (pathname === '/app/onboarding') return 'Workspace Setup';
  if (pathname === '/app/new') return 'New Content Review';
  if (pathname.startsWith('/app/review')) return 'Review Findings';
  if (pathname === '/app/queue') return 'Review Queue';
  if (pathname === '/app/hub') return 'Brand Knowledge Hub';
  if (pathname === '/app/audit') return 'Audit & AI Disclosure';
  if (pathname === '/app/insights') return 'Brand Insights & Radar';
  if (pathname === '/app/settings') return 'Settings';
  if (pathname === '/app/team') return 'Team & Members';
  if (pathname === '/about') return 'About Pramaan';
  return 'Pramaan';
}

export const TopBar: React.FC<TopBarProps> = ({
  drawerOpen,
  onHamburgerClick,
  hamburgerRef,
  desktopMode,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    currentWorkspace,
    workspaces,
    isDemoMode,
    role,
    demoPersona,
    switchDemoPersona,
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
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setPersonaDropdownOpen(false);
      }
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close overflow on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && overflowMenuOpen) {
        setOverflowMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [overflowMenuOpen]);

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <>
      <header className="h-14 border-b border-border/80 bg-surface sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 lg:px-6">
        {/* ============================================================== */}
        {/* Left Side: Hamburger, Logo, Page Title, Workspace Dropdown    */}
        {/* ============================================================== */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {/* Hamburger Navigation Button */}
          <button
            ref={hamburgerRef}
            type="button"
            onClick={onHamburgerClick}
            className="p-2 -ml-1 rounded-pill border border-border text-text-muted hover:text-text hover:bg-surface-2 transition-colors touch-target flex items-center justify-center shrink-0"
            aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={drawerOpen}
            aria-controls="app-navigation"
            title={desktopMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Logo Mark: Icon only on phone (<640px), Full logo with text on tablet/desktop */}
          <div className="shrink-0 flex items-center">
            {/* On phone: icon only */}
            <div className="sm:hidden">
              <Logo size="sm" showText={false} />
            </div>
            {/* On tablet: show logo with text */}
            <div className="hidden sm:block lg:hidden">
              <Logo size="sm" showText={true} />
            </div>
          </div>

          <span className="text-border hidden sm:inline shrink-0">|</span>

          {/* Page Title: single line, truncated with ellipsis on small screens */}
          <span className="text-sm font-bold text-text tracking-tight truncate max-w-[120px] sm:max-w-[180px] md:max-w-none select-none">
            {pageTitle}
          </span>

          {/* Desktop Workspace Selector Dropdown (>= 1024px) */}
          <div className="relative hidden lg:block" ref={dropdownRef}>
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

        {/* ============================================================== */}
        {/* Right Side: Reorganised Controls by Viewport Width             */}
        {/* ============================================================== */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* 1. Desktop Only Controls (>= 1024px) */}
          <div className="hidden lg:flex items-center space-x-2.5">
            {/* Confidential Mode Chip */}
            <button
              type="button"
              onClick={() => setConfidentialMode(!confidentialMode)}
              title={
                confidentialMode
                  ? 'Confidential Mode: ON (Deterministic offline only, zero external AI calls)'
                  : 'Confidential Mode: OFF (AI layer active with PII redaction)'
              }
              className="no-orange-outline rounded-pill select-none border-0 ring-0 ring-offset-0"
            >
              {confidentialMode ? (
                <Chip variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />} className="border-0 shadow-none">
                  <span>Confidential ON</span>
                </Chip>
              ) : (
                <Chip variant="outline" size="sm" icon={<Shield className="w-3 h-3 text-text-muted" />} className="border-0 shadow-none">
                  <span>Confidential OFF</span>
                </Chip>
              )}
            </button>

            {/* Persona Switcher (Demo) OR Fixed Role Badge (Real Workspace) */}
            {isDemoMode ? (
              <div className="relative" ref={personaRef}>
                {/* Accessible & Automation Select Helper */}
                <select
                  aria-label="Demo Role Switcher"
                  className="sr-only"
                  tabIndex={-1}
                  value={role}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    const match = DEMO_CAST.find((c) => c.role.toLowerCase() === selectedRole.toLowerCase());
                    if (match) {
                      switchDemoPersona(match.id);
                      queryClient.invalidateQueries();
                    }
                  }}
                >
                  <option value="Creator">Creator</option>
                  <option value="Reviewer">Reviewer</option>
                  <option value="Brand manager">Brand manager</option>
                  <option value="Admin">Admin</option>
                </select>

                <button
                  type="button"
                  onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                  className="px-2.5 py-1 rounded-pill border border-border bg-surface hover:bg-surface-2 transition-colors flex items-center space-x-2 text-xs"
                  aria-label="Demo Role Switcher"
                  title={`Viewing as ${demoPersona.name} (${demoPersona.role})`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: demoPersona.avatarColor }}
                  >
                    {demoPersona.initials}
                  </span>
                  <span className="font-semibold text-text">
                    {demoPersona.name}
                  </span>
                  <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded-pill bg-surface-2 border border-border/60">
                    {demoPersona.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-text-muted" />
                </button>

                {personaDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 rounded-card border border-border bg-surface shadow-floating py-1.5 z-50 text-xs">
                    <div className="px-3 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-border/70 mb-1">
                      View Demo As
                    </div>
                    {DEMO_CAST.map((p) => {
                      const isActive = p.id === demoPersona.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            switchDemoPersona(p.id);
                            setPersonaDropdownOpen(false);
                            queryClient.invalidateQueries();
                          }}
                          className={`w-full text-left px-3 py-2 flex items-start space-x-2.5 transition-colors ${
                            isActive ? 'bg-orange-500/10' : 'hover:bg-surface-2'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs shrink-0 mt-0.5"
                            style={{ backgroundColor: p.avatarColor }}
                          >
                            {p.initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-text truncate">{p.name}</span>
                              <span className="text-[10px] font-semibold text-orange-text">{p.role}</span>
                            </div>
                            <p className="text-[10px] text-text-muted truncate mt-0.5">{p.bio}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <Chip variant="neutral" size="sm" icon={<UserCheck className="w-3 h-3 text-orange-text" />}>
                <span>Role: {role}</span>
              </Chip>
            )}
          </div>

          {/* 2. Notification Bell (Visible on ALL screen sizes) */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 rounded-pill border border-border text-text-muted hover:text-text hover:bg-surface-2 transition-colors touch-target flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-500"
              title="Notifications"
              aria-label={`Notifications: ${unreadCount} unread`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-card bg-surface border border-border shadow-xl z-50 overflow-hidden text-xs">
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

          {/* 3. Theme Toggle (Visible on Tablet and Desktop: >= 640px) */}
          <div className="hidden sm:block">
            <button
              type="button"
              onClick={cycleTheme}
              className="p-2 rounded-pill border border-border text-text-muted hover:text-text hover:bg-surface-2 transition-colors touch-target flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-500"
              title={`Theme: ${theme}. Click to switch.`}
              aria-label={`Cycle theme: current ${theme}`}
            >
              {theme === 'light' && <Sun className="w-4 h-4" />}
              {theme === 'dark' && <Moon className="w-4 h-4" />}
              {theme === 'system' && <Monitor className="w-4 h-4" />}
            </button>
          </div>

          {/* 4. Desktop Sign In / Sign Out (>= 1024px) */}
          <div className="hidden lg:block">
            {user ? (
              <button
                type="button"
                onClick={signOut}
                title={`Signed in as ${user.email}. Click to sign out.`}
                className="p-2 rounded-pill border border-border text-text-muted hover:text-danger hover:bg-danger/10 transition-colors touch-target flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-pill bg-surface border border-border text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* 5. Mobile & Tablet Overflow/Avatar Button (< 1024px) */}
          <div className="lg:hidden relative" ref={overflowRef}>
            <button
              type="button"
              onClick={() => setOverflowMenuOpen(!overflowMenuOpen)}
              className="p-1.5 rounded-pill border border-border bg-surface hover:bg-surface-2 transition-colors touch-target flex items-center justify-center space-x-1"
              aria-label="Workspace & profile settings menu"
              aria-expanded={overflowMenuOpen}
            >
              {isDemoMode ? (
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: demoPersona.avatarColor }}
                >
                  {demoPersona.initials}
                </span>
              ) : user ? (
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.email.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <MoreVertical className="w-4 h-4 text-text-muted" />
              )}
            </button>

            {/* Overflow Menu (Bottom Sheet on Phone < 640px, Popover Dropdown on Tablet 640-1023px) */}
            {overflowMenuOpen && (
              <>
                {/* Backdrop for mobile bottom sheet */}
                <div
                  className="fixed inset-0 bg-black/60 z-40 sm:hidden backdrop-blur-xs"
                  onClick={() => setOverflowMenuOpen(false)}
                  aria-hidden="true"
                />

                <div
                  className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] border-t border-border bg-surface p-4 max-h-[85dvh] overflow-y-auto pb-safe shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-full sm:mt-2 sm:w-80 sm:rounded-card sm:border sm:p-2 sm:shadow-xl sm:max-h-none"
                  role="dialog"
                  aria-label="Quick Settings & Profile"
                >
                  {/* Phone drag handle */}
                  <div className="w-12 h-1.5 bg-border rounded-pill mx-auto mb-3 sm:hidden" />

                  <div className="space-y-1.5 text-xs">
                    {/* Header: Persona or Workspace summary */}
                    <div className="px-3 py-2 rounded-inner bg-surface-2 flex items-center justify-between">
                      <div className="truncate">
                        <div className="font-bold text-text text-sm">
                          {isDemoMode ? demoPersona.name : currentWorkspace?.name || 'Workspace'}
                        </div>
                        <div className="text-text-muted text-[11px] truncate">
                          {isDemoMode ? `${demoPersona.role} · ${demoPersona.email}` : user?.email || 'Guest'}
                        </div>
                      </div>
                      {isDemoMode && (
                        <span className="text-[10px] px-2 py-0.5 rounded-pill bg-orange-500/10 text-orange-text font-bold uppercase">
                          Demo
                        </span>
                      )}
                    </div>

                    {/* 1. Switch Demo Persona (in Demo Workspace) */}
                    {isDemoMode && (
                      <div className="pt-2">
                        <div className="px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          View Demo As
                        </div>
                        <div className="space-y-1">
                          {DEMO_CAST.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                switchDemoPersona(p.id);
                                setOverflowMenuOpen(false);
                                queryClient.invalidateQueries();
                              }}
                              className={`w-full text-left px-3 py-2.5 h-12 rounded-inner flex items-center space-x-2.5 transition-colors touch-target ${
                                p.id === demoPersona.id ? 'bg-orange-500/10 text-orange-text font-bold' : 'hover:bg-surface-2 text-text'
                              }`}
                            >
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ backgroundColor: p.avatarColor }}
                              >
                                {p.initials}
                              </span>
                              <div className="truncate min-w-0 flex-1">
                                <span className="font-semibold">{p.name}</span>
                                <span className="text-text-muted text-[10px] ml-1.5">({p.role})</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Workspace switcher options */}
                    <div className="pt-2 border-t border-border/70">
                      <div className="px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        Workspace
                      </div>
                      {workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            switchWorkspace(ws.id);
                            setOverflowMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 h-12 rounded-inner flex items-center justify-between transition-colors touch-target ${
                            currentWorkspace?.id === ws.id ? 'bg-orange-500/10 text-orange-text font-bold' : 'hover:bg-surface-2 text-text'
                          }`}
                        >
                          <span className="truncate">{ws.name}</span>
                          <span className="text-[10px] text-text-muted capitalize">{ws.role}</span>
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          enterDemoWorkspace();
                          setOverflowMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 h-12 rounded-inner flex items-center space-x-2 transition-colors touch-target ${
                          currentWorkspace?.is_demo ? 'bg-orange-500/10 text-orange-text font-bold' : 'hover:bg-surface-2 text-text'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-orange-text shrink-0" />
                        <span>Demo Workspace (Fictional)</span>
                      </button>
                    </div>

                    {/* 3. Confidential Mode Toggle */}
                    <div className="pt-2 border-t border-border/70">
                      <button
                        type="button"
                        onClick={() => setConfidentialMode(!confidentialMode)}
                        className="w-full text-left px-3 h-12 rounded-inner flex items-center justify-between hover:bg-surface-2 text-text transition-colors touch-target"
                      >
                        <div className="flex items-center space-x-2.5">
                          {confidentialMode ? (
                            <ShieldCheck className="w-4 h-4 text-success-text" />
                          ) : (
                            <Shield className="w-4 h-4 text-text-muted" />
                          )}
                          <span>Confidential Mode</span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-pill ${
                          confidentialMode ? 'bg-success/15 text-success-text' : 'bg-surface-2 text-text-muted'
                        }`}>
                          {confidentialMode ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>

                    {/* 4. Theme Picker on Phone (<640px) */}
                    <div className="pt-2 border-t border-border/70 sm:hidden">
                      <div className="px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        Appearance
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-1 py-1">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`h-10 rounded-inner flex items-center justify-center space-x-1.5 border transition-colors touch-target ${
                            theme === 'light' ? 'bg-orange-500/10 border-orange-500 text-orange-text font-bold' : 'border-border text-text'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          <span>Light</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`h-10 rounded-inner flex items-center justify-center space-x-1.5 border transition-colors touch-target ${
                            theme === 'dark' ? 'bg-orange-500/10 border-orange-500 text-orange-text font-bold' : 'border-border text-text'
                          }`}
                        >
                          <Moon className="w-3.5 h-3.5" />
                          <span>Dark</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('system')}
                          className={`h-10 rounded-inner flex items-center justify-center space-x-1.5 border transition-colors touch-target ${
                            theme === 'system' ? 'bg-orange-500/10 border-orange-500 text-orange-text font-bold' : 'border-border text-text'
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <span>System</span>
                        </button>
                      </div>
                    </div>

                    {/* 5. Quick link to Settings */}
                    <div className="pt-2 border-t border-border/70">
                      <button
                        type="button"
                        onClick={() => {
                          setOverflowMenuOpen(false);
                          navigate('/app/settings');
                        }}
                        className="w-full text-left px-3 h-12 rounded-inner flex items-center space-x-2.5 text-text hover:bg-surface-2 transition-colors touch-target"
                      >
                        <Settings className="w-4 h-4 text-text-muted" />
                        <span>Workspace Settings</span>
                      </button>
                    </div>

                    {/* 6. Sign In or Sign Out */}
                    <div className="pt-2 border-t border-border/70">
                      {user ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOverflowMenuOpen(false);
                            signOut();
                          }}
                          className="w-full text-left px-3 h-12 rounded-inner flex items-center space-x-2.5 text-danger hover:bg-danger/10 transition-colors touch-target"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOverflowMenuOpen(false);
                            setAuthMode('signin');
                            setAuthModalOpen(true);
                          }}
                          className="w-full text-left px-3 h-12 rounded-inner flex items-center space-x-2.5 text-orange-text font-semibold hover:bg-orange-500/10 transition-colors touch-target"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Sign In / Register</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* Dismissible Thin Strip for Fictional Demo Notice               */}
      {/* (Never wraps into multiple lines; truncates with ellipsis)     */}
      {/* ============================================================== */}
      {isDemoMode && showDemoNotice && (
        <div className="bg-surface-2/80 border-b border-border/60 px-3 sm:px-4 py-1 text-[11px] text-text-muted flex items-center justify-between select-none">
          <div className="flex items-center space-x-1.5 min-w-0 flex-1 mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
            <span className="truncate">
              Demo workspace notice: All brand kits, facts registers, and sample reviews are fictional.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoNotice(false)}
            className="p-1 text-text-muted hover:text-text rounded-pill transition-colors shrink-0"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
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