import React from 'react';
import { ShieldCheck, BookOpen, CheckCircle2 } from 'lucide-react';

export interface FloatingCardsProps {
  brandKitCount?: number;
  activeRulesCount?: number;
  verifiedFindingsRate?: number;
  className?: string;
}

/**
 * Hero decorative 3D floating visual composed of real computed governance cards.
 * Automatically flattens on mobile screens and when prefers-reduced-motion is active.
 */
export const FloatingCards: React.FC<FloatingCardsProps> = ({
  brandKitCount = 2,
  activeRulesCount = 14,
  verifiedFindingsRate = 100,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full max-w-[420px] h-[340px] flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Background card: Brand Knowledge Hub snapshot */}
      <div
        className="absolute w-64 p-4 rounded-card bg-surface border border-border shadow-floating text-text transition-transform duration-500
                   hidden md:block -top-2 right-4
                   md:[transform:perspective(900px)_rotateX(10deg)_rotateY(-12deg)_rotateZ(4deg)]
                   motion-reduce:transform-none"
      >
        <div className="flex items-center space-x-2 text-text-muted mb-2">
          <BookOpen className="w-3.5 h-3.5 text-orange-text" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Brand Hub
          </span>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-extrabold font-tabular text-text">
            {brandKitCount}
          </span>
          <span className="text-xs text-text-muted">Kits Active</span>
        </div>
        <div className="mt-2 text-[10px] text-text-muted border-t border-border/60 pt-1.5 flex justify-between">
          <span>Kettle & Co. · LedgerLeaf</span>
          <span className="text-success-text font-medium">✓ Synced</span>
        </div>
      </div>

      {/* Middle card: Evidence Grounding Rate (Dark feature card) */}
      <div
        className="absolute w-72 p-5 rounded-card bg-surface-dark border border-white/10 text-[#F4F1EC] shadow-2xl z-10 transition-transform duration-500
                   top-14 left-2
                   md:[transform:perspective(900px)_rotateX(6deg)_rotateY(8deg)_rotateZ(-3deg)]
                   motion-reduce:transform-none"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1.5 text-orange-300">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Evidence Standard
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-pill bg-orange-500/20 text-orange-300 text-[10px] font-semibold border border-orange-500/30">
            Proof-or-Abstain
          </span>
        </div>

        <div className="flex items-baseline space-x-1.5 my-1">
          <span className="text-4xl font-extrabold tracking-tight font-tabular text-[#F4F1EC]">
            {verifiedFindingsRate}
          </span>
          <span className="text-base font-bold text-orange-300">%</span>
        </div>

        <p className="text-[11px] text-[#A39B91] mt-1 leading-relaxed">
          100% of displayed findings cite verified Rule or Fact IDs. Zero fabricated citations.
        </p>
      </div>

      {/* Foreground card: Active Rules Count */}
      <div
        className="absolute w-60 p-4 rounded-card bg-surface border border-border shadow-floating text-text z-20 transition-transform duration-500
                   bottom-0 right-2
                   md:[transform:perspective(900px)_rotateX(8deg)_rotateY(-6deg)_rotateZ(2deg)]
                   motion-reduce:transform-none"
      >
        <div className="flex items-center justify-between text-text-muted mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Deterministic Engine
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-success-text" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-extrabold font-tabular text-text">
            {activeRulesCount}
          </span>
          <span className="text-xs text-text-muted">Active Rules</span>
        </div>
        <div className="mt-2 text-[10px] text-text-muted border-t border-border/60 pt-1 flex justify-between">
          <span>Claims, Terms, Facts</span>
          <span className="font-mono text-orange-text">v2.1</span>
        </div>
      </div>
    </div>
  );
};

