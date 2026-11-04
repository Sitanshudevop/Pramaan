import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { GitBranch, ShieldAlert, ArrowRight, UserCheck, Shield } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const WorkflowRoles: React.FC = () => {
  const { workflow } = PLAN_DATA;

  const permissionMatrix = [
    { permission: 'Submit Draft & Purpose Card', creator: true, reviewer: true, manager: true, admin: true },
    { permission: 'Run Verification Engine', creator: true, reviewer: true, manager: true, admin: true },
    { permission: 'Accept / Dismiss Suggestions', creator: true, reviewer: true, manager: true, admin: true },
    { permission: 'Override Finding with Reason', creator: false, reviewer: true, manager: true, admin: true },
    { permission: 'Final Approval & Decision Sign-off', creator: false, reviewer: false, manager: true, admin: true },
    { permission: 'Update Brand Rules, Facts & Guidelines', creator: false, reviewer: false, manager: true, admin: true },
    { permission: 'Manage Workspaces & Role Assignments', creator: false, reviewer: false, manager: false, admin: true },
    { permission: 'Export Certificate & Audit Ledger', creator: true, reviewer: true, manager: true, admin: true },
  ];

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">6. End-to-End Workflow & Roles</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Eight-step review and approval lifecycle with strict human controls at each boundary.
        </p>
      </div>

      {/* State Machine Progression */}
      <section className="p-6 rounded-card border border-border bg-surface shadow-floating space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-orange-text" />
            <span>State Machine Progression</span>
          </h2>
          <Chip variant="accent" size="sm">Linear Governance Flow</Chip>
        </div>
        <div className="p-3.5 rounded-inner bg-surface-2 border border-border/70 font-mono text-xs text-text overflow-x-auto whitespace-nowrap leading-relaxed">
          {workflow.stateProgression}
        </div>
      </section>

      {/* Vertical Stepper with Small Orange Step Markers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-orange-text" />
            <span>Workflow Stepper & Human Governance Gates</span>
          </h2>
          <Chip variant="neutral" size="sm">8 Sequential Steps</Chip>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-orange-500 before:via-orange-500/50 before:to-border">
          {workflow.steps.map((st) => (
            <div key={st.num} className="relative group">
              {/* Orange Step Marker */}
              <div className="absolute -left-6 sm:-left-8 top-1 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-dark border-2 border-orange-500 text-orange-text font-bold text-xs shadow-sm">
                {st.num}
              </div>

              <div className="p-5 rounded-card border border-border bg-surface shadow-floating text-xs space-y-2.5 ml-2">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="font-bold text-text text-sm">{st.who}</span>
                  <Chip variant="outline" size="sm">Step {st.num}</Chip>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-text font-medium leading-relaxed flex items-start space-x-2">
                    <ArrowRight className="w-3.5 h-3.5 text-orange-text shrink-0 mt-0.5" />
                    <span>{st.action}</span>
                  </div>
                  <div className="p-2.5 rounded-inner bg-surface-2 border border-border/70 text-[11px] text-text-muted flex items-start space-x-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-orange-text shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-text">Governance Control:</strong> {st.control}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Permission Matrix Table Card */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <Shield className="w-4 h-4 text-orange-text" />
            <span>Role-Based Permission Matrix</span>
          </h2>
          <Chip variant="neutral" size="sm">4 System Roles</Chip>
        </div>

        <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-floating">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 border-b border-border text-text-muted font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Permission / Capability</th>
                <th className="px-4 py-3 text-center">Creator</th>
                <th className="px-4 py-3 text-center">Reviewer</th>
                <th className="px-4 py-3 text-center">Brand Mgr</th>
                <th className="px-4 py-3 text-center">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {permissionMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-surface-2/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-text">{row.permission}</td>
                  <td className="px-4 py-3 text-center">
                    {row.creator ? (
                      <span className="text-success-text font-bold">✓</span>
                    ) : (
                      <span className="text-text-muted/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.reviewer ? (
                      <span className="text-success-text font-bold">✓</span>
                    ) : (
                      <span className="text-text-muted/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.manager ? (
                      <span className="text-success-text font-bold">✓</span>
                    ) : (
                      <span className="text-text-muted/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.admin ? (
                      <span className="text-success-text font-bold">✓</span>
                    ) : (
                      <span className="text-text-muted/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
};
