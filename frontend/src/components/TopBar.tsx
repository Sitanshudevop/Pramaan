import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, Monitor, Shield, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useApp } from '../lib/context';
import { Role } from '../lib/types';
import { Chip, PillSelect } from './ui';

interface TopBarProps {
  onMenuClick: () => void;
}

const ROLES: Role[] = ['Creator', 'Reviewer', 'Brand manager', 'Admin'];

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Overview';
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
  const { role, setRole, theme, setTheme, confidentialMode, setConfidentialMode } = useApp();
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('pramaan_demo_notice_dismissed');
    if (!isDismissed) {
      setShowDemoNotice(true);
    }
  }, []);

  const dismissDemoNotice = () => {
    localStorage.setItem('pramaan_demo_notice_dismissed', 'true');
    setShowDemoNotice(false);
  };

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
        {/* Left Side: Page Title & Mobile Drawer Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-pill border border-border text-text-muted hover:text-text lg:hidden"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-text tracking-tight select-none">
            {pageTitle}
          </span>
        </div>

        {/* Right Side: Exactly Three Controls */}
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
            className="focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-pill"
          >
            {confidentialMode ? (
              <Chip variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                <span className="hidden sm:inline">Confidential ON</span>
              </Chip>
            ) : (
              <Chip variant="outline" size="sm" icon={<Shield className="w-3 h-3 text-text-muted" />}>
                <span className="hidden sm:inline">Confidential OFF</span>
              </Chip>
            )}
          </button>

          {/* 2. Role Selector */}
          <PillSelect
            value={role}
            onChange={(val) => setRole(val as Role)}
            options={roleOptions}
            ariaLabel="Demo Role Switcher"
            icon={<UserCheck className="w-3.5 h-3.5 text-orange-text" />}
          />

          {/* 3. Theme Toggle */}
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
        </div>
      </header>

      {/* Dismissible Thin Strip for Fictional Demo Notice */}
      {showDemoNotice && (
        <div className="bg-surface-2/80 border-b border-border/60 px-4 py-1 text-[11px] text-text-muted flex items-center justify-between select-none">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
            <span className="truncate">
              Demo data notice: All brand kits, facts registers, and sample reviews are fictional.
            </span>
          </div>
          <button
            type="button"
            onClick={dismissDemoNotice}
            className="p-1 text-text-muted hover:text-text rounded-pill transition-colors shrink-0 ml-2"
            aria-label="Dismiss notice"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </>
  );
};
