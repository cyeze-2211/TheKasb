import type { LucideIcon } from 'lucide-react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { panelEliteCompact } from './pageChrome';

export function FilterPanel({
  title = 'Filtrlar',
  icon: Icon = SlidersHorizontal,
  children,
  toolbar,
  collapsible = false,
  expanded = true,
  onToggle,
  id = 'kasb-filters',
}: {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  toolbar?: ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  id?: string;
}) {
  const regionId = `${id}-region`;

  return (
    <div className={panelEliteCompact}>
      <div
        className={`flex flex-wrap items-center gap-3 border-b px-4 py-3.5 transition-[border-color] duration-300 ${
          expanded || !collapsible ? 'border-border/80' : 'border-border/40'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {collapsible ? (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-text-muted shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:border-border hover:bg-muted hover:text-text-primary hover:shadow-[var(--elite-shadow-sm)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/15"
              aria-expanded={expanded}
              aria-controls={regionId}
              title={expanded ? 'Filtrlarni yopish' : 'Filtrlarni ochish'}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  expanded ? 'rotate-180' : 'rotate-0'
                }`}
                strokeWidth={2}
                aria-hidden
              />
            </button>
          ) : null}
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border/70 bg-gradient-to-br from-muted via-muted/90 to-muted/70 text-text-muted shadow-[var(--elite-shadow-xs)] ring-1 ring-white/80">
            <Icon className="h-4 w-4 opacity-90" strokeWidth={2} aria-hidden />
          </span>
          <span className="min-w-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted/90">
            {title}
          </span>
        </div>
        {toolbar ? (
          <div className="flex flex-wrap items-center justify-end gap-2">{toolbar}</div>
        ) : null}
      </div>

      <div
        id={regionId}
        role={collapsible ? 'region' : undefined}
        aria-label={collapsible ? title : undefined}
        className={`grid ${
          collapsible
            ? 'transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none'
            : ''
        } ${collapsible && !expanded ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`p-4 ${
              collapsible
                ? `transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                    !expanded
                      ? 'pointer-events-none opacity-0 -translate-y-1'
                      : 'opacity-100 translate-y-0'
                  }`
                : ''
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
