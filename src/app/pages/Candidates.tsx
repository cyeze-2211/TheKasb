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

const DefaultUserAvatar = () => (
  <span
    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 ring-1 ring-slate-200 select-none"
    aria-label="No user photo"
    title="Avatar yo'q"
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
  sort: '',
  profileStatus: '',
  agentId: undefined,
  candidateRegionId: undefined,
  candidateRegionName: '',
  universityRegionId: undefined,
  universityRegionName: '',
  institutionName: '',
  universityId: undefined,
  educationLevel: '',
  educationCountry: '',
  categoryId: undefined,
  professionId: undefined,
  experienceRange: '',
  experienceYearsMin: undefined,
  experienceYearsMax: undefined,
  hasInternationalExperience: '',
  internationalCountry: '',
  internationalYearsMin: undefined,
  availabilityStatus: '',
  countryCode: '',
  language: '',
  languageLevel: '',
  salaryMin: undefined,
  salaryMax: undefined,
  ageMin: undefined,
  ageMax: undefined,
});

function statusColor(s: string): string {
  switch (s) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'PLACED': return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'SUSPENDED': return 'bg-rose-100 text-rose-800 border-rose-200';
    default: return 'bg-muted text-text-primary border-border';
  }
}

function initialsFromRow(name: string, phone: string): string {
  const n = name.trim();
  if (n) return n.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const d = phone.replace(/\D/g, '').slice(-2);
  return d || '?';
}

function candidateDetailHref(row: Record<string, unknown>): string | null {
  const id = adminCandidateIdFromListRow(row);
  if (!id) return null;
  return `/admin/candidates/${encodeURIComponent(id)}`;
}

function ProfileMetrics({ score, completeness }: { score: number | undefined; completeness: number | undefined }) {
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  return (
    <div className="flex min-w-[7.5rem] flex-col gap-2">
      <div>
        <div className="mb-0.5 flex justify-between text-[10px] font-medium uppercase tracking-wide text-text-muted">
          <span>Ball</span>
          <span className="tabular-nums text-text-primary">{score != null ? `${clamp(score)}%` : '-'}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/80">
          <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-[width] duration-300"
            style={{ width: score != null ? `${clamp(score)}%` : '0%' }} />
        </div>
      </div>
      <div>
        <div className="mb-0.5 flex justify-between text-[10px] font-medium uppercase tracking-wide text-text-muted">
          <span>To&apos;liqlik</span>
          <span className="tabular-nums text-text-primary">{completeness != null ? `${clamp(completeness)}%` : '-'}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/80">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-500/70 to-sky-600 transition-[width] duration-300"
            style={{ width: completeness != null ? `${clamp(completeness)}%` : '0%' }} />
        </div>
      </div>
    </div>
  );
}

