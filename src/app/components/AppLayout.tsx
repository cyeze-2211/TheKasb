import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Home,
  Users,
  Target,
  FileText,
  Wrench,
  Settings,
  LogOut,
  Bell,
  Search,
  AlertCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ctlInput } from './pageChrome';

const SIDEBAR_COLLAPSED_KEY = 'kasb_sidebar_collapsed';

const TITLE_MAP: Record<string, string> = {
  dashboard: 'Boshqaruv paneli',
  users: 'Foydalanuvchilar',
  candidates: 'Nomzodlar',
  vacancies: 'Vakansiyalar',
  professions: 'Kasblar',
  'custom-professions': 'Maxsus kasblar',
  'destination-countries': 'Maqsad mamlakatlar',
  settings: 'Sozlamalar',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const isDashboard = location.pathname === '/admin/dashboard';

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    const seg = location.pathname.replace(/^\/admin\/?/, '') || 'dashboard';
    const key = seg.split('/')[0] ?? 'dashboard';
    const label = TITLE_MAP[key] ?? 'Admin';
    document.title = `${label} | The Kasb`;
  }, [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { path: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
    { path: '/admin/candidates', label: 'Nomzodlar', icon: Target },
    { path: '/admin/vacancies', label: 'Vakansiyalar', icon: FileText },
    { path: '/admin/professions', label: 'Kasblar', icon: Wrench },
    { path: '/admin/custom-professions', label: 'Maxsus kasblar', icon: AlertCircle },
    { path: '/admin/destination-countries', label: 'Maqsad mamlakatlar', icon: Globe },
    { path: '/admin/settings', label: 'Sozlamalar', icon: Settings },
  ];

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.displayName ?? 'Administrator';
  const phone = user?.phone ?? '';
  const sidebarWidthClass = collapsed ? 'w-[4.25rem]' : 'w-60';
  const ini = initials(displayName) || 'A';

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={`${sidebarWidthClass} flex flex-shrink-0 flex-col transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none`}
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        <div
          className="flex h-16 flex-shrink-0 items-center gap-2 border-b px-3 transition-colors duration-200"
          style={{ borderColor: '#1E293B' }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-lg font-bold text-white shadow-md shadow-primary/25 transition-transform duration-200 hover:scale-105">
              K
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  The Kasb
                </p>
                <span className="block truncate text-sm font-semibold text-white">KASB Admin</span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95"
            title={collapsed ? 'Yoyish' : 'Yig‘ish'}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Yon panelni yoyish' : 'Yon panelni yig‘ish'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex h-10 items-center rounded-lg transition-all duration-200 ease-out active:scale-[0.98] ${
                  collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } ${
                  active
                    ? 'border-l-[3px] border-primary bg-primary/20 text-white shadow-sm shadow-black/10'
                    : 'border-l-[3px] border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                } `}
              >
                <Icon size={16} className="flex-shrink-0 opacity-90" />
                {!collapsed ? <span className="truncate text-sm">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div
          className="flex-shrink-0 border-t p-3 transition-colors duration-200"
          style={{ borderColor: '#1E293B' }}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent p-2 shadow-lg shadow-black/20 transition-[border-color,box-shadow] duration-300 hover:border-white/15">
              <div className="relative">
                <div
                  className="absolute -inset-1 rounded-full bg-primary/35 blur-md motion-reduce:blur-none"
                  aria-hidden
                />
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/50 to-primary/20 text-xs font-semibold text-white ring-2 ring-primary/50 ring-offset-2 ring-offset-[#0F172A]"
                  title={displayName}
                >
                  {ini}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Chiqish"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-all duration-200 hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-200 active:scale-95"
              >
                <LogOut size={16} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.09] via-white/[0.02] to-transparent p-3 shadow-lg shadow-black/25 ring-1 ring-white/5 transition-[border-color,box-shadow] duration-300 hover:border-white/[0.18] hover:shadow-xl hover:shadow-black/30">
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  <div
                    className="absolute -inset-1 rounded-full bg-primary/30 blur-md motion-reduce:blur-none"
                    aria-hidden
                  />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/55 to-primary/20 text-sm font-semibold tracking-tight text-white ring-2 ring-primary/55 ring-offset-2 ring-offset-[#0F172A]">
                    {ini}
                  </div>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-semibold tracking-tight text-white">{displayName}</p>
                  <p className="mt-0.5 truncate text-xs leading-relaxed text-slate-400">{phone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] text-sm text-slate-200 transition-all duration-200 hover:border-red-400/35 hover:bg-red-500/10 hover:text-red-100 active:scale-[0.99]"
              >
                <LogOut size={15} strokeWidth={2} className="opacity-80" />
                Chiqish
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {!isDashboard ? (
          <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-surface/95 px-6 shadow-sm shadow-black/[0.02] backdrop-blur-sm transition-shadow duration-300">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                The Kasb
              </p>
              <p className="truncate text-sm font-medium text-text-primary">Admin boshqaruvi</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="search"
                  name="q"
                  placeholder="Qidirish..."
                  className={`${ctlInput} w-64 pl-10 pr-3 transition-shadow duration-200 focus-visible:shadow-md`}
                />
              </div>

              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-all duration-200 hover:bg-muted hover:text-text-primary active:scale-95"
                aria-label="Bildirishnomalar"
              >
                <Bell size={18} />
                <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-danger ring-2 ring-surface" />
              </button>

              <div className="hidden items-center gap-2 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700 shadow-sm transition-transform duration-200 sm:flex">
                🛡 Admin
              </div>
            </div>
          </header>
        ) : null}

        <main
          className={
            isDashboard
              ? 'min-h-0 flex-1 overflow-auto bg-[var(--dashboard-bg)]'
              : 'min-h-0 flex-1 overflow-auto bg-background [background-image:radial-gradient(ellipse_120%_80%_at_50%_-40%,rgba(37,99,235,0.07),transparent_50%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(15,23,42,0.03),transparent_45%)]'
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
