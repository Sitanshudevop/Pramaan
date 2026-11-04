import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Award, GitCommit } from 'lucide-react';

export const DeliveryTeam: React.FC = () => {
  const { delivery } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">12. Delivery Team & Workstream Allocation</h1>
        <p className="text-sm text-text-muted mt-1">
          Participant details, role allocation across workstreams, and Round 2 vs. Round 3 milestones.
        </p>
      </div>

      {/* Team Details Banner */}
      <section className="p-4 rounded-card border border-border bg-surface text-xs space-y-3">
        <div className="flex items-center space-x-2 text-accent font-semibold text-sm">
          <Award className="w-4 h-4" />
          <span>Competition Submission & Ownership</span>
        </div>
        <div className="space-y-1.5 pt-1">
          <div>
            <span className="font-semibold text-text">Team Name: </span>
            <span className="font-mono text-accent">{delivery.teamName}</span> ({delivery.teamSize})
          </div>
          <div>
            <span className="font-semibold text-text">Author / Lead: </span>
            <span className="text-text-muted">{delivery.teamLead}</span>
          </div>
          <div>
            <span className="font-semibold text-text">Role Allocation: </span>
            <span className="text-text-muted leading-relaxed">{delivery.roleAllocation}</span>
          </div>
        </div>
      </section>

      {/* Workstreams Table */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text flex items-center space-x-2">
          <GitCommit className="w-4 h-4 text-accent" />
          <span>Workstream Roadmap: Round 2 (The Build) vs Round 3 (The Finish)</span>
        </h2>
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-muted border-b border-border text-text font-medium">
              <tr>
                <th className="px-3.5 py-2.5">Workstream</th>
                <th className="px-3.5 py-2.5">Round 2 (Built & Verified Now)</th>
                <th className="px-3.5 py-2.5">Round 3 (Committed Finish)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {delivery.workstreams.map((ws, i) => (
                <tr key={i} className="hover:bg-surface-muted/30">
                  <td className="px-3.5 py-2.5 font-semibold text-text whitespace-nowrap">{ws.workstream}</td>
                  <td className="px-3.5 py-2.5 text-accent font-medium">{ws.round2}</td>
                  <td className="px-3.5 py-2.5 text-text-muted">{ws.round3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
};
