import React from 'react';
import { Menu, Sun, Moon, Monitor, Shield, ShieldCheck, UserCheck } from 'lucide-react';
import { useApp } from '../lib/context';
import { Role } from '../lib/types';

interface TopBarProps {
  onMenuClick: () => void;
}

const ROLES: Role[] = ['Creator', 'Reviewer', 'Brand manager', 'Admin'];

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { role, setRole, theme, setTheme, confidentialMode, setConfidentialMode } = useApp();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <header className="h-14 border-b border-border bg-surface sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Toggle & Status */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-btn border border-border text-text-muted hover:text-text lg:hidden"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Fictional Data Disclosure Badge */}
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-2 text-text-muted border border-border">
          Demo data is fictional
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Confidential Mode Toggle */}
        <button
          onClick={() => setConfidentialMode(!confidentialMode)}
          title={
            confidentialMode
              ? 'Confidential Mode: ON (Deterministic offline only, zero external AI calls)'
              : 'Confidential Mode: OFF (AI layer active with PII redaction)'
          }
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-btn text-xs font-medium border transition-colors ${
            confidentialMode
              ? 'bg-success/10 text-success border-success/30'
              : 'bg-surface-2 text-text-muted border-border hover:text-text'
          }`}
        >
          {confidentialMode ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Confidential ON</span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 opacity-70" />
              <span className="hidden sm:inline">Confidential OFF</span>
            </>
          )}
        </button>

        {/* Demo Role Switcher */}
        <div className="flex items-center space-x-1.5 bg-surface-2 px-2 py-1 rounded-btn border border-border">
          <UserCheck className="w-3.5 h-3.5 text-accent" />
          <label htmlFor="demo-role-select" className="sr-only">
            Demo Role Switcher
          </label>
          <select
            id="demo-role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="bg-transparent text-xs font-medium text-text focus:outline-none cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-surface text-text">
                Role: {r}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="p-1.5 rounded-btn border border-border text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          title={`Theme: ${theme}. Click to switch.`}
          aria-label={`Cycle theme: current ${theme}`}
        >
          {theme === 'light' && <Sun className="w-3.5 h-3.5" />}
          {theme === 'dark' && <Moon className="w-3.5 h-3.5" />}
          {theme === 'system' && <Monitor className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
