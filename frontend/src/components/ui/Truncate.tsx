import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface TruncateProps {
  text: string;
  lines?: number;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
}

export const Truncate: React.FC<TruncateProps> = ({
  text,
  lines = 2,
  className = '',
  moreLabel = 'Show more',
  lessLabel = 'Show less',
}) => {
  const [expanded, setExpanded] = useState(false);

  // If text is short, don't show toggle
  if (text.length < 80) {
    return <span className={className}>{text}</span>;
  }

  return (
    <div className={className}>
      <p
        className={`transition-all duration-200 ${expanded ? '' : `line-clamp-${lines} overflow-hidden`
          }`}
        style={
          !expanded
            ? {
              display: '-webkit-box',
              WebkitLineClamp: lines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }
            : undefined
        }
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-orange-text hover:underline mt-1 pt-0.5"
        aria-expanded={expanded}
      >
        <span>{expanded ? lessLabel : moreLabel}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
};

