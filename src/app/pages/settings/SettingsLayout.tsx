import { NavLink, Outlet, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import { pageKicker } from '../../components/pageChrome';
import { SETTINGS_NAV, settingsPageTitle } from '../../lib/settingsNav';

export function SettingsLayout() {
  const location = useLocation();
  const pageTitle = settingsPageTitle(location.pathname);

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <p className={`${pageKicker} mb-1`}>The Kasb · Admin</p>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sozlamalar</h1>
        <p className="mt-1 text-sm text-text-muted">Fayllar va o‘chirilgan foydalanuvchilar alohida bo‘limlarda</p>
      </div>

      <nav
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        aria-label="Sozlamalar bo‘limlari"
      >
        {SETTINGS_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group flex min-w-[min(100%,280px)] flex-1 items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200',
                  'border-border/80 bg-surface/80 shadow-[var(--elite-shadow-xs)] ring-1 ring-border/40',
                  'hover:border-primary/30 hover:shadow-[var(--elite-shadow-sm)]',
                  isActive &&
                    'border-primary/50 bg-primary/[0.06] ring-primary/25 shadow-[var(--elite-shadow-sm)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition-colors',
                      isActive
                        ? 'border-primary/35 bg-primary/15 text-primary'
                        : 'border-border/70 bg-muted/30 text-text-muted group-hover:text-primary',
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-text-primary">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-text-muted">{item.description}</span>
                  </span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 flex-shrink-0 text-text-muted transition-transform',
                      isActive && 'translate-x-0.5 text-primary',
                    )}
                    aria-hidden
                  />
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border/60 pt-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-text-primary">{pageTitle}</h2>
        <Outlet />
      </div>
    </div>
  );
}
