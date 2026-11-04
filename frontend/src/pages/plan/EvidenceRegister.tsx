import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { AlertCircle } from 'lucide-react';
import { StatCard, GlowBackdrop, Chip } from '../../components/ui';

export const EvidenceRegister: React.FC = () => {
  const { evidence } = PLAN_DATA;

  // Key evidence statistical signals
  const keyStats = [
    {
      value: '85',
      unit: '%',
      label: 'Guidelines Unused',
      hint: 'About 85% of organisations have guidelines, but only ~30% say they are widely used.',
      source: 'Marq/Lucidpress 2021 [1] (Vendor self-reported; directional indicator).',
    },
    {
      value: '98',
      unit: '%',
      label: 'Indian Ad Modifications',
      hint: '9,599 complaints examined by ASCI; 98% of scrutinised ads needed modification.',
      source: 'ASCI Annual Complaints Report 2024–25 [3] (Ad scrutiny sample).',
    },
    {
      value: '95.9',
      unit: '%',
      label: 'Accessibility Failures',
      hint: 'Detectable WCAG 2 failures on 95.9% of the top 1 million home pages.',
      source: 'WebAIM Million 2026 [5] (Web home pages benchmark).',
    },
    {
      value: '87',
      unit: '%',
      label: 'Consumer Brand Trust',
      hint: '87% of surveyed consumers state brand consistency across touchpoints matters.',
      source: 'Storyblok Survey [12] (200 respondents; directional).',
    },
  ];

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">3. Evidence Register</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Empirical signals and published secondary data motivating pre-publication brand governance.
        </p>
      </div>

      {/* Mandatory Evidence Limit Callout */}
      <div className="p-4 rounded-card border border-orange-500/30 bg-orange-500/5 text-xs text-text space-y-1">
        <div className="font-bold flex items-center space-x-1.5 text-orange-text">
          <AlertCircle className="w-4 h-4" />
          <span>EVIDENCE LIMIT CALLOUT</span>
        </div>
        <p className="text-text-muted leading-relaxed">{evidence.callout}</p>
      </div>

      {/* StatCards with Big Confident Numerals and Caveats */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          Key Published Signals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {keyStats.map((item, idx) => (
            <StatCard
              key={idx}
              label={item.label}
              value={item.value}
              unit={item.unit}
              hint={item.hint}
            >
              <div className="pt-2 border-t border-border/60 text-[10px] text-text-muted leading-snug">
                <span className="font-semibold text-text">Source & Limitation: </span>
                {item.source}
              </div>
            </StatCard>
          ))}
        </div>
      </section>

      {/* Full Signals Register */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          Complete Evidence Inventory
        </h2>
        <div className="space-y-3">
          {evidence.signals.map((sig, i) => (
            <div
              key={i}
              className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-text text-sm">{sig.signal}</span>
                <Chip variant="neutral" size="sm">
                  Secondary Signal
                </Chip>
              </div>
              <p className="text-text font-medium leading-relaxed">{sig.finding}</p>
              <div className="text-[11px] text-text-muted pt-2 border-t border-border/50">
                <strong className="text-text">Source & Limitation: </strong>
                {sig.source}
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};
