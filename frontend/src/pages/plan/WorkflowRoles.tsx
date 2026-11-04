import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { GitBranch, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

export const WorkflowRoles: React.FC = () => {
  const { workflow } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">6. End-to-End Workflow & Roles</h1>
        <p className="text-sm text-text-muted mt-1">
          Eight-step review and approval lifecycle with strict human controls at each boundary.
        </p>
      </div>

      {/* State Machine Progression */}
      <section className="p-4 rounded-card border border-border bg-surface space-y-2 text-xs">
        <h2 className="font-semibold text-text flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-accent" />
          <span>State Machine Progression</span>
        </h2>
        <div className="p-3 rounded bg-surface-muted border border-border/60 font-mono text-xs text-text overflow-x-auto whitespace-nowrap">
          {workflow.stateProgression}
        </div>
      </section>

      {/* Step by Step Table / Timeline */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-accent" />
          <span>Workflow Steps & Authority Boundaries</span>
        </h2>
        <div className="space-y-3">
          {workflow.steps.map((st) => (
            <div key={st.num} className="p-4 rounded-card border border-border bg-surface text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-xs">
                    {st.num}
                  </span>
                  <span className="font-semibold text-text text-sm">{st.who}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-text font-medium leading-relaxed flex items-start space-x-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                  <span>{st.action}</span>
                </div>
                <div className="p-2 rounded bg-surface-muted/60 border border-border/40 text-[11px] text-text-muted flex items-start space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-text">Governance Control:</strong> {st.control}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};

