import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { ExternalLink } from 'lucide-react';

export const ReferencesPage: React.FC = () => {
  const { references } = PLAN_DATA;

  return (
    <article className="max-w-reading mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">13. References & Canonical Citations</h1>
        <p className="text-sm text-text-muted mt-1">
          Full list of published secondary sources, legal authorities, and standards referenced in the proposal.
        </p>
      </div>

      <div className="space-y-2">
        {references.map((ref) => (
          <div
            key={ref.num}
            className="p-3.5 rounded-card border border-border bg-surface text-xs flex items-start space-x-3"
          >
            <span className="font-mono text-accent font-bold shrink-0">[{ref.num}]</span>
            <div className="flex-1 space-y-1">
              <p className="text-text leading-relaxed">{ref.title}</p>
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[11px] text-accent hover:underline break-all"
                >
                  <span>{ref.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};
