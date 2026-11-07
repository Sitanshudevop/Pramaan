import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  renderCard: (row: T, index: number) => React.ReactNode;
  keyExtractor: (row: T, index: number) => string;
  renderExpandedRow?: (row: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

export function ResponsiveTable<T>({
  data,
  columns,
  renderCard,
  keyExtractor,
  renderExpandedRow,
  emptyState,
  className = '',
  stickyHeader = true,
}: ResponsiveTableProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleRow = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (data.length === 0 && emptyState) {
    return <div className="p-8 text-center text-text-muted">{emptyState}</div>;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* 1. Mobile Card View (< md / < 768px) */}
      <div className="md:hidden space-y-3">
        {data.map((item, idx) => (
          <div key={keyExtractor(item, idx)} className="w-full">
            {renderCard(item, idx)}
          </div>
        ))}
      </div>

      {/* 2. Desktop & Tablet Semantic Table View (>= md / >= 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b border-border bg-surface-2/80 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`p-3 font-semibold text-text-muted uppercase tracking-wider text-[11px] select-none ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
              {renderExpandedRow && (
                <th scope="col" className="w-10 p-3" aria-label="Row expansion" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.map((row, idx) => {
              const key = keyExtractor(row, idx);
              const isExpanded = !!expandedKeys[key];
              return (
                <React.Fragment key={key}>
                  <tr
                    className={`hover:bg-surface-2/60 transition-colors ${
                      renderExpandedRow ? 'cursor-pointer' : ''
                    } ${isExpanded ? 'bg-surface-2/40' : ''}`}
                    onClick={renderExpandedRow ? () => toggleRow(key) : undefined}
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`p-3 text-text ${col.className || ''}`}>
                        {col.accessor(row)}
                      </td>
                    ))}
                    {renderExpandedRow && (
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(key);
                          }}
                          aria-label={isExpanded ? 'Collapse row details' : 'Expand row details'}
                          aria-expanded={isExpanded}
                          className="p-1 rounded-pill text-text-muted hover:text-text"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-150 ${
                              isExpanded ? 'rotate-180 text-orange-text' : ''
                            }`}
                          />
                        </button>
                      </td>
                    )}
                  </tr>

                  {renderExpandedRow && isExpanded && (
                    <tr className="bg-surface-2/30 border-b border-border/60">
                      <td colSpan={columns.length + 1} className="p-4">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

