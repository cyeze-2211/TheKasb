import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchProfessionCategories,
  fetchProfessionsFilterOptions,
  type ProfessionCategoryDto,
  type ProfessionFilterOption,
} from '../api/professions';
import { fetchStaffUsersForSelect, getUserDisplayName, type SdgUserDto } from '../api/users';
import { Link } from 'react-router';
import { CircleAlert, Eye, Loader2, Plus, RefreshCw } from 'lucide-react';
import { COUNTRIES } from '../data/mockData';
import { FilterPanel } from '../components/FilterPanel';
import {
  btnPrimary,
  btnSecondary,
  ctlSelect,
  iconAction,
  pageKicker,
  panelElite,
  rowElite,
  theadElite,
} from '../components/pageChrome';
import {
  axiosErrorMessage,
  fetchVacanciesList,
  pickBool,
  pickNum,
  pickStr,
  type VacancyStatus,
  type VacanciesListQuery,
} from '../api/vacancies';

const badgeShell =
  'inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface px-2.5 py-1 text-xs font-semibold shadow-[var(--elite-shadow-xs)]';

function statusPill(status: string) {
  const s = status || '—';
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
    PAUSED: 'bg-amber-100 text-amber-800 border-amber-200',
    CLOSED: 'bg-rose-100 text-rose-800 border-rose-200',
    FILLED: 'bg-sky-100 text-sky-800 border-sky-200',
  };
  return <span className={`${badgeShell} ${map[s] ?? ''}`}>{s}</span>;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('uz-UZ');
  } catch {
    return iso;
  }
}

