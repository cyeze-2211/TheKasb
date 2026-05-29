import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { pageKicker } from '../../components/pageChrome';
import { SETTINGS_BASE } from '../../lib/settingsNav';

export function SettingsSectionChrome({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <Link
        to={SETTINGS_BASE}
        className="inline-flex items-center gap-1 text-sm font-medium text-text-muted transition-colors hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Sozlamalar
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`${pageKicker} mb-2`}>The Kasb · Sozlamalar</p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {children}
    </div>
  );
}
