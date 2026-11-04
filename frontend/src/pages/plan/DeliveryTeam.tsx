import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { Award, GitCommit } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const DeliveryTeam: React.FC = () => {
  const { delivery } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">12. Delivery Team & Workstream Allocation</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Participant details, role allocation across workstreams, and Round 2 vs. Round 3 milestones.
        </p>
      </div>

      {/* Team Details Banner */}
      <section className="p-6 rounded-card border border-border bg-surface shadow-floating text-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-orange-text font-bold text-sm">
            <Award className="w-4 h-4 text-orange-text" />
            <span>Competition Submission & Ownership</span>
          </div>
          <Chip variant="accent" size="sm">{delivery.teamSize}</Chip>
        </div>
        <div className="space-y-2 pt-1 border-t border-border/50">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-text">Team Name: </span>
            <span className="font-mono font-bold text-orange-text">{delivery.teamName}</span>
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
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-orange-text" />
            <span>Workstream Roadmap: Round 2 (The Build) vs Round 3 (The Finish)</span>
          </h2>
          <Chip variant="neutral" size="sm">4 Streams</Chip>
        </div>
        <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-floating">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 border-b border-border text-text-muted font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Workstream</th>
                <th className="px-4 py-3">Round 2 (Built & Verified Now)</th>
                <th className="px-4 py-3">Round 3 (Committed Finish)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {delivery.workstreams.map((ws, i) => (
                <tr key={i} className="hover:bg-surface-2/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-text whitespace-nowrap">{ws.workstream}</td>
                  <td className="px-4 py-3 text-orange-text font-semibold">{ws.round2}</td>
                  <td className="px-4 py-3 text-text-muted">{ws.round3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
};
