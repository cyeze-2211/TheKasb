import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { COUNTRIES } from '../data/mockData';
import { Link } from 'react-router';
import { FilterPanel } from '../components/FilterPanel';
import {
  btnPrimary,
  btnSecondary,
  ctlInput,
  ctlSelect,
  filterFieldGrid,
  iconAction,
  pageKicker,
  panelElite,
  rowElite,
  theadElite,
} from '../components/pageChrome';
import {
  axiosErrorMessage,
  fetchCandidatesList,
  pickNum,
  pickStr,
  type AdminProfileStatus,
  type CandidatesListQuery,
} from '../api/candidates';

const experienceLabels: Record<string, string> = {
  YEAR_1_3: '1-3 yil',
  YEAR_3_5: '3-5 yil',
  YEAR_5_PLUS: '5+ yil',
};

const availabilityLabels: Record<string, string> = {
  READY_NOW: 'Hozir tayyor',
  WITHIN_1_MONTH: '1 oy ichida',
  WITHIN_3_MONTHS: '3 oy ichida',
};

const languageFlags: Record<string, string> = {
  RUSSIAN: '🇷🇺',
  ENGLISH: '🇬🇧',
  GERMAN: '🇩🇪',
  KOREAN: '🇰🇷',
  TURKISH: '🇹🇷',
  POLISH: '🇵🇱',
  OTHER: '🌐',
};

const initialQuery = (): CandidatesListQuery => ({
  page: 0,
  size: 20,
  profileStatus: '',
  regionId: undefined,
  categoryId: undefined,
  professionId: undefined,
  agentId: undefined,
  experienceRange: '',
  availabilityStatus: '',
  countryCode: '',
  language: '',
  languageLevel: '',
  salaryMin: undefined,
  salaryMax: undefined,
  sort: '',
});

function statusColor(s: string): string {
  switch (s) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'DRAFT':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'PLACED':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'SUSPENDED':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-muted text-text-primary border-border';
  }
}

