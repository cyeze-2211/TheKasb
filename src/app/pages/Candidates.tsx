import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';
import { COUNTRIES } from '../data/mockData';
import { fetchAdminRegions } from '../api/regions';
import { fetchAdminUniversities, type AdminUniversity } from '../api/universities';
import {
  fetchProfessionCategories,
  fetchProfessionsFilterOptions,
  type ProfessionCategoryDto,
  type ProfessionFilterOption,
} from '../api/professions';
import { fetchAgentsForSelect, getUserDisplayName, type SdgUserDto } from '../api/users';
import { Link } from 'react-router';
import { AdminPaginationBar } from '../components/AdminPaginationBar';
import { FilterPanel } from '../components/FilterPanel';
import { LanguageIcon } from '../components/LanguageIcon';
import {
  btnPrimary,
  btnSecondary,
  ctlInput,
  ctlSelect,
  filterFieldGrid,
  pageKicker,
  panelElite,
  rowElite,
  theadElite,
} from '../components/pageChrome';
import {
  adminCandidateIdFromListRow,
  axiosErrorMessage,
  fetchCandidatesList,
  pickNum,
  pickStr,
  type AdminProfileStatus,
  type CandidatesListQuery,
} from '../api/candidates';
import {
  adminLanguageUz,
  ADMIN_LANGUAGE_SELECT_ORDER,
  candidateProfileStatusUz,
  cefrLevelUz,
  EDUCATION_LEVEL_SELECT_ORDER,
  educationLevelUz,
  uzOrCode,
} from '../lib/adminUiUz';
import { languageLabelUz, parseLanguageCodesFromCell } from '../lib/languageUi';

// Default User avatar (just an emoji, can change to image if you have)
const DefaultUserAvatar = () => (
  <span
    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 ring-1 ring-slate-200 select-none"
    aria-label="No user photo"
    title="Avatar yo‘q"
  >
    <span role="img" aria-label="user">👤</span>
  </span>
);

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

