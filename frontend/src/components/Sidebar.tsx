import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FilePlus,
  Inbox,
  BookOpen,
  Users,
  ShieldCheck,
  BarChart3,
  Settings,
  Info,
  X,
} from 'lucide-react';
import { Logo } from './Logo';

export interface SidebarProps {
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  hamburgerRef?: React.RefObject<HTMLButtonElement>;
}

export const NAV_ITEMS = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'New review', path: '/app/new', icon: FilePlus },
  { name: 'Review queue', path: '/app/queue', icon: Inbox },
  { name: 'Brand Hub', path: '/app/hub', icon: BookOpen },
  { name: 'Team', path: '/app/team', icon: Users },
  { name: 'Audit & disclosure', path: '/app/audit', icon: ShieldCheck },
  { name: 'Insights', path: '/app/insights', icon: BarChart3 },
  { name: 'Settings', path: '/app/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  drawerOpen,
  onCloseDrawer,
  hamburgerRef,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // Focus trap, Escape key handling, and body scroll lock for mobile drawer (<1024px)
  useEffect(() => {
    if (!drawerOpen) return;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element inside drawer
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(focusableSelector);

    if (focusableElements && focusableElements.length > 0 && focusableElements[0]) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseDrawer();
        hamburgerRef?.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        if (!focusableElements || focusableElements.length === 0) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen, onCloseDrawer, hamburgerRef]);

  // Handle swipe left to close on touch screens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches && e.changedTouches[0]) {
      const deltaX = touchStartXRef.current - e.changedTouches[0].clientX;
      const deltaY = Math.abs(touchStartYRef.current - e.changedTouches[0].clientY);
      // If swiped left at least 50px and predominantly horizontal
      if (deltaX > 50 && deltaX > deltaY) {
        onCloseDrawer();
        hamburgerRef?.current?.focus();
      }
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. Mobile & Tablet Off-Canvas Drawer (<1024px)                  */}
      {/* ============================================================== */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => {
            onCloseDrawer();
            hamburgerRef?.current?.focus();
          }}
          aria-hidden="true"
        />
      )}

      <div
        id="app-navigation-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        aria-hidden={!drawerOpen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 bottom-0 left-0 z-50 bg-surface border-r border-border flex flex-col justify-between transition-all duration-200 ease-in-out lg:hidden select-none overflow-hidden max-w-[320px] w-[88vw] ${
          drawerOpen
            ? 'translate-x-0 opacity-100 visible pointer-events-auto'
            : '-translate-x-full opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Drawer Header: Logo + Close Button (ABOVE "Home") */}
        <div>
          <div className="h-14 border-b border-border/80 flex items-center justify-between px-4 shrink-0">
            <Logo size="md" showText={true} />
            <button
              type="button"
              onClick={() => {
                onCloseDrawer();
                hamburgerRef?.current?.focus();
              }}
              className="p-2 -mr-2 rounded-pill text-text-muted hover:text-text hover:bg-surface-2 transition-colors touch-target flex items-center justify-center"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Navigation Items: "Home" is the first nav item directly below header */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100dvh-130px)]" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => {
                  onCloseDrawer();
                  hamburgerRef?.current?.focus();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 h-12 rounded-inner text-sm transition-colors touch-target ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
                      : 'text-text-muted hover:text-text hover:bg-surface-2 font-medium'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Drawer Footer: About & Compact Legal Links */}
        <div className="p-3 border-t border-border/60 space-y-2 pb-safe bg-surface shrink-0">
          <NavLink
            to="/about"
            onClick={() => {
              onCloseDrawer();
              hamburgerRef?.current?.focus();
            }}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 h-10 rounded-inner text-xs transition-colors touch-target ${
                isActive
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
                  : 'text-text-muted hover:text-text hover:bg-surface-2 font-medium'
              }`
            }
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>About Pramaan</span>
          </NavLink>
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-text-muted">
            <NavLink to="/privacy" onClick={onCloseDrawer} className="hover:underline py-1">Privacy</NavLink>
            <span>·</span>
            <NavLink to="/terms" onClick={onCloseDrawer} className="hover:underline py-1">Terms</NavLink>
            <span>·</span>
            <NavLink to="/ai-disclosure" onClick={onCloseDrawer} className="hover:underline py-1">AI Ethics</NavLink>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. Desktop Persistent Sidebar (>= 1024px)                       */}
      {/* ============================================================== */}
      <aside
        id="app-navigation"
        aria-label="Application Sidebar"
        className="hidden lg:flex fixed top-0 bottom-0 left-0 z-30 bg-surface border-r border-border flex-col justify-between select-none w-[240px]"
      >
        {/* Top: Header with Logo mark + "Pramaan" wordmark */}
        <div>
          <div className="h-14 border-b border-border/80 flex items-center px-4 shrink-0">
            <Logo size="md" showText={true} />
          </div>

          {/* Navigation Items: persistent full sidebar (240px, icons + labels) */}
          <nav className="p-3 space-y-1" aria-label="Desktop Navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                aria-label={item.name}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 h-11 rounded-inner text-sm transition-colors ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
                      : 'text-text-muted hover:text-text hover:bg-surface-2 font-medium'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Footer: About & Compact Legal Links */}
        <div className="p-3 border-t border-border/60 space-y-2 bg-surface shrink-0">
          <NavLink
            to="/about"
            aria-label="About Pramaan"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 h-10 rounded-inner text-xs transition-colors ${
                isActive
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
                  : 'text-text-muted hover:text-text hover:bg-surface-2 font-medium'
              }`
            }
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>About Pramaan</span>
          </NavLink>

          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-text-muted">
            <NavLink to="/privacy" className="hover:underline">Privacy</NavLink>
            <span>·</span>
            <NavLink to="/terms" className="hover:underline">Terms</NavLink>
            <span>·</span>
            <NavLink to="/ai-disclosure" className="hover:underline">AI Ethics</NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};
