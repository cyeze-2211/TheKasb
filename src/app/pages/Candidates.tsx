import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { COUNTRIES, REGIONS } from '../data/mockData';
import {
  fetchProfessionCategories,
  fetchProfessionsFilterOptions,
  type ProfessionCategoryDto,
  type ProfessionFilterOption,
} from '../api/professions';
import { fetchAgentsForSelect, getUserDisplayName, type SdgUserDto } from '../api/users';
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

/** mockData `REGIONS` — "1-Toshkent..." formatidan id */
const REGION_FILTER_OPTIONS: { id: number; label: string }[] = REGIONS.map((r) => {
  const m = /^(\d+)\s*[-–]\s*/.exec(r.trim()) ?? /^(\d+)/.exec(r.trim());
  const id = m ? Number(m[1]) : NaN;
  return { id, label: r };
}).filter((x) => Number.isFinite(x.id) && x.id > 0);

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

function initialsFromRow(name: string, phone: string): string {
  const n = name.trim();
  if (n) {
    return n
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  const d = phone.replace(/\D/g, '').slice(-2);
  return d || '?';
}

/** GET /api/admin/candidates/{id} — `id` nomzod/profil ID (user_id emas) */
function candidateDetailHref(row: Record<string, unknown>): string | null {
  const cid = pickNum(row, 'candidate_id', 'candidateId');
  if (cid != null) return `/admin/candidates/${encodeURIComponent(String(cid))}`;
  const pid = pickNum(row, 'profile_id', 'profileId');
  if (pid != null) return `/admin/candidates/${encodeURIComponent(String(pid))}`;
  const idStr = pickStr(
    row,
    'id',
    'candidate_profile_id',
    'candidateProfileId',
    'profile_uuid',
    'profileUuid',
  );
  if (idStr) return `/admin/candidates/${encodeURIComponent(idStr)}`;
  return null;
}

function ProfileMetrics({
  score,
  completeness,
}: {
  score: number | undefined;
  completeness: number | undefined;
}) {
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  return (
    <div className="flex min-w-[7.5rem] flex-col gap-2">
      <div>
        <div className="mb-0.5 flex justify-between text-[10px] font-medium uppercase tracking-wide text-text-muted">
          <span>Ball</span>
          <span className="tabular-nums text-text-primary">
            {score != null ? `${clamp(score)}%` : '—'}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-[width] duration-300"
            style={{ width: score != null ? `${clamp(score)}%` : '0%' }}
          />
        </div>
      </div>
      <div>
        <div className="mb-0.5 flex justify-between text-[10px] font-medium uppercase tracking-wide text-text-muted">
          <span>To‘liqlik</span>
          <span className="tabular-nums text-text-primary">
            {completeness != null ? `${clamp(completeness)}%` : '—'}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500/70 to-sky-600 transition-[width] duration-300"
            style={{ width: completeness != null ? `${clamp(completeness)}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
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
  const [categories, setCategories] = useState<ProfessionCategoryDto[]>([]);
  const [professionOptions, setProfessionOptions] = useState<ProfessionFilterOption[]>([]);
  const [agentOptions, setAgentOptions] = useState<SdgUserDto[]>([]);
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
        const [cats, profs, ag] = await Promise.all([
          fetchProfessionCategories(),
          fetchProfessionsFilterOptions(),
          fetchAgentsForSelect(),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setProfessionOptions(profs);
          setAgentOptions(ag);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setProfessionOptions([]);
          setAgentOptions([]);
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
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Hudud (regionId)</span>
              <select
                className={ctlSelect}
                disabled={filterMetaLoading}
                value={q.regionId ?? ''}
                onChange={(e) =>
                  setField({
                    regionId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              >
                <option value="">Barchasi</option>
                {REGION_FILTER_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Kategoriya</span>
              <select
                className={ctlSelect}
                disabled={filterMetaLoading}
                value={q.categoryId ?? ''}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  setField({ categoryId: v, professionId: undefined });
                }}
              >
                <option value="">Barchasi</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_uz || c.name_ru} (ID {c.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Kasb</span>
              <select
                className={ctlSelect}
                disabled={filterMetaLoading}
                value={q.professionId ?? ''}
                onChange={(e) =>
                  setField({
                    professionId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              >
                <option value="">Barchasi</option>
                {q.professionId != null &&
                !visibleProfessions.some((p) => p.id === q.professionId) ? (
                  <option value={q.professionId}>ID {q.professionId} (joriy filtr)</option>
                ) : null}
                {visibleProfessions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} (ID {p.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Agent</span>
              <select
                className={ctlSelect}
                disabled={filterMetaLoading}
                value={q.agentId ?? ''}
                onChange={(e) =>
                  setField({ agentId: e.target.value ? Number(e.target.value) : undefined })
                }
              >
                <option value="">Barchasi</option>
                {q.agentId != null && !agentOptions.some((a) => a.id === q.agentId) ? (
                  <option value={q.agentId}>ID {q.agentId} (joriy filtr)</option>
                ) : null}
                {agentOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {getUserDisplayName(a)}
                    {a.phoneNumber ? ` · ${a.phoneNumber}` : ''} (ID {a.id})
                  </option>
                ))}
              </select>
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

      <div className={`${panelElite} overflow-hidden shadow-sm ring-1 ring-border/60`}>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead className={theadElite}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Nomzod
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Hudud
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kasb</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Tajriba
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Mavjudlik
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Til</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Maosh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Profil</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Holat</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-text-muted">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-sm text-text-muted">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" aria-hidden />
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-text-muted">
                    Natija yo‘q
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => {
                  const href = candidateDetailHref(row);
                  const name = pickStr(
                    row,
                    'full_name',
                    'fullName',
                    'name',
                    'first_name',
                    'firstName',
                  );
                  const phone = pickStr(row, 'phone', 'phone_number', 'phoneNumber', 'mobile');
                  const regionId = pickNum(row, 'region_id', 'regionId');
                  const region = pickStr(
                    row,
                    'region_name',
                    'regionName',
                    'region',
                    'address_region',
                    'addressRegion',
                  );
                  const regionLabel =
                    region || (regionId != null ? `Hudud #${regionId}` : '—');
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
                  const completeness = pickNum(
                    row,
                    'profile_completeness',
                    'profileCompleteness',
                  );
                  const pStatus = pickStr(row, 'profile_status', 'profileStatus', 'status');
                  const rowKey = candidateDetailHref(row)?.split('/').pop() ?? `i-${rowIndex}`;
                  return (
                    <tr
                      key={rowKey}
                      className={`${rowElite} border-b border-border/80 transition-colors hover:bg-muted/25`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-bold text-primary ring-1 ring-primary/15"
                            aria-hidden
                          >
                            {initialsFromRow(name, phone)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-text-primary">
                              {name || 'Nomzod'}
                            </div>
                            <div className="mono truncate text-xs text-text-muted">{phone || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">{regionLabel}</td>
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
                      <td className="px-4 py-3">
                        <ProfileMetrics score={score} completeness={completeness} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor(pStatus)}`}
                        >
                          {pStatus || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {href ? (
                          <Link to={href} className={iconAction} title="Batafsil">
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
