import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Users, Target, HelpCircle, ShieldCheck } from 'lucide-react';

export const UsersResearch: React.FC = () => {
  const { users } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">4. Users and Research Plan</h1>
        <p className="text-sm text-text-muted mt-1">
          Beachhead segment, personas, pain points, hypotheses, and planned discovery methodology.
        </p>
      </div>

      {/* Beachhead Segment */}
      <section className="p-4 rounded-card border border-border bg-surface space-y-2">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Target className="w-4 h-4 text-accent" />
          <span>Beachhead Target Segment</span>
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">{users.beachhead}</p>
      </section>

      {/* User Personas */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <Users className="w-4 h-4 text-accent" />
          <span>Core Personas & Value Delivery</span>
        </h2>

        <div className="space-y-3">
          {users.personas.map((persona, i) => (
            <div key={i} className="p-4 rounded-card border border-border bg-surface space-y-2 text-xs">
              <div className="font-semibold text-text text-sm">{persona.role}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded bg-surface-muted/50 border border-border/50">
                  <div className="font-medium text-warning text-[11px] mb-1">Primary Pain Point</div>
                  <p className="text-text-muted leading-relaxed">{persona.pain}</p>
                </div>
                <div className="p-2.5 rounded bg-accent/5 border border-accent/20">
                  <div className="font-medium text-accent text-[11px] mb-1">What Pramaan Provides</div>
                  <p className="text-text leading-relaxed">{persona.provides}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hypotheses */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-accent" />
          <span>Product Hypotheses to Validate</span>
        </h2>
        <div className="p-4 rounded-card border border-border bg-surface space-y-2 text-xs">
          <div className="space-y-2">
            {users.hypotheses.map((hypo) => (
              <div key={hypo.id} className="flex items-start space-x-3 py-1.5 border-b border-border/40 last:border-0">
                <span className="font-mono font-bold text-accent shrink-0">{hypo.id}</span>
                <div className="flex-1">
                  <p className="text-text">{hypo.text}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Validation method: {hypo.method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Ethics Callout */}
      <div className="p-4 rounded-card border border-border bg-surface-muted text-xs text-text space-y-1">
        <div className="font-bold flex items-center space-x-1.5 text-text">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span>Research Status & Ethical Standards</span>
        </div>
        <p className="text-text-muted leading-relaxed">{users.researchPlanNotice}</p>
      </div>
    </article>
  );
};

