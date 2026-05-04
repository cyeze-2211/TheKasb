import { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, RefreshCw, XCircle } from 'lucide-react';
import { mockUsers } from '../data/mockData';
import { RoleBadge } from '../components/StatusBadge';
import { FilterPanel } from '../components/FilterPanel';
import { btnSecondary, ctlSelect, pageKicker, panelElite, rowElite, theadElite } from '../components/pageChrome';

export function Users() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState({
    role: 'ALL',
    active: 'ALL',
    verified: 'ALL',
  });

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">Foydalanuvchilar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Barcha tizim foydalanuvchilarini boshqarish
        </p>
      </div>

      <FilterPanel
        id="users-filters"
        collapsible
        expanded={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        toolbar={
          <button type="button" className={btnSecondary}>
            <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden />
            Yangilash
          </button>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
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
        </div>
      </FilterPanel>

      <div className={panelElite}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-gradient-to-r from-muted/30 to-transparent px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0">Foydalanuvchilar</h2>
            <span className="rounded-full border border-border/60 bg-surface px-2.5 py-0.5 text-xs font-semibold tabular-nums text-text-muted shadow-[var(--elite-shadow-xs)]">
              {mockUsers.length.toLocaleString('ru-RU')} ta
            </span>
          </div>
          <button type="button" className={btnSecondary}>
            <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theadElite}>
              <tr>
                <th className="w-16 px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Ism Familiya
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Aktiv</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Tasdiqlangan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Oxirgi kirish
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockUsers.map((user, index) => (
                <tr key={user.id} className={rowElite}>
                  <td className="px-6 py-3 text-sm text-text-muted">{index + 1}</td>
                  <td className="mono px-6 py-3 text-sm text-text-primary">{user.phone}</td>
                  <td className="px-6 py-3 text-sm text-text-primary">{user.name}</td>
                  <td className="px-6 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                        Ha
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-danger">
                        <XCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                        Yo&apos;q
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {user.verified ? (
                      <span className="inline-flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                        Ha
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-text-muted">
                        <XCircle className="h-4 w-4 flex-shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                        Yo&apos;q
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-text-muted">{user.lastLogin}</td>
                  <td className="px-6 py-3">
                    <button
                      type="button"
                      className="h-8 rounded-xl border border-danger/80 px-3 text-xs font-medium text-danger shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:bg-danger hover:text-white hover:shadow-md"
                    >
                      Bloklash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <div className="text-sm text-text-muted">
            1–{mockUsers.length} / 1,247 ta
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`${btnSecondary} disabled:pointer-events-none disabled:opacity-50`}
              disabled
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Oldingi
            </button>
            <button type="button" className={btnSecondary}>
              Keyingi
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
