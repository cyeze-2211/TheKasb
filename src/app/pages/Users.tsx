import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  UserPlus,
  XCircle,
} from 'lucide-react';
import type { UserRole } from '../data/mockData';
import {
  axiosErrorMessage,
  fetchUsersWithMeta,
  getUserDisplayName,
  type AccountType,
  type AdminUsersPageMeta,
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

/** 0-based joriy sahifa va jami sahifalar — bosiladigan raqamlar (+ … chetlar) */
type PageNavItem = number | 'ellipsis';

function adminUsersPaginationItems(currentZeroBased: number, totalPages: number): PageNavItem[] {
  const total = Math.max(1, totalPages);
  const cur = Math.min(Math.max(0, currentZeroBased), total - 1);
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const s = new Set<number>();
  s.add(0);
  s.add(total - 1);
  for (let d = -2; d <= 2; d++) {
    const p = cur + d;
    if (p >= 0 && p < total) s.add(p);
  }
  const nums = Array.from(s).sort((a, b) => a - b);
  const out: PageNavItem[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push('ellipsis');
    out.push(nums[i]);
  }
  return out;
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
  const [pageMeta, setPageMeta] = useState<AdminUsersPageMeta | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const fetchSeq = useRef(0);

  const patchFilters = useCallback((patch: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(0);
  }, []);

  const load = useCallback(async () => {
    const seq = ++fetchSeq.current;
    setLoading(true);
    setError(null);
    try {
      const { users, meta } = await fetchUsersWithMeta({
        accountType: filters.role === 'ALL' ? 'ALL' : (filters.role as AccountType),
        page,
        size: pageSize,
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
      if (seq !== fetchSeq.current) return;
      setRows(users);
      setPageMeta(meta);
      if (meta != null) setPage(meta.pageNumber);
    } catch (e) {
      if (seq !== fetchSeq.current) return;
      setError(axiosErrorMessage(e, 'Ro‘yxatni yuklashda xato.'));
      setRows([]);
      setPageMeta(null);
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
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
    page,
    pageSize,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalElements = pageMeta?.totalElements ?? rows.length;
  const totalPages = Math.max(1, pageMeta?.totalPages ?? 1);
  const displayPageOneBased = pageMeta ? pageMeta.pageNumber + 1 : page + 1;
  const canPrev = page > 0;
  const canNext = pageMeta ? page < totalPages - 1 : rows.length >= pageSize && rows.length > 0;

  const paginationItems = useMemo(
    () => adminUsersPaginationItems(page, totalPages),
    [page, totalPages],
  );

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
              onChange={(e) => patchFilters({ search: e.target.value })}
              className={ctlInput}
              placeholder="Telefon, email, ism..."
            />
          </div>
          <div className="min-w-[10rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Rol</label>
            <select
              value={filters.role}
              onChange={(e) => patchFilters({ role: e.target.value })}
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
              onChange={(e) => patchFilters({ active: e.target.value })}
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
              onChange={(e) => patchFilters({ verified: e.target.value })}
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
              onChange={(e) => patchFilters({ neverLoggedIn: e.target.value })}
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
              onChange={(e) => patchFilters({ registeredFrom: e.target.value })}
              className={ctlSelect}
            />
          </div>
          <div className="min-w-[12rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Registered to</label>
            <input
              type="date"
              value={filters.registeredTo}
              onChange={(e) => patchFilters({ registeredTo: e.target.value })}
              className={ctlSelect}
            />
          </div>
          <div className="min-w-[12rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Last login from</label>
            <input
              type="date"
              value={filters.lastLoginFrom}
              onChange={(e) => patchFilters({ lastLoginFrom: e.target.value })}
              className={ctlSelect}
            />
          </div>
          <div className="min-w-[12rem] flex-1 sm:max-w-[14rem]">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Last login to</label>
            <input
              type="date"
              value={filters.lastLoginTo}
              onChange={(e) => patchFilters({ lastLoginTo: e.target.value })}
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
              {loading ? '…' : totalElements.toLocaleString('ru-RU')} ta
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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">
                    Ma’lumot yo‘q yoki filtrga mos kelmaydi.
                  </td>
                </tr>
              ) : (
                rows.map((user, index) => (
                  <tr key={user.id} className={rowElite}>
                    <td className="px-6 py-3 text-sm text-text-muted">{page * pageSize + index + 1}</td>
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
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Sahifa: <span className="tabular-nums text-text-primary">{displayPageOneBased}</span> /{' '}
              <span className="tabular-nums text-text-primary">{totalPages}</span>
              {pageMeta ? (
                <>
                  {' '}
                  · Sahifada <span className="tabular-nums">{rows.length}</span> /{' '}
                  <span className="tabular-nums">{pageMeta.pageSize}</span>
                </>
              ) : null}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="text-xs">Sahifada</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className={`${ctlSelect} h-9 min-w-[5.5rem] py-0 text-xs`}
              >
                {[20, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                className={`${btnSecondary} inline-flex h-9 items-center gap-1 px-2.5 text-xs`}
                disabled={!canPrev || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Oldingi sahifa"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
              {paginationItems.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`e-${idx}`}
                    className="inline-flex min-w-[1.75rem] select-none items-center justify-center px-0.5 text-xs text-text-muted"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    disabled={loading}
                    onClick={() => setPage(item)}
                    aria-label={`${item + 1}-sahifa`}
                    aria-current={item === page ? 'page' : undefined}
                    className={
                      item === page
                        ? `inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-primary bg-primary/15 px-2 text-xs font-semibold tabular-nums text-primary`
                        : `inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-border/80 bg-surface px-2 text-xs font-medium tabular-nums text-text-primary transition-colors hover:border-border hover:bg-muted/30 disabled:opacity-50`
                    }
                  >
                    {item + 1}
                  </button>
                ),
              )}
              <button
                type="button"
                className={`${btnSecondary} inline-flex h-9 items-center gap-1 px-2.5 text-xs`}
                disabled={!canNext || loading}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Keyingi sahifa"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