function CandidateAvatar({ row, name, phone }: { row: Record<string, unknown>; name: string; phone: string }) {
  const originalPhotoUrl = row['original_photo_url'] || row['original_photo'] || null;
  const aiGenerated = row['ai_photo_generated'] ?? row['aiPhotoGenerated'];
  const aiPhotoUrl = aiGenerated ? (row['ai_passport_photo_url'] || row['ai_photo'] || null) : null;

  if (typeof originalPhotoUrl === 'string' && originalPhotoUrl.trim()) {
    return (
      <img src={originalPhotoUrl} alt={name || 'Nomzod'}
        className="h-10 w-10 flex-shrink-0 rounded-2xl bg-gray-100 object-cover ring-1 ring-primary/15 group-hover:ring-primary/30"
        aria-hidden />
    );
  }
  if (typeof aiPhotoUrl === 'string' && aiPhotoUrl.trim()) {
    return (
      <img src={aiPhotoUrl} alt={name || 'AI Photo'}
        className="h-10 w-10 flex-shrink-0 rounded-2xl bg-gray-50 object-cover ring-1 ring-primary/10 group-hover:ring-primary/30"
        aria-hidden />
    );
  }
  const initials = initialsFromRow(name, phone);
  if (initials && initials !== '?') {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-bold text-primary ring-1 ring-primary/15 group-hover:ring-primary/30" aria-hidden>
        {initials}
      </div>
    );
  }
  return <DefaultUserAvatar />;
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
          const regs = regions.filter((r) => r.is_active !== false).map((r) => ({
            id: r.id,
            label: r.name_uz ?? r.name_ru ?? String(r.id),
          }));
          setCandidateRegionOptions(regs);
          setUniversityRegionOptions(regs);
        }
      } catch {
        if (!cancelled) {
          setCategories([]); setProfessionOptions([]); setAgentOptions([]);
          setCandidateRegionOptions([]); setUniversityRegionOptions([]);
        }
      } finally {
        if (!cancelled) setFilterMetaLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const rid = q.universityRegionId;
    if (rid == null || rid <= 0) { setUniversityFilterOptions([]); setUniversitiesLoading(false); return; }
    let cancelled = false;
    setUniversitiesLoading(true);
    void (async () => {
      try {
        const list = await fetchAdminUniversities({ region_id: rid });
        if (!cancelled) setUniversityFilterOptions(list.filter((u) => u.is_active !== false && (u.name?.trim() ?? '').length > 0));
      } catch {
        if (!cancelled) setUniversityFilterOptions([]);
      } finally {
        if (!cancelled) setUniversitiesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q.universityRegionId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows([]);
      const pg = await fetchCandidatesList(applied);
      setRows(pg.content);
      setTotalElements(pg.totalElements);
      setTotalPages(pg.totalPages);
    } catch (e) {
      setError(axiosErrorMessage(e, 'Yuklashda xato.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { void load(); }, [load]);

  const setField = (patch: Partial<CandidatesListQuery>) => setQ((prev) => ({ ...prev, ...patch }));
  const applySearch = () => setApplied({ ...q, page: 0 });
  const clearFilters = () => { const base = initialQuery(); setQ(base); setApplied(base); };

  const page = applied.page ?? 0;
  const size = applied.size ?? 20;

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb &middot; Admin</p>
        <h1 className="mb-1">Nomzodlar</h1>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <FilterPanel id="candidates-filters" collapsible expanded={showFilters} onToggle={() => setShowFilters((v) => !v)}>
        <div className="space-y-4">

          {/* 1: Profil holati, Agent, Maqsad mamlakat, Tayyorlik */}
          <div className={`${filterFieldGrid} grid-cols-2 md:grid-cols-4`}>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Profil holati</span>
              <select className={ctlSelect} value={q.profileStatus ?? ''} onChange={(e) => setField({ profileStatus: e.target.value as AdminProfileStatus | '' })}>
                <option value="">Barchasi</option>
                {(Object.keys(candidateProfileStatusUz) as (keyof typeof candidateProfileStatusUz)[]).map((k) => (
                  <option key={k} value={k}>{candidateProfileStatusUz[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Agent</span>
              <select className={ctlSelect} disabled={filterMetaLoading} value={q.agentId ?? ''} onChange={(e) => setField({ agentId: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">Barchasi</option>
                {q.agentId != null && !agentOptions.some((a) => a.id === q.agentId) && <option value={q.agentId}>ID {q.agentId}</option>}
                {agentOptions.map((a) => (
                  <option key={a.id} value={a.id}>{getUserDisplayName(a)}{a.phoneNumber ? ` (${a.phoneNumber})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Maqsad mamlakat</span>
              <select className={ctlSelect} value={q.countryCode ?? ''} onChange={(e) => setField({ countryCode: e.target.value })}>
                <option value="">Barchasi</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Tayyorlik</span>
              <select className={ctlSelect} value={q.availabilityStatus ?? ''} onChange={(e) => setField({ availabilityStatus: e.target.value as CandidatesListQuery['availabilityStatus'] })}>
                <option value="">Barchasi</option>
                <option value="READY_NOW">Hozir tayyor</option>
                <option value="WITHIN_1_MONTH">1 oy ichida</option>
                <option value="WITHIN_3_MONTHS">3 oy ichida</option>
              </select>
            </div>
          </div>

          {/* 2: Nomzod hududi, OTM hududi, OTM, Ta'lim */}
          <div className={`${filterFieldGrid} grid-cols-2 md:grid-cols-4`}>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Nomzod hududi</span>
              <select className={ctlSelect} disabled={filterMetaLoading} value={q.candidateRegionId ?? ''} onChange={(e) => setField({ candidateRegionId: e.target.value ? Number(e.target.value) : undefined, candidateRegionName: '' })}>
                <option value="">Barchasi</option>
                {q.candidateRegionId != null && !candidateRegionOptions.some((r) => r.id === q.candidateRegionId) && <option value={q.candidateRegionId}>ID {q.candidateRegionId}</option>}
                {candidateRegionOptions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">OTM hududi</span>
              <select className={ctlSelect} disabled={filterMetaLoading} value={q.universityRegionId ?? ''} onChange={(e) => setField({ universityRegionId: e.target.value ? Number(e.target.value) : undefined, universityRegionName: '', institutionName: '' })}>
                <option value="">Barchasi</option>
                {q.universityRegionId != null && !universityRegionOptions.some((r) => r.id === q.universityRegionId) && <option value={q.universityRegionId}>ID {q.universityRegionId}</option>}
                {universityRegionOptions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">OTM</span>
              <select className={ctlSelect} disabled={!q.universityRegionId || universitiesLoading || filterMetaLoading} value={q.institutionName ?? ''} onChange={(e) => setField({ institutionName: e.target.value })}>
                <option value="">{!q.universityRegionId ? 'Avval OTM hududini tanlang' : universitiesLoading ? 'Yuklanmoqda...' : 'Barchasi'}</option>
                {q.institutionName && !universityFilterOptions.some((u) => u.name === q.institutionName) && <option value={q.institutionName}>{q.institutionName}</option>}
                {universityFilterOptions.map((u) => <option key={u.id} value={u.name ?? ''}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Ta&apos;lim darajasi</span>
              <select className={ctlSelect} value={q.educationLevel ?? ''} onChange={(e) => setField({ educationLevel: e.target.value })}>
                <option value="">Barchasi</option>
                {EDUCATION_LEVEL_SELECT_ORDER.map((k) => <option key={k} value={k}>{educationLevelUz[k] ?? k}</option>)}
              </select>
            </div>
          </div>

          {/* 3: Kategoriya, Kasb, Tajriba, Til */}
          <div className={`${filterFieldGrid} grid-cols-2 md:grid-cols-4`}>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Kategoriya</span>
              <select className={ctlSelect} disabled={filterMetaLoading} value={q.categoryId ?? ''} onChange={(e) => setField({ categoryId: e.target.value ? Number(e.target.value) : undefined, professionId: undefined })}>
                <option value="">Barchasi</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name_uz || c.name_ru}</option>)}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Kasb</span>
              <select className={ctlSelect} disabled={filterMetaLoading} value={q.professionId ?? ''} onChange={(e) => setField({ professionId: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">Barchasi</option>
                {q.professionId != null && !visibleProfessions.some((p) => p.id === q.professionId) && <option value={q.professionId}>ID {q.professionId}</option>}
                {visibleProfessions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Tajriba</span>
              <select className={ctlSelect} value={q.experienceRange ?? ''} onChange={(e) => setField({ experienceRange: e.target.value as CandidatesListQuery['experienceRange'] })}>
                <option value="">Barchasi</option>
                <option value="YEAR_1_3">1-3 yil</option>
                <option value="YEAR_3_5">3-5 yil</option>
                <option value="YEAR_5_PLUS">5+ yil</option>
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Til</span>
              <select className={ctlSelect} value={q.language ?? ''} onChange={(e) => setField({ language: e.target.value as CandidatesListQuery['language'] })}>
                <option value="">Barchasi</option>
                {ADMIN_LANGUAGE_SELECT_ORDER.map((k) => <option key={k} value={k}>{adminLanguageUz[k]}</option>)}
              </select>
            </div>
          </div>

          {/* 4: Til darajasi, Xalqaro tajriba (ketma-ket) */}
          <div className={`${filterFieldGrid} grid-cols-2 md:grid-cols-4`}>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Til darajasi</span>
              <select className={ctlSelect} value={q.languageLevel ?? ''} onChange={(e) => setField({ languageLevel: e.target.value as CandidatesListQuery['languageLevel'] })}>
                <option value="">Barchasi</option>
                {(Object.keys(cefrLevelUz) as (keyof typeof cefrLevelUz)[]).map((k) => (
                  <option key={k} value={k}>{cefrLevelUz[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Xalqaro tajriba</span>
              <select className={ctlSelect}
                value={q.hasInternationalExperience === true ? 'true' : q.hasInternationalExperience === false ? 'false' : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  const has = v === 'true' ? true : v === 'false' ? false : '';
                  setField({ hasInternationalExperience: has, internationalCountry: has === true ? q.internationalCountry : '', internationalYearsMin: has === true ? q.internationalYearsMin : undefined });
                }}>
                <option value="">Barchasi</option>
                <option value="true">Bor</option>
                <option value="false">Yo&apos;q</option>
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Xalqaro davlat</span>
              <select className={ctlSelect} disabled={q.hasInternationalExperience !== true} value={q.internationalCountry ?? ''} onChange={(e) => setField({ internationalCountry: e.target.value })}>
                <option value="">{q.hasInternationalExperience !== true ? 'Avval "Bor" tanlang' : 'Barchasi'}</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Xalqaro min yil</span>
              <input type="number" min={0} placeholder="masalan: 2" className={ctlInput}
                disabled={q.hasInternationalExperience !== true}
                value={q.internationalYearsMin ?? ''}
                onChange={(e) => setField({ internationalYearsMin: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          </div>

          {/* 5: Maosh, Yosh, Saralash, Tugmalar */}
          <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Maosh (min / max)</span>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" className={`${ctlInput} w-24`} value={q.salaryMin ?? ''} onChange={(e) => setField({ salaryMin: e.target.value ? Number(e.target.value) : undefined })} />
                <span className="text-xs text-text-muted">/</span>
                <input type="number" placeholder="Max" className={`${ctlInput} w-24`} value={q.salaryMax ?? ''} onChange={(e) => setField({ salaryMax: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Yosh (min / max)</span>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" className={`${ctlInput} w-20`} value={q.ageMin ?? ''} onChange={(e) => setField({ ageMin: e.target.value ? Number(e.target.value) : undefined })} />
                <span className="text-xs text-text-muted">/</span>
                <input type="number" placeholder="Max" className={`${ctlInput} w-20`} value={q.ageMax ?? ''} onChange={(e) => setField({ ageMax: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <div className="min-w-36">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Saralash</span>
              <input type="text" className={ctlInput} placeholder="createdAt,desc" value={q.sort ?? ''} onChange={(e) => setField({ sort: e.target.value })} />
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} onClick={applySearch}>
                <Search className="h-4 w-4" strokeWidth={2} aria-hidden />
                Qidirish
              </button>
              <button type="button" className={btnSecondary} onClick={clearFilters}>Tozalash</button>
            </div>
          </div>

        </div>
      </FilterPanel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="m-0">Nomzodlar</h2>
          <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-text-muted">
            {loading ? '...' : totalElements.toLocaleString('ru-RU')} ta
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Nomzod</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Hudud</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kasb</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tajriba</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tayyorlik</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Til</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Maosh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Xalqaro</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Profil</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Holat</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-text-muted">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center text-sm text-text-muted">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" aria-hidden />
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-sm text-text-muted">
                    Natija yo&apos;q
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => {
                  const href = candidateDetailHref(row);
                  const name = pickStr(row, 'full_name', 'fullName', 'name', 'first_name', 'firstName');
                  const phone = pickStr(row, 'phone', 'phone_number', 'phoneNumber', 'mobile');
                  const regionId = pickNum(row, 'region_id', 'regionId');
                  const region = pickStr(row, 'region_name_uz', 'region_name', 'regionName', 'region', 'address_region', 'addressRegion');
                  const regionLabel = region || (regionId != null ? `Hudud #${regionId}` : '-');
                  const profession = pickStr(row, 'profession_name', 'professionName', 'profession', 'profession_title');
                  const exp = pickStr(row, 'experience_range', 'experienceRange', 'experience');
                  const avail = pickStr(row, 'availability_status', 'availabilityStatus', 'availability');
                  const langRaw = pickStr(row, 'languages', 'primary_language', 'primaryLanguage', 'language');
                  const salMin = pickNum(row, 'salary_min', 'salaryMin', 'desired_salary_min', 'desiredSalaryMin');
                  const salMax = pickNum(row, 'salary_max', 'salaryMax', 'desired_salary_max', 'desiredSalaryMax');
                  const currency = pickStr(row, 'salary_currency', 'salaryCurrency') || 'USD';
                  const intlExp = row['international_experiences'];
                  let intlCell: React.ReactNode = <span className="text-text-muted">-</span>;
                  if (Array.isArray(intlExp) && intlExp.length > 0) {
                    intlCell = (
                      <span>
                        {intlExp.map((item: unknown) => {
                          if (!item || typeof item !== 'object') return '';
                          const o = item as Record<string, unknown>;
                          const code = String(o.country ?? o.countryCode ?? '').toUpperCase();
                          const found = COUNTRIES.find((c) => c.code === code);
                          return found ? `${found.flag} ${found.name}` : code;
                        }).filter(Boolean).join(', ')}
                      </span>
                    );
                  }
                  const score = pickNum(row, 'score', 'profile_score', 'profileScore');
                  const completeness = pickNum(row, 'profile_completeness', 'profileCompleteness');
                  const pStatus = pickStr(row, 'profile_status', 'profileStatus', 'status');
                  const rowKey = adminCandidateIdFromListRow(row) ?? `i-${rowIndex}`;

                  return (
                    <tr key={rowKey} className={`${rowElite} border-b border-border/80 transition-colors hover:bg-muted/25`}>
                      <td className="px-4 py-3">
                        {href ? (
                          <Link to={href} state={{ candidateListRow: row }}
                            className="group flex items-center gap-3 rounded-xl py-0.5 pr-1 text-left outline-none ring-primary/25 transition-colors hover:bg-primary/[0.06] focus-visible:ring-2"
                            title="Batafsil profil">
                            <CandidateAvatar row={row} name={name} phone={phone} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate text-sm font-semibold text-primary group-hover:underline">{name || 'Nomzod'}</span>
                                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary/70 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2} aria-hidden />
                              </div>
                              <div className="mono truncate text-xs text-text-muted">{phone || '-'}</div>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3">
                            <CandidateAvatar row={row} name={name} phone={phone} />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-text-primary">{name || 'Nomzod'}</div>
                              <div className="mono truncate text-xs text-text-muted">{phone || '-'}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">{regionLabel}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{profession || '-'}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{exp ? (experienceLabels[exp] ?? exp) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{avail ? (availabilityLabels[avail] ?? avail) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {langRaw.trim() ? (
                          <div className="flex flex-wrap gap-1.5">
                            {parseLanguageCodesFromCell(langRaw).map((code) => (
                              <span key={code} className="inline-flex items-center gap-1.5 rounded-full border border-border/90 bg-muted/40 px-2 py-0.5 text-xs font-medium text-text-primary shadow-[var(--elite-shadow-xs)]" title={languageLabelUz(code)}>
                                <LanguageIcon code={code} size={15} className="text-primary" />
                                <span>{languageLabelUz(code)}</span>
                              </span>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {salMin != null && salMax != null ? `${salMin.toLocaleString()} - ${salMax.toLocaleString()} ${currency}` : salMin != null ? `${salMin.toLocaleString()}+ ${currency}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">{intlCell}</td>
                      <td className="px-4 py-3"><ProfileMetrics score={score} completeness={completeness} /></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor(pStatus)}`}>
                          {pStatus ? uzOrCode(candidateProfileStatusUz, pStatus) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        {href ? (
                          <Link to={href} state={{ candidateListRow: row }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-primary/40 bg-primary/[0.08] px-2.5 py-1.5 text-xs font-semibold text-primary shadow-[var(--elite-shadow-xs)] transition-all hover:border-primary/55 hover:bg-primary/[0.12]"
                            title="Batafsil profil">
                            <UserRound className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                            <span>Batafsil</span>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-text-muted">-</span>
                        )}
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
