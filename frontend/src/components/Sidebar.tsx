import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FilePlus,
  Inbox,
  BookOpen,
  ShieldCheck,
  BarChart3,
  Info,
  Users,
  Settings,
} from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'New review', path: '/app/new', icon: FilePlus },
  { name: 'Review queue', path: '/app/queue', icon: Inbox },
  { name: 'Brand Hub', path: '/app/hub', icon: BookOpen },
  { name: 'Team', path: '/app/team', icon: Users },
  { name: 'Audit & disclosure', path: '/app/audit', icon: ShieldCheck },
  { name: 'Insights', path: '/app/insights', icon: BarChart3 },
  { name: 'Settings', path: '/app/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[232px] border-r border-border bg-surface flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 select-none overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Application Sidebar"
      >
        {/* Top: Logo + Brand */}
        <div>
          <div className="h-14 border-b border-border/80 flex items-center px-4">
            <Logo size="md" />
          </div>

          {/* Six items: 40px row height, 8px gap (space-y-1.5), 20px icon, 14px text */}
          <nav className="p-3 space-y-1.5" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 h-10 rounded-[12px] text-sm transition-colors ${
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

        {/* Bottom Footer: Calm About & Legal Links */}
        <div className="p-3 border-t border-border/60 space-y-1">
          <NavLink
            to="/about"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 h-8 rounded-[10px] text-xs transition-colors ${
                isActive
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold'
                  : 'text-text-muted hover:text-text hover:bg-surface-2 font-medium'
              }`
            }
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>About Pramaan</span>
          </NavLink>
          <div className="flex items-center justify-between px-3 pt-1 text-[10px] text-text-muted">
            <NavLink to="/privacy" onClick={onClose} className="hover:underline">Privacy</NavLink>
            <span>·</span>
            <NavLink to="/terms" onClick={onClose} className="hover:underline">Terms</NavLink>
            <span>·</span>
            <NavLink to="/ai-disclosure" onClick={onClose} className="hover:underline">AI Ethics</NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};