const initialQuery = (): CandidatesListQuery => ({
  page: 0,
  size: 20,
  profileStatus: '',
  candidateRegionId: undefined,    // Must be separate for candidate region
  candidateRegionName: '',
  universityRegionId: undefined,   // Must be separate for university region
  universityRegionName: '',
  institutionName: '',
  educationLevel: '',
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
  internationalCountry: '', // <-- yangi filter
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

function candidateDetailHref(row: Record<string, unknown>): string | null {
  const id = adminCandidateIdFromListRow(row);
  if (!id) return null;
  return `/admin/candidates/${encodeURIComponent(id)}`;
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

// Helper to render candidate avatar image according to new logic.
function CandidateAvatar({
  row,
  name,
  phone,
}: {
  row: Record<string, unknown>;
  name: string;
  phone: string;
}) {
  // Check for personal photo (original_photo_url or original_photo_file_id),
  // then ai_photo (ai_passport_photo_url or ai_passport_photo_file_id),
  // else fallback to initials/user avatar.

  const originalPhotoUrl =
    row['original_photo_url'] ||
    row['original_photo'] ||
    row['original_photo_file_url'] || // in case of different naming
    null;

  const aiPhotoUrl =
    row['ai_passport_photo_url'] ||
    row['ai_photo'] ||
    row['ai_passport_photo_file_url'] ||
    null;

  // May be file_id, but if file_id and URL are both present, prefer URL.
  // In real world, you may add backend URL prefix if only file ID.
  // Here, only handling URLs due to context in this file.

  if (typeof originalPhotoUrl === 'string' && originalPhotoUrl.trim().length) {
    // User's own photo present.
    return (
      <img
        src={originalPhotoUrl}
        alt={name || 'Nomzod'}
        className="h-10 w-10 flex-shrink-0 rounded-2xl bg-gray-100 object-cover ring-1 ring-primary/15 group-hover:ring-primary/30"
        style={{ objectFit: 'cover' }}
        aria-hidden
      />
    );
  } else if (typeof aiPhotoUrl === 'string' && aiPhotoUrl.trim().length) {
    return (
      <img
        src={aiPhotoUrl}
        alt={name || 'AI Photo'}
        className="h-10 w-10 flex-shrink-0 rounded-2xl bg-gray-50 object-cover ring-1 ring-primary/10 group-hover:ring-primary/30"
        style={{ objectFit: 'cover' }}
        aria-hidden
      />
    );
  } else {
    // No photo: fallback to initials, and if not present, use default avatar
    const initials = initialsFromRow(name, phone);
    if (initials && initials !== "?") {
      return (
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-bold text-primary ring-1 ring-primary/15 group-hover:ring-primary/30"
          aria-hidden
        >
          {initials}
        </div>
      );
    } else {
      return <DefaultUserAvatar />;
    }
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
  const [categories, setCategories] = useState<ProfessionCategoryDto[]>([]);
  const [professionOptions, setProfessionOptions] = useState<ProfessionFilterOption[]>([]);
  const [agentOptions, setAgentOptions] = useState<SdgUserDto[]>([]);
  const [filterMetaLoading, setFilterMetaLoading] = useState(false);
  const [candidateRegionOptions, setCandidateRegionOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [universityRegionOptions, setUniversityRegionOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [universityFilterOptions, setUniversityFilterOptions] = useState<AdminUniversity[]>([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);

  const visibleProfessions = useMemo(() => {
    if (!q.categoryId) return professionOptions;
    return professionOptions.filter((p) => p.categoryId === q.categoryId);
  }, [professionOptions, q.categoryId]);

  // Fetch filter data (regions, profession cat, etc)
  useEffect(() => {
    let cancelled = false;
    setFilterMetaLoading(true);
    void (async () => {
      try {
        const [cats, profs, ag, regions] = await Promise.all([
          fetchProfessionCategories(),
          fetchProfessionsFilterOptions(),
          fetchAgentsForSelect(),
          fetchAdminRegions(),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setProfessionOptions(profs);
          setAgentOptions(ag);
          // OTM uchun ham, Candidate uchun ham regionlarni ajratib olish
          const candidateRegions = regions
            .filter((r) => r.is_active !== false)
            .map((r) => ({
              id: r.id,
              label: r.name_uz ?? r.name_ru ?? String(r.id),
            }));
          setCandidateRegionOptions(candidateRegions);
          setUniversityRegionOptions(candidateRegions);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setProfessionOptions([]);
          setAgentOptions([]);
          setCandidateRegionOptions([]);
          setUniversityRegionOptions([]);
        }
      } finally {
        if (!cancelled) setFilterMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Universitetlar filtri uchun regionga ulang
  useEffect(() => {
    const universityRegionId = q.universityRegionId;
    if (universityRegionId == null || universityRegionId <= 0) {
      setUniversityFilterOptions([]);
      setUniversitiesLoading(false);
      return;
    }
    let cancelled = false;
    setUniversitiesLoading(true);
    void (async () => {
      try {
        const list = await fetchAdminUniversities({ region_id: universityRegionId });
        if (!cancelled) {
          setUniversityFilterOptions(
            list.filter((u) => u.is_active !== false && (u.name?.trim() ?? '').length > 0),
          );
        }
      } catch {
        if (!cancelled) setUniversityFilterOptions([]);
      } finally {
        if (!cancelled) setUniversitiesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q.universityRegionId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Cross-mapping filter fields for API
      const queryToSend = {
        ...applied,
        regionId: applied.candidateRegionId,
        regionName: applied.candidateRegionName,
        internationalCountry: applied.internationalCountry,
      };
      setRows([]);
      const page = await fetchCandidatesList(queryToSend);
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

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">Nomzodlar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted"></p>
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
        {/* Filter: Birinchi qatorda umumiy, candidate region va kasbiy */}
        <div className="space-y-4">
          <div className={`${filterFieldGrid} grid-cols-1 md:grid-cols-3 lg:grid-cols-4`}>
            {/* Profil holati */}
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Profil holati</span>
              <select
                className={ctlSelect}
                value={q.profileStatus ?? ''}
                onChange={(e) =>
                  setField({ profileStatus: e.target.value as AdminProfileStatus | '' })
                }
              >
                <option value="">Barchasi</option>
                {(Object.keys(candidateProfileStatusUz) as (keyof typeof candidateProfileStatusUz)[]).map((k) => (
                  <option key={k} value={k}>
                    {candidateProfileStatusUz[k]}
                  </option>
                ))}
              </select>
            </div>
            {/* Candidate uchun hudud */}
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Nomzod hududi</span>
              <select
                className={ctlSelect}
                disabled={filterMetaLoading}
                value={q.candidateRegionId ?? ''}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  setField({
                    candidateRegionId: v,
                    candidateRegionName: '',
                  });
                }}
              >
                <option value="">Barchasi</option>
                {q.candidateRegionId != null &&
                  !candidateRegionOptions.some((r) => r.id === q.candidateRegionId) ? (
                  <option value={q.candidateRegionId}>ID {q.candidateRegionId} (joriy filtr)</option>
                ) : null}
                {candidateRegionOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {/* OTM uchun hudud */}
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">OTM hududi</span>
              <select
                className={ctlSelect}
                disabled={filterMetaLoading}
                value={q.universityRegionId ?? ''}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  setField({
                    universityRegionId: v,
                    universityRegionName: '',
                    institutionName: '', // region o'zgarsa otm bo'sh bo'lsin
                  });
                }}
              >
                <option value="">Barchasi</option>
                {q.universityRegionId != null &&
                  !universityRegionOptions.some((r) => r.id === q.universityRegionId) ? (
                  <option value={q.universityRegionId}>ID {q.universityRegionId} (joriy filtr)</option>
                ) : null}
                {universityRegionOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {/* OTM (faqat university region tanlanganda) */}
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">OTM</span>
              <select
                className={ctlSelect}
                disabled={!q.universityRegionId || universitiesLoading || filterMetaLoading}
                value={q.institutionName ?? ''}
                onChange={(e) => setField({ institutionName: e.target.value })}
              >
                <option value="">
                  {!q.universityRegionId
                    ? 'Avval OTM hududini tanlang'
                    : universitiesLoading
                      ? 'Yuklanmoqda…'
                      : 'Barchasi'}
                </option>
                {q.institutionName &&
                  !universityFilterOptions.some((u) => u.name === q.institutionName) ? (
                  <option value={q.institutionName}>{q.institutionName} (joriy filtr)</option>
                ) : null}
                {universityFilterOptions.map((u) => (
                  <option key={u.id} value={u.name ?? ''}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Ta’lim darajasi */}
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Ta’lim darajasi</span>
              <select
                className={ctlSelect}
                value={q.educationLevel ?? ''}
                onChange={(e) => setField({ educationLevel: e.target.value })}
              >
                <option value="">Barchasi</option>
                {EDUCATION_LEVEL_SELECT_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {educationLevelUz[k] ?? k}
                  </option>
                ))}
              </select>
            </div>
            {/* Kategoriya */}
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
            {/* Kasb */}
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
            {/* Agent */}
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

          {/* Ikkinchi qatorda: tajriba, Migratsiya qilmoqchi, mamlakat, til, til darajasi, xalqaro exp davlat */}
          <div className={`${filterFieldGrid} grid-cols-1 md:grid-cols-3 lg:grid-cols-6`}>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Tajriba</span>
              <select
                className={ctlSelect}
                value={q.experienceRange ?? ''}
                onChange={(e) => setField({ experienceRange: e.target.value as CandidatesListQuery['experienceRange'] })}
              >
                <option value="">Barchasi</option>
                <option value="YEAR_1_3">1-3 yil</option>
                <option value="YEAR_3_5">3-5 yil</option>
                <option value="YEAR_5_PLUS">5+ yil</option>
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Migratsiya qilmoqchi</span>
              <select
                className={ctlSelect}
                value={q.availabilityStatus ?? ''}
                onChange={(e) =>
                  setField({ availabilityStatus: e.target.value as CandidatesListQuery['availabilityStatus'] })
                }
              >
                <option value="">Barchasi</option>
                <option value="READY_NOW">Hozir tayyor</option>
                <option value="WITHIN_1_MONTH">1 oy ichida</option>
                <option value="WITHIN_3_MONTHS">3 oy ichida</option>
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Maqsad mamlakat</span>
              <select
                className={ctlSelect}
                value={q.countryCode ?? ''}
                onChange={(e) => setField({ countryCode: e.target.value })}
              >
                <option value="">Barchasi</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Til</span>
              <select
                className={ctlSelect}
                value={q.language ?? ''}
                onChange={(e) => setField({ language: e.target.value as CandidatesListQuery['language'] })}
              >
                <option value="">Barchasi</option>
                {ADMIN_LANGUAGE_SELECT_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {adminLanguageUz[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Til darajasi</span>
              <select
                className={ctlSelect}
                value={q.languageLevel ?? ''}
                onChange={(e) => setField({ languageLevel: e.target.value as CandidatesListQuery['languageLevel'] })}
              >
                <option value="">Barchasi</option>
                {(Object.keys(cefrLevelUz) as (keyof typeof cefrLevelUz)[]).map((k) => (
                  <option key={k} value={k}>
                    {cefrLevelUz[k]}
                  </option>
                ))}
              </select>
            </div>
            {/* Xalqaro exp: Davlat bo'yicha filter */}
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Xalqaro exp. davlati</span>
              <select
                className={ctlSelect}
                value={q.internationalCountry ?? ''}
                onChange={(e) => setField({ internationalCountry: e.target.value })}
              >
                <option value="">Barchasi</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Maosh (min / max)</span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  placeholder="Minimal"
                  className={`${ctlInput} w-28 sm:w-32`}
                  value={q.salaryMin ?? ''}
                  onChange={(e) =>
                    setField({ salaryMin: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
                <span className="text-text-muted">—</span>
                <input
                  type="number"
                  placeholder="Maksimal"
                  className={`${ctlInput} w-28 sm:w-32`}
                  value={q.salaryMax ?? ''}
                  onChange={(e) =>
                    setField({ salaryMax: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
            </div>
            <div className="min-w-[8rem] flex-1 sm:max-w-xs">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Saralash</span>
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
                  Migratsiya qilmoqchi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Til</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Maosh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Xalqaro
                </th>
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
                  const langRaw = pickStr(
                    row,
                    'languages',
                    'primary_language',
                    'primaryLanguage',
                    'language',
                  );
                  const salMin = pickNum(
                    row,
                    'salary_min',
                    'salaryMin',
                    'expected_salary_min',
                    'desired_salary_min',
                    'desiredSalaryMin',
                  );
                  const salMax = pickNum(
                    row,
                    'salary_max',
                    'salaryMax',
                    'expected_salary_max',
                    'desired_salary_max',
                    'desiredSalaryMax',
                  );
                  // Custom for Xalqaro tajriba
                  // Try to extract international_experiences (possible array or null)
                  const internationalExperiences = row['international_experiences'];
                  // Format value based on instructions.
                  let internationalExperienceCell: React.ReactNode = null;
                  if (internationalExperiences == null) {
                    internationalExperienceCell = <span>yo‘q</span>;
                  } else if (Array.isArray(internationalExperiences) && internationalExperiences.length > 0) {
                    // You can format more detail here. Example: join country names.
                    // If needed, we can use country code mapping as with COUNTRIES.
                    internationalExperienceCell = (
                      <span>
                        {internationalExperiences
                          .map((item: any) =>
                            item.country
                              ? (COUNTRIES.find(c => c.code === item.country)?.flag || '') +
                                  ' ' +
                                  (COUNTRIES.find(c => c.code === item.country)?.name || item.country)
                              : ''
                          )
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    );
                  } else {
                    internationalExperienceCell = <span>yo‘q</span>;
                  }
                  const score = pickNum(row, 'score', 'profile_score', 'profileScore', 'match_score');
                  const completeness = pickNum(
                    row,
                    'profile_completeness',
                    'profileCompleteness',
                  );
                  const pStatus = pickStr(row, 'profile_status', 'profileStatus', 'status');
                  const rowKey = adminCandidateIdFromListRow(row) ?? `i-${rowIndex}`;
                  return (
                    <tr
                      key={rowKey}
                      className={`${rowElite} border-b border-border/80 transition-colors hover:bg-muted/25`}
                    >
                      <td className="px-4 py-3">
                        {href ? (
                          <Link
                            to={href}
                            state={{ candidateListRow: row }}
                            className="group flex items-center gap-3 rounded-xl py-0.5 pr-1 text-left outline-none ring-primary/25 transition-colors hover:bg-primary/[0.06] focus-visible:ring-2"
                            title="Batafsil profil"
                          >
                            {/* Replaced avatar logic here: */}
                            <CandidateAvatar row={row} name={name} phone={phone} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate text-sm font-semibold text-primary group-hover:underline">
                                  {name || 'Nomzod'}
                                </span>
                                <ExternalLink
                                  className="h-3.5 w-3.5 shrink-0 text-primary/70 opacity-0 transition-opacity group-hover:opacity-100"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </div>
                              <div className="mono truncate text-xs text-text-muted">{phone || '—'}</div>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3">
                            <CandidateAvatar row={row} name={name} phone={phone} />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-text-primary">
                                {name || 'Nomzod'}
                              </div>
                              <div className="mono truncate text-xs text-text-muted">{phone || '—'}</div>
                            </div>
                          </div>
                        )}
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
                        {langRaw.trim() ? (
                          <div className="flex flex-wrap gap-1.5">
                            {parseLanguageCodesFromCell(langRaw).map((code) => (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border/90 bg-muted/40 px-2 py-0.5 text-xs font-medium text-text-primary shadow-[var(--elite-shadow-xs)]"
                                title={languageLabelUz(code)}
                              >
                                <LanguageIcon code={code} size={15} className="text-primary" />
                                <span>{languageLabelUz(code)}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {salMin != null && salMax != null
                          ? `${salMin.toLocaleString()} – ${salMax.toLocaleString()}`
                          : '—'}
                      </td>
                      {/* Xalqaro tajriba */}
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {internationalExperienceCell}
                      </td>
                      <td className="px-4 py-3">
                        <ProfileMetrics score={score} completeness={completeness} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor(pStatus)}`}
                        >
                          {pStatus ? uzOrCode(candidateProfileStatusUz, pStatus) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:flex-wrap">
                          {href ? (
                            <Link
                              to={href}
                              state={{ candidateListRow: row }}
                              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-primary/40 bg-primary/[0.08] px-2.5 py-1.5 text-xs font-semibold text-primary shadow-[var(--elite-shadow-xs)] transition-all hover:border-primary/55 hover:bg-primary/[0.12]"
                              title="Batafsil profil"
                            >
                              <UserRound className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                              <span>Batafsil</span>
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                            </Link>
                          ) : (
                            <span className="text-[11px] text-text-muted" title="candidate_id topilmadi">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <AdminPaginationBar
          page={page}
          totalPages={totalPages}
          pageSize={size}
          rowsOnPage={rows.length}
          loading={loading}
          onPageChange={(p) => setApplied((a) => ({ ...a, page: p }))}
          onPageSizeChange={(newSize) => {
            setQ((prev) => ({ ...prev, size: newSize }));
            setApplied((a) => ({ ...a, size: newSize, page: 0 }));
          }}
        />
      </div>
    </div>
  );
}
