import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
  UserPlus,
  XCircle,
} from 'lucide-react';
import type { UserRole } from '../data/mockData';
import {
  axiosErrorMessage,
  fetchUsers,
  getUserDisplayName,
  type AccountType,
  type SdgUserDto,
} from '../api/users';
import { UserFormDialog } from '../components/users/UserFormDialog';
import { RoleBadge } from '../components/StatusBadge';
import { FilterPanel } from '../components/FilterPanel';
import { btnPrimary, btnSecondary, ctlInput, ctlSelect, pageKicker, panelElite, rowElite, theadElite } from '../components/pageChrome';

function roleForBadge(u: SdgUserDto): UserRole {
  const r = String(u.accountType ?? 'CANDIDATE');
  if (r === 'ADMIN' || r === 'AGENT' || r === 'CANDIDATE' || r === 'SUPER_ADMIN') return r;
  return 'CANDIDATE';
}

function fmtLastLogin(s: string | null | undefined): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return s;
  }
}

export function Users() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState({
    role: 'ALL',
    active: 'ALL',
    verified: 'ALL',
    neverLoggedIn: 'ALL',
    search: '',
    registeredFrom: '',
    registeredTo: '',
    lastLoginFrom: '',
    lastLoginTo: '',
  });
  const [rows, setRows] = useState<SdgUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchUsers({
        accountType: filters.role === 'ALL' ? 'ALL' : (filters.role as AccountType),
        page: 0,
        size: 200,
        is_active:
          filters.active === 'YES' ? true : filters.active === 'NO' ? false : undefined,
        is_verified:
          filters.verified === 'YES' ? true : filters.verified === 'NO' ? false : undefined,
        never_logged_in:
          filters.neverLoggedIn === 'YES' ? true : filters.neverLoggedIn === 'NO' ? false : undefined,
        search: filters.search.trim() || undefined,
        registered_from: filters.registeredFrom.trim() || undefined,
        registered_to: filters.registeredTo.trim() || undefined,
        last_login_from: filters.lastLoginFrom.trim() || undefined,
        last_login_to: filters.lastLoginTo.trim() || undefined,
      });
      setRows(list);
    } catch (e) {
      setError(axiosErrorMessage(e, 'Ro‘yxatni yuklashda xato.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    filters.role,
    filters.active,
    filters.verified,
    filters.neverLoggedIn,
    filters.search,
    filters.registeredFrom,
    filters.registeredTo,
    filters.lastLoginFrom,
    filters.lastLoginTo,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((u) => {
      if (filters.role !== 'ALL' && String(u.accountType) !== filters.role) return false;
      if (filters.active === 'YES' && u.isActive !== true) return false;
      if (filters.active === 'NO' && u.isActive !== false) return false;
      if (filters.verified === 'YES' && u.isVerified !== true) return false;
      if (filters.verified === 'NO' && u.isVerified !== false) return false;
      return true;
    });
  }, [rows, filters]);

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
          <h1 className="mb-1">Foydalanuvchilar</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
            <span className="mono text-xs">GET /api/admin/users</span> —{' '}
            <span className="mono text-xs">role</span>, <span className="mono text-xs">is_active</span>,{' '}
            <span className="mono text-xs">is_verified</span>, sahifalash.
          </p>
        </div>
        <button type="button" className={btnPrimary} onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Yangi foydalanuvchi
        </button>
      </div>

      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSuccess={() => void load()}
      />

      <FilterPanel
        id="users-filters"
        collapsible
        expanded={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        toolbar={
          <button type="button" className={btnSecondary} onClick={() => void load()} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden />
            )}
            Yangilash
          </button>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1 sm:max-w-[18rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Qidirish (search)</label>
            <input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={ctlInput}
              placeholder="Telefon, email, ism..."
            />
          </div>
          <div className="min-w-[10rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Rol</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className={ctlSelect}
            >
              <option value="ALL">Barchasi</option>
              <option value="CANDIDATE">CANDIDATE</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="AGENT">AGENT</option>
            </select>
          </div>
          <div className="min-w-[10rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Aktiv</label>
            <select
              value={filters.active}
              onChange={(e) => setFilters({ ...filters, active: e.target.value })}
              className={ctlSelect}
            >
              <option value="ALL">Barchasi</option>
              <option value="YES">Ha</option>
              <option value="NO">Yo&apos;q</option>
            </select>
          </div>
          <div className="min-w-[10rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Tasdiqlangan</label>
            <select
              value={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
              className={ctlSelect}
            >
              <option value="ALL">Barchasi</option>
              <option value="YES">Ha</option>
              <option value="NO">Yo&apos;q</option>
            </select>
          </div>
          <div className="min-w-[10rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Hech qachon kirmagan (never_logged_in)</label>
            <select
              value={filters.neverLoggedIn}
              onChange={(e) => setFilters({ ...filters, neverLoggedIn: e.target.value })}
              className={ctlSelect}
            >
              <option value="ALL">Barchasi</option>
              <option value="YES">Ha</option>
              <option value="NO">Yo&apos;q</option>
            </select>
          </div>
          <div className="min-w-[12rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Registered from</label>
            <input
              type="date"
              value={filters.registeredFrom}
              onChange={(e) => setFilters({ ...filters, registeredFrom: e.target.value })}
              className={ctlSelect}
            />
          </div>
          <div className="min-w-[12rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Registered to</label>
            <input
              type="date"
              value={filters.registeredTo}
              onChange={(e) => setFilters({ ...filters, registeredTo: e.target.value })}
              className={ctlSelect}
            />
          </div>
          <div className="min-w-[12rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Last login from</label>
            <input
              type="date"
              value={filters.lastLoginFrom}
              onChange={(e) => setFilters({ ...filters, lastLoginFrom: e.target.value })}
              className={ctlSelect}
            />
          </div>
          <div className="min-w-[12rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Last login to</label>
            <input
              type="date"
              value={filters.lastLoginTo}
              onChange={(e) => setFilters({ ...filters, lastLoginTo: e.target.value })}
              className={ctlSelect}
            />
          </div>
        </div>
      </FilterPanel>

      {error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className={panelElite}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-gradient-to-r from-muted/30 to-transparent px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0">Foydalanuvchilar</h2>
            <span className="rounded-full border border-border/60 bg-surface px-2.5 py-0.5 text-xs font-semibold tabular-nums text-text-muted shadow-[var(--elite-shadow-xs)]">
              {loading ? '…' : filtered.length.toLocaleString('ru-RU')} ta
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theadElite}>
              <tr>
                <th className="w-16 px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Ism Familiya</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Aktiv</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tasdiqlangan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Oxirgi kirish</th>
                <th className="w-28 px-6 py-3 text-right text-xs font-semibold uppercase text-text-muted">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-text-muted">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" aria-hidden />
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">
                    Ma’lumot yo‘q yoki filtrga mos kelmaydi.
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <tr key={user.id} className={rowElite}>
                    <td className="px-6 py-3 text-sm text-text-muted">{index + 1}</td>
                    <td className="mono px-6 py-3 text-sm text-text-primary">{user.phoneNumber ?? '—'}</td>
                    <td className="px-6 py-3 text-sm text-text-primary">{getUserDisplayName(user)}</td>
                    <td className="px-6 py-3">
                      <RoleBadge role={roleForBadge(user)} />
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {user.isActive === true ? (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                          Ha
                        </span>
                      ) : user.isActive === false ? (
                        <span className="inline-flex items-center gap-1.5 text-danger">
                          <XCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                          Yo&apos;q
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {user.isVerified === true ? (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                          Ha
                        </span>
                      ) : user.isVerified === false ? (
                        <span className="inline-flex items-center gap-1.5 text-text-muted">
                          <XCircle className="h-4 w-4 flex-shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                          Yo&apos;q
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-muted">{fmtLastLogin(user.lastLoginAt ?? undefined)}</td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className={`${btnSecondary} h-8 px-3 text-xs`}
                        aria-label="Batafsil"
                      >
                        Batafsil
                        <ChevronRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 text-sm text-text-muted">
          <span>
            Jami yuklangan: {rows.length.toLocaleString('ru-RU')} · Filtrdan keyin: {filtered.length.toLocaleString('ru-RU')}
          </span>
        </div>
      </div>
    </div>
  );
}
