import React from 'react';
import { PLAN_DATA } from '../../content/planContent';
import { ExternalLink, BookOpen } from 'lucide-react';
import { GlowBackdrop, Chip } from '../../components/ui';

export const ReferencesPage: React.FC = () => {
  const { references } = PLAN_DATA;

  return (
    <article className="relative max-w-reading mx-auto py-4 space-y-8">
      <GlowBackdrop intensity="low" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">13. References & Canonical Citations</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Full list of published secondary sources, legal authorities, and standards referenced in the proposal.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-orange-text" />
            <span>Bibliography & Legal References</span>
          </h2>
          <Chip variant="neutral" size="sm">{references.length} Citations</Chip>
        </div>

        <div className="space-y-3">
          {references.map((ref) => (
            <div
              key={ref.num}
              className="p-4 rounded-card border border-border bg-surface shadow-floating text-xs flex items-start space-x-3.5"
            >
              <Chip variant="accent" size="sm" className="font-mono font-bold shrink-0">
                [{ref.num}]
              </Chip>
              <div className="flex-1 space-y-1.5">
                <p className="text-text font-medium leading-relaxed">{ref.title}</p>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] text-orange-text hover:underline break-all"
                  >
                    <span>{ref.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};