export function Vacancies() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [q, setQ] = useState<VacanciesListQuery>({
    page: 0,
    size: 20,
    status: '',
    countryCode: '',
    categoryId: undefined,
    professionId: undefined,
    createdBy: undefined,
    isUrgent: '',
    sort: '',
  });
  const [applied, setApplied] = useState<VacanciesListQuery>(q);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProfessionCategoryDto[]>([]);
  const [professionOptions, setProfessionOptions] = useState<ProfessionFilterOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<SdgUserDto[]>([]);
  const [filterMetaLoading, setFilterMetaLoading] = useState(false);

  const visibleProfessions = useMemo(() => {
    if (!q.categoryId) return professionOptions;
    return professionOptions.filter((p) => p.categoryId === q.categoryId);
  }, [professionOptions, q.categoryId]);

  useEffect(() => {
    let cancelled = false;
    setFilterMetaLoading(true);
    void (async () => {
      try {
        const [cats, profs, staff] = await Promise.all([
          fetchProfessionCategories(),
          fetchProfessionsFilterOptions(),
          fetchStaffUsersForSelect(),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setProfessionOptions(profs);
          setStaffOptions(staff);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setProfessionOptions([]);
          setStaffOptions([]);
        }
      } finally {
        if (!cancelled) setFilterMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchVacanciesList(applied);
      setRows(page.content);
      setTotalElements(page.totalElements);
      setTotalPages(page.totalPages);
    } catch (e) {
      setError(axiosErrorMessage(e, 'Vakansiyalarni yuklashda xato.'));
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  const page = applied.page ?? 0;
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  const applyFilters = () => setApplied({ ...q, page: 0 });
  const clearFilters = () => {
    const base: VacanciesListQuery = {
      page: 0,
      size: 20,
      status: '',
      countryCode: '',
      categoryId: undefined,
      professionId: undefined,
      createdBy: undefined,
      isUrgent: '',
      sort: '',
    };
    setQ(base);
    setApplied(base);
  };

  const visible = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
          <h1 className="mb-1">Vakansiyalar</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          </p>
        </div>
        <Link to="/admin/vacancies/create" className={`${btnPrimary} h-10 min-h-10`}>
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Yangi vakansiya
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <FilterPanel
        id="vacancies-filters"
        title="Filtrlar va saralash"
        collapsible
        expanded={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btnSecondary} onClick={applyFilters} disabled={loading}>
              Filtrlash
            </button>
            <button type="button" className={btnSecondary} onClick={clearFilters} disabled={loading}>
              Tozalash
            </button>
            <button type="button" className={btnSecondary} onClick={() => void load()} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              Yangilash
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <select
            className={`${ctlSelect} min-w-[10rem] max-w-full flex-1 sm:max-w-[11.5rem]`}
            value={q.status ?? ''}
            onChange={(e) => setQ((p) => ({ ...p, status: e.target.value as VacancyStatus | '' }))}
          >
            <option value="">Status — barchasi</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="FILLED">FILLED</option>
            <option value="PAUSED">PAUSED</option>
          </select>
          <select
            className={`${ctlSelect} min-w-[10rem] max-w-full flex-1 sm:max-w-[13rem]`}
            value={q.countryCode ?? ''}
            onChange={(e) => setQ((p) => ({ ...p, countryCode: e.target.value }))}
          >
            <option value="">Mamlakat — barchasi</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          <select
            className={`${ctlSelect} min-w-[10rem] max-w-full flex-1 sm:max-w-[13rem]`}
            disabled={filterMetaLoading}
            value={q.categoryId ?? ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : undefined;
              setQ((p) => ({ ...p, categoryId: v, professionId: undefined }));
            }}
          >
            <option value="">Kategoriya — barchasi</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_uz || c.name_ru} (ID {c.id})
              </option>
            ))}
          </select>
          <select
            className={`${ctlSelect} min-w-[10rem] max-w-full flex-1 sm:max-w-[14rem]`}
            disabled={filterMetaLoading}
            value={q.professionId ?? ''}
            onChange={(e) =>
              setQ((p) => ({ ...p, professionId: e.target.value ? Number(e.target.value) : undefined }))
            }
          >
            <option value="">Kasb — barchasi</option>
            {q.professionId != null &&
            !visibleProfessions.some((p) => p.id === q.professionId) ? (
              <option value={q.professionId}>ID {q.professionId} (joriy)</option>
            ) : null}
            {visibleProfessions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} (ID {p.id})
              </option>
            ))}
          </select>
          <select
            className={`${ctlSelect} min-w-[10rem] max-w-full flex-1 sm:max-w-[12rem]`}
            value={q.isUrgent === '' ? '' : q.isUrgent ? 'YES' : 'NO'}
            onChange={(e) =>
              setQ((p) => ({
                ...p,
                isUrgent: e.target.value === '' ? '' : e.target.value === 'YES',
              }))
            }
          >
            <option value="">Shoshilinch — barchasi</option>
            <option value="YES">Ha</option>
            <option value="NO">Yo&apos;q</option>
          </select>
          <select
            className={`${ctlSelect} min-w-[11rem] max-w-full flex-1 sm:max-w-[15rem]`}
            disabled={filterMetaLoading}
            value={q.createdBy ?? ''}
            onChange={(e) =>
              setQ((p) => ({ ...p, createdBy: e.target.value ? Number(e.target.value) : undefined }))
            }
          >
            <option value="">Yaratgan — barchasi</option>
            {q.createdBy != null &&
            !staffOptions.some((u) => u.id === q.createdBy) ? (
              <option value={q.createdBy}>ID {q.createdBy} (joriy)</option>
            ) : null}
            {staffOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {getUserDisplayName(u)} · {String(u.accountType ?? '')}
                {u.phoneNumber ? ` · ${u.phoneNumber}` : ''} (ID {u.id})
              </option>
            ))}
          </select>
        </div>
      </FilterPanel>

      <div className={panelElite}>
        <div className="border-b border-border/80 bg-gradient-to-r from-muted/30 to-transparent px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0">Barcha vakansiyalar</h2>
            <span className="rounded-full border border-border/60 bg-surface px-2.5 py-1 text-sm font-semibold tabular-nums text-text-muted shadow-[var(--elite-shadow-xs)]">
              {loading ? '…' : totalElements.toLocaleString('ru-RU')} ta
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theadElite}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Sarlavha
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Mamlakat
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Ish beruvchi / Shahar
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Maosh</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Joylar</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Shoshilinch
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-text-muted">Amallar</th>
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
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">
                    Natija yo‘q
                  </td>
                </tr>
              ) : (
                visible.map((vacancy, idx) => {
                  const id = pickStr(vacancy, 'id', 'vacancyId', 'uuid');
                  const title = pickStr(vacancy, 'title');
                  const city = pickStr(vacancy, 'city');
                  const employer = pickStr(vacancy, 'employer_name', 'employerName');
                  const countryCode = pickStr(vacancy, 'country_code', 'countryCode');
                  const status = pickStr(vacancy, 'status');
                  const urgent = pickBool(vacancy, 'isUrgent', 'urgent', 'is_urgent') ?? false;
                  const salaryMin = pickNum(vacancy, 'salary_min', 'salaryMin');
                  const salaryMax = pickNum(vacancy, 'salary_max', 'salaryMax');
                  const salaryCurrency = pickStr(vacancy, 'salary_currency', 'salaryCurrency') || 'EUR';
                  const placesTotal = pickNum(vacancy, 'places_total', 'placesTotal') ?? 0;
                  const placesFilled = pickNum(vacancy, 'places_filled', 'placesFilled') ?? 0;
                  const expiresAt = pickStr(vacancy, 'expires_at', 'expiresAt');
                  const country = COUNTRIES.find((c) => c.code === countryCode);
                return (
                  <tr key={id || `i-${idx}`} className={rowElite}>
                    <td className="px-6 py-3">
                      <div className="font-medium text-text-primary">{title || '—'}</div>
                      <div className="mt-0.5 text-xs text-text-muted">Muddat: {fmtDate(expiresAt)}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{country?.flag}</span>
                        <span className="text-sm text-text-muted">{countryCode || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm text-text-primary">{employer || '—'}</div>
                      <div className="text-xs text-text-muted">{city || '—'}</div>
                    </td>
                    <td className="px-6 py-3">
                      {salaryMin != null && salaryMax != null ? (
                        <div className="text-sm font-medium text-text-primary tabular-nums">
                          {salaryMin.toLocaleString('ru-RU')}–{salaryMax.toLocaleString('ru-RU')} {salaryCurrency}
                        </div>
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-text-primary tabular-nums">
                        {placesFilled}/{placesTotal}
                      </div>
                      <div className="text-xs text-text-muted">band / jami</div>
                    </td>
                    <td className="px-6 py-3">
                      {urgent ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger">
                          <CircleAlert className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                          HA
                        </span>
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {statusPill(status)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Link to={`/admin/vacancies/${id}`} className={iconAction} title="Ko&apos;rish">
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm text-text-muted">
          <span>
            Sahifa {totalPages > 0 ? page + 1 : 0} / {Math.max(1, totalPages)}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${btnSecondary} disabled:pointer-events-none disabled:opacity-50`}
              disabled={!canPrev || loading}
              onClick={() => setApplied((a) => ({ ...a, page: Math.max(0, (a.page ?? 0) - 1) }))}
            >
              Oldingi
            </button>
            <button
              type="button"
              className={`${btnSecondary} disabled:pointer-events-none disabled:opacity-50`}
              disabled={!canNext || loading}
              onClick={() => setApplied((a) => ({ ...a, page: (a.page ?? 0) + 1 }))}
            >
              Keyingi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