export function Candidates() {
  const [showFilters, setShowFilters] = useState(true);
  const [q, setQ] = useState<CandidatesListQuery>(initialQuery);
  const [applied, setApplied] = useState<CandidatesListQuery>(initialQuery);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchCandidatesList(applied);
      setRows(page.content);
      setTotalElements(page.totalElements);
      setTotalPages(page.totalPages);
    } catch (e) {
      setError(axiosErrorMessage(e, 'Yuklashda xato.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = (patch: Partial<CandidatesListQuery>) => setQ((prev) => ({ ...prev, ...patch }));

  const applySearch = () => {
    setApplied({ ...q, page: 0 });
  };

  const clearFilters = () => {
    const base = initialQuery();
    setQ(base);
    setApplied(base);
  };

  const page = applied.page ?? 0;
  const size = applied.size ?? 20;
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">Nomzodlar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          <span className="mono text-xs">GET /admin/candidates</span> — filtr va sahifalash
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <FilterPanel
        id="candidates-filters"
        collapsible
        expanded={showFilters}
        onToggle={() => setShowFilters((v) => !v)}
      >
        <div className="space-y-4">
          <div className={filterFieldGrid}>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Holat (profileStatus)</span>
              <select
                className={ctlSelect}
                value={q.profileStatus ?? ''}
                onChange={(e) =>
                  setField({ profileStatus: e.target.value as AdminProfileStatus | '' })
                }
              >
                <option value="">Barchasi</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING">PENDING</option>
                <option value="PLACED">PLACED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">regionId</span>
              <input
                type="number"
                className={ctlInput}
                placeholder="Masalan: 1"
                value={q.regionId ?? ''}
                onChange={(e) =>
                  setField({
                    regionId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">categoryId</span>
              <input
                type="number"
                className={ctlInput}
                value={q.categoryId ?? ''}
                onChange={(e) =>
                  setField({
                    categoryId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">professionId</span>
              <input
                type="number"
                className={ctlInput}
                value={q.professionId ?? ''}
                onChange={(e) =>
                  setField({
                    professionId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">agentId</span>
              <input
                type="number"
                className={ctlInput}
                value={q.agentId ?? ''}
                onChange={(e) =>
                  setField({ agentId: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
          </div>

          <div className={filterFieldGrid}>
            <select
              className={ctlSelect}
              value={q.experienceRange ?? ''}
              onChange={(e) => setField({ experienceRange: e.target.value as CandidatesListQuery['experienceRange'] })}
            >
              <option value="">Tajriba — barchasi</option>
              <option value="YEAR_1_3">1-3 yil</option>
              <option value="YEAR_3_5">3-5 yil</option>
              <option value="YEAR_5_PLUS">5+ yil</option>
            </select>
            <select
              className={ctlSelect}
              value={q.availabilityStatus ?? ''}
              onChange={(e) =>
                setField({ availabilityStatus: e.target.value as CandidatesListQuery['availabilityStatus'] })
              }
            >
              <option value="">Mavjudlik — barchasi</option>
              <option value="READY_NOW">Hozir tayyor</option>
              <option value="WITHIN_1_MONTH">1 oy ichida</option>
              <option value="WITHIN_3_MONTHS">3 oy ichida</option>
            </select>
            <select
              className={ctlSelect}
              value={q.countryCode ?? ''}
              onChange={(e) => setField({ countryCode: e.target.value })}
            >
              <option value="">Maqsad mamlakat (kod)</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>
            <select
              className={ctlSelect}
              value={q.language ?? ''}
              onChange={(e) => setField({ language: e.target.value as CandidatesListQuery['language'] })}
            >
              <option value="">Til</option>
              <option value="RUSSIAN">RUSSIAN</option>
              <option value="ENGLISH">ENGLISH</option>
              <option value="GERMAN">GERMAN</option>
              <option value="KOREAN">KOREAN</option>
              <option value="TURKISH">TURKISH</option>
              <option value="POLISH">POLISH</option>
              <option value="OTHER">OTHER</option>
            </select>
            <select
              className={ctlSelect}
              value={q.languageLevel ?? ''}
              onChange={(e) => setField({ languageLevel: e.target.value as CandidatesListQuery['languageLevel'] })}
            >
              <option value="">Til darajasi</option>
              <option value="NONE">NONE</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Maosh (min / max)</span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className={`${ctlInput} w-28 sm:w-32`}
                  value={q.salaryMin ?? ''}
                  onChange={(e) =>
                    setField({ salaryMin: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
                <span className="text-text-muted">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  className={`${ctlInput} w-28 sm:w-32`}
                  value={q.salaryMax ?? ''}
                  onChange={(e) =>
                    setField({ salaryMax: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
            </div>
            <div className="min-w-[8rem] flex-1 sm:max-w-xs">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">sort</span>
              <input
                type="text"
                className={ctlInput}
                placeholder="Masalan: createdAt,desc"
                value={q.sort ?? ''}
                onChange={(e) => setField({ sort: e.target.value })}
              />
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} onClick={applySearch}>
                <Search className="h-4 w-4" strokeWidth={2} aria-hidden />
                Qidirish
              </button>
              <button type="button" className={btnSecondary} onClick={clearFilters}>
                Tozalash
              </button>
            </div>
          </div>
        </div>
      </FilterPanel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="m-0">Nomzodlar</h2>
          <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-text-muted">
            {loading ? '…' : totalElements.toLocaleString('ru-RU')} ta
          </span>
        </div>
        <button type="button" className={btnSecondary} onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          Yangilash
        </button>
      </div>

      <div className={panelElite}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theadElite}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Ism / Telefon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Viloyat / hudud</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kasb</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tajriba</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Mavjudlik</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Til</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Maosh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Ball</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Holat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center text-sm text-text-muted">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" aria-hidden />
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-sm text-text-muted">
                    Natija yo‘q
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => {
                  const id = pickNum(row, 'id', 'candidateId', 'candidate_id');
                  const name = pickStr(
                    row,
                    'full_name',
                    'fullName',
                    'name',
                    'first_name',
                    'firstName',
                  );
                  const phone = pickStr(row, 'phone', 'phone_number', 'phoneNumber', 'mobile');
                  const region = pickStr(
                    row,
                    'region_name',
                    'regionName',
                    'region',
                    'address_region',
                    'addressRegion',
                  );
                  const profession = pickStr(
                    row,
                    'profession_name',
                    'professionName',
                    'profession',
                    'profession_title',
                  );
                  const exp = pickStr(row, 'experience_range', 'experienceRange', 'experience');
                  const avail = pickStr(row, 'availability_status', 'availabilityStatus', 'availability');
                  const lang = pickStr(row, 'primary_language', 'primaryLanguage', 'language');
                  const salMin = pickNum(row, 'salary_min', 'salaryMin', 'expected_salary_min');
                  const salMax = pickNum(row, 'salary_max', 'salaryMax', 'expected_salary_max');
                  const score = pickNum(row, 'score', 'profile_score', 'profileScore', 'match_score');
                  const pStatus = pickStr(row, 'profile_status', 'profileStatus', 'status');
                  return (
                    <tr key={id != null ? `c-${id}` : `i-${rowIndex}`} className={rowElite}>
                      <td className="px-4 py-3 text-sm tabular-nums text-text-muted">{id ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-text-primary">{name || '—'}</div>
                        <div className="mono text-xs text-text-muted">{phone || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">{region || '—'}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{profession || '—'}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {exp ? experienceLabels[exp] ?? exp : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {avail ? availabilityLabels[avail] ?? avail : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {lang ? (
                          <span>
                            {languageFlags[lang] ? `${languageFlags[lang]} ` : ''}
                            {lang}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {salMin != null && salMax != null
                          ? `${salMin.toLocaleString()} – ${salMax.toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums text-text-primary">
                        {score != null ? `${score}%` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor(pStatus)}`}
                        >
                          {pStatus || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {id != null ? (
                          <Link
                            to={`/admin/candidates/${id}`}
                            className={iconAction}
                            title="Batafsil"
                          >
                            <Eye className="h-4 w-4" strokeWidth={2} />
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <div className="text-sm text-text-muted">
            Sahifa {totalPages > 0 ? page + 1 : 0} / {Math.max(1, totalPages)} ·{' '}
            {size}
            {' ta/sahifa'}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${btnSecondary} disabled:pointer-events-none disabled:opacity-50`}
              disabled={!canPrev || loading}
              onClick={() => setApplied((a) => ({ ...a, page: Math.max(0, (a.page ?? 0) - 1) }))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Oldingi
            </button>
            <button
              type="button"
              className={`${btnSecondary} disabled:pointer-events-none disabled:opacity-50`}
              disabled={!canNext || loading}
              onClick={() =>
                setApplied((a) => ({ ...a, page: (a.page ?? 0) + 1 }))
              }
            >
              Keyingi
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
