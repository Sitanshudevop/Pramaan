import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FilePlus,
  Inbox,
  BookOpen,
  ShieldCheck,
  BarChart3,
  Home,
  FileText,
  AlertCircle,
  Users,
  Cpu,
  Layers,
  Scale,
  Compass,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRODUCT_NAV = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'New Review', path: '/app/new', icon: FilePlus },
  { name: 'Review Queue', path: '/app/queue', icon: Inbox },
  { name: 'Brand Hub', path: '/app/hub', icon: BookOpen },
  { name: 'Audit & Disclosure', path: '/app/audit', icon: ShieldCheck },
  { name: 'Brand Insights', path: '/app/insights', icon: BarChart3 },
];

const PLAN_NAV = [
  { name: '1. Executive Summary', path: '/plan/summary', icon: FileText },
  { name: '2. Problem & Root Causes', path: '/plan/problem', icon: AlertCircle },
  { name: '3. Evidence Register', path: '/plan/evidence', icon: Scale },
  { name: '4. Users & Research', path: '/plan/users', icon: Users },
  { name: '5. Solution Architecture', path: '/plan/solution', icon: Layers },
  { name: '6. Workflow & Permissions', path: '/plan/workflow', icon: CheckCircle2 },
  { name: '7. Scope & Commitments', path: '/plan/scope', icon: ChevronRight },
  { name: '8. Technical Blueprint', path: '/plan/technical', icon: Cpu },
  { name: '9. Responsible Design', path: '/plan/responsible', icon: ShieldCheck },
  { name: '10. Brand Positioning', path: '/plan/positioning', icon: Compass },
  { name: '11. Feasibility & Risk', path: '/plan/feasibility', icon: AlertCircle },
  { name: '12. Delivery & Team', path: '/plan/delivery', icon: Users },
  { name: '13. References', path: '/plan/references', icon: ExternalLink },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 border-r border-border bg-surface flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Application Sidebar"
      >
        {/* Brand Header */}
        <div className="h-14 border-b border-border flex items-center px-4 justify-between">
          <NavLink to="/" className="flex items-center space-x-2.5 font-semibold text-text">
            <span className="w-6 h-6 rounded bg-accent text-white flex items-center justify-center font-bold text-xs tracking-wider">
              प्र
            </span>
            <span className="tracking-tight text-base font-bold">Pramaan</span>
          </NavLink>
        </div>

        {/* Navigation scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Group A: Product */}
          <div>
            <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
              Product
            </div>
            <nav className="space-y-0.5">
              {PRODUCT_NAV.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-2.5 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-text-muted hover:text-text hover:bg-surface-2'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Group B: Plan */}
          <div>
            <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
              Plan (PRAMAAN_CONTENT)
            </div>
            <nav className="space-y-0.5">
              {PLAN_NAV.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-2.5 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-text-muted hover:text-text hover:bg-surface-2'
                    }`
                  }
                >
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-border bg-surface-2 text-[11px] text-text-muted">
          <div className="font-medium text-text">CodeNexus India 2026</div>
          <div className="text-[10px]">Team: DOOM_CODER (Solo)</div>
        </div>
      </aside>
    </>
  );
};

