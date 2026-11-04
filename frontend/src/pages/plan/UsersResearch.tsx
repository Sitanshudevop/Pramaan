import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Users, Target, HelpCircle, ShieldCheck } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const UsersResearch: React.FC = () => {
  const { users } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">4. Users and Research Plan</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Beachhead segment, personas, pain points, hypotheses, and planned discovery methodology.
        </p>
      </div>

      {/* Beachhead Segment */}
      <section className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-2">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
          <Target className="w-4 h-4 text-orange-text" />
          <span>Beachhead Target Segment</span>
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">{users.beachhead}</p>
      </section>

      {/* User Personas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4 h-4 text-orange-text" />
            <span>Core Personas & Value Delivery</span>
          </h2>
          <Chip variant="neutral" size="sm">3 Personas</Chip>
        </div>

        <div className="space-y-3">
          {users.personas.map((persona, i) => (
            <div key={i} className="p-5 rounded-card border border-border bg-surface shadow-floating space-y-3 text-xs">
              <div className="font-bold text-text text-sm">{persona.role}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-inner bg-surface-2 border border-border/70 space-y-1">
                  <div className="font-semibold text-orange-text text-[11px]">Primary Pain Point</div>
                  <p className="text-text-muted leading-relaxed text-xs">{persona.pain}</p>
                </div>
                <div className="p-3.5 rounded-inner bg-orange-500/5 border border-orange-500/20 space-y-1">
                  <div className="font-semibold text-orange-text text-[11px]">What Pramaan Provides</div>
                  <p className="text-text leading-relaxed text-xs">{persona.provides}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hypotheses */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-orange-text" />
          <span>Product Hypotheses to Validate</span>
        </h2>
        <div className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-3 text-xs">
          <div className="space-y-3">
            {users.hypotheses.map((hypo) => (
              <div key={hypo.id} className="flex items-start space-x-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <Chip variant="accent" size="sm" className="font-mono">
                  {hypo.id}
                </Chip>
                <div className="flex-1 space-y-0.5">
                  <p className="text-text font-medium leading-relaxed">{hypo.text}</p>
                  <p className="text-[11px] text-text-muted">Validation method: {hypo.method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Ethics Callout */}
      <div className="p-5 rounded-card border border-border bg-surface-2 text-xs text-text space-y-1.5">
        <div className="font-bold flex items-center space-x-1.5 text-text">
          <ShieldCheck className="w-4 h-4 text-orange-text" />
          <span>Research Status & Ethical Standards</span>
        </div>
        <p className="text-text-muted leading-relaxed">{users.researchPlanNotice}</p>
      </div>
    </article>
  );
};
