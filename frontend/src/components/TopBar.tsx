import React from 'react';
import { Menu, Sun, Moon, Monitor, Shield, ShieldCheck, UserCheck } from 'lucide-react';
import { useApp } from '../lib/context';
import { Role } from '../lib/types';
import { Chip, PillSelect } from './ui';

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

  const roleOptions = ROLES.map((r) => ({
    value: r,
    label: `Role: ${r}`,
  }));

  return (
    <header className="h-14 border-b border-border/80 bg-surface sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Toggle & Fictional Badge */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-pill border border-border text-text-muted hover:text-text lg:hidden"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Fictional Data Disclosure Chip */}
        <Chip variant="neutral" size="sm" dot>
          Demo data is fictional
        </Chip>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Confidential Mode Toggle Chip */}
        <button
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

        {/* Demo Role Switcher as PillSelect */}
        <PillSelect
          value={role}
          onChange={(val) => setRole(val as Role)}
          options={roleOptions}
          ariaLabel="Demo Role Switcher"
          icon={<UserCheck className="w-3.5 h-3.5 text-orange-text" />}
        />

        {/* Theme Toggle Button */}
        <button
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
  );
};
