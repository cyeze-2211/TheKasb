import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import { pageKicker } from '../../components/pageChrome';
import { SETTINGS_NAV } from '../../lib/settingsNav';

export function SettingsHub() {
  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sozlamalar</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">
          Tizim bo‘limlarini tanlang — har biri alohida sahifada boshqariladi
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200',
                'border-border/80 bg-surface/80 shadow-[var(--elite-shadow-xs)] ring-1 ring-border/40',
                'hover:border-primary/30 hover:shadow-[var(--elite-shadow-sm)]',
              )}
            >
              <span
                className={cn(
                  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border',
                  'border-border/70 bg-muted/30 text-text-muted group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:text-primary',
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-text-primary">{item.label}</span>
                <span className="mt-1 block text-sm text-text-muted">{item.description}</span>
              </span>
              <ChevronRight
                className="h-5 w-5 flex-shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
