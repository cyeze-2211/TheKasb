import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router';
import { COUNTRIES } from '../data/mockData';
import {
  adminCandidateIdFromListRow,
  assignCandidateAgent,
  axiosErrorMessage,
  deleteCandidate,
  fetchCandidateById,
  parseAdminTargetCountries,
  pickCandidateField,
  pickNum,
  pickStr,
  updateCandidateProfileStatus,
  type AdminProfileStatus,
} from '../api/candidates';
import { fetchProfessionCategories, fetchProfessionsByCategory } from '../api/professions';
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  UserCog,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  btnPrimary,
  btnSecondary,
  ctlSelect,
  pageKicker,
  panelElite,
  panelEliteRaised,
} from '../components/pageChrome';
import { fetchAgentsForSelect, getUserDisplayName, type SdgUserDto } from '../api/users';
import {
  candidateProfileStatusUz,
  cefrLevelUz,
  documentTypeUz,
  educationLevelUz,
  maritalStatusUz,
  uzOrCode,
} from '../lib/adminUiUz';
import { LanguageIcon } from '../components/LanguageIcon';
import { languageLabelUz } from '../lib/languageUi';
import { countryFlagEmoji, countryNameUz } from '../lib/regionFlags';

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

function fmtDateTime(iso?: string): string {
  if (!iso?.trim()) return '—';
  try {
    return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs text-text-muted">{label}</div>
      <div className="text-sm text-text-primary">{children}</div>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-border/60 pb-6 last:border-0 last:pb-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-x-12">{children}</div>
    </section>
  );
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export function CandidateDetail() {
  const { id: idParam } = useParams();
  const candidateRouteId = (idParam ?? '').trim();
  const navigate = useNavigate();
  const location = useLocation();

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [statusSaving, setStatusSaving] = useState(false);
  const [agentIdInput, setAgentIdInput] = useState('');
  const [agentSaving, setAgentSaving] = useState(false);
  const [agents, setAgents] = useState<SdgUserDto[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [listFallbackNotice, setListFallbackNotice] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [categoryLabel, setCategoryLabel] = useState<string | null>(null);
  const [professionLabel, setProfessionLabel] = useState<string | null>(null);

  const listRowSnapshot = useMemo((): Record<string, unknown> | null => {
    const st = location.state as { candidateListRow?: Record<string, unknown> } | null;
    const r = st?.candidateListRow;
    if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
    if (Object.keys(r).length === 0) return null;
    const rowId = adminCandidateIdFromListRow(r);
    if (!candidateRouteId || !rowId) return null;
    if (String(rowId) !== String(candidateRouteId)) return null;
    return r;
  }, [location.state, candidateRouteId]);

  const load = useCallback(async () => {
    if (!candidateRouteId) {
      setErr('Noto‘g‘ri ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    setActionMsg(null);
    setListFallbackNotice(null);
    try {
      const d = await fetchCandidateById(candidateRouteId);
      if (d && Object.keys(d).length > 0) {
        setDetail(d);
        setListFallbackNotice(null);
        const ag = pickNum(d, 'agent_id', 'agentId', 'assigned_agent_id');
        if (ag != null) setAgentIdInput(String(ag));
      } else if (listRowSnapshot) {
        setDetail(listRowSnapshot);
        setErr(null);
        setListFallbackNotice(
          'To‘liq profil API dan kelmadi — ro‘yxatdagi ma’lumot ko‘rsatiladi. Sahifani yangilab ko‘ring.',
        );
        const ag = pickNum(listRowSnapshot, 'agent_id', 'agentId', 'assigned_agent_id');
        if (ag != null) setAgentIdInput(String(ag));
      } else {
        setDetail(null);
        setErr('Ma’lumot topilmadi.');
      }
    } catch (e) {
      if (listRowSnapshot) {
        setDetail(listRowSnapshot);
        setErr(null);
        setListFallbackNotice(
          axiosErrorMessage(e, 'Profilni yuklashda xato — ro‘yxatdagi ma’lumot ko‘rsatiladi.'),
        );
        const ag = pickNum(listRowSnapshot, 'agent_id', 'agentId', 'assigned_agent_id');
        if (ag != null) setAgentIdInput(String(ag));
      } else {
        setErr(axiosErrorMessage(e, 'Yuklashda xato.'));
        setDetail(null);
      }
    } finally {
      setLoading(false);
    }
  }, [candidateRouteId, listRowSnapshot]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!detail) {
      setCategoryLabel(null);
      setProfessionLabel(null);
      return;
    }
    const customName = pickStr(detail, 'custom_profession_name', 'customProfessionName');
    const catName = pickStr(detail, 'category_name', 'categoryName');
    const profName = pickStr(detail, 'profession_name', 'professionName');
    const catId = pickNum(detail, 'profession_category_id', 'professionCategoryId');
    const profId = pickNum(detail, 'profession_id', 'professionId');

    if (customName) setProfessionLabel(customName);
    else if (profName) setProfessionLabel(profName);
    else setProfessionLabel(null);

    if (catName) setCategoryLabel(catName);
    else setCategoryLabel(null);

    const needCatLookup = catId != null && !catName;
    const needProfLookup = catId != null && profId != null && !profName && !customName;
    if (!needCatLookup && !needProfLookup) return;

    let cancelled = false;
    void (async () => {
      try {
        if (needCatLookup) {
          const cats = await fetchProfessionCategories();
          const c = cats.find((x) => x.id === catId);
          if (!cancelled) setCategoryLabel(c ? c.name_uz || c.name_ru : `ID ${catId}`);
        }
        if (needProfLookup) {
          const profs = await fetchProfessionsByCategory(catId!);
          const p = profs.find((x) => x.id === profId);
          if (!cancelled) setProfessionLabel(p ? p.name_uz || p.name_ru : `ID ${profId}`);
        }
      } catch {
        if (!cancelled) {
          if (needCatLookup) setCategoryLabel(`ID ${catId}`);
          if (needProfLookup) setProfessionLabel(`ID ${profId}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detail]);

  useEffect(() => {
    const st = location.state as { candidateFocus?: string } | null;
    if (st?.candidateFocus === 'actions') {
      requestAnimationFrame(() => {
        document.getElementById('candidate-admin-actions')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;
    setAgentsLoading(true);
    void (async () => {
      try {
        const list = await fetchAgentsForSelect();
        if (!cancelled) setAgents(list);
      } catch {
        if (!cancelled) setAgents([]);
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!detail) return '';
    return pickStr(
      detail,
      'full_name',
      'fullName',
      'name',
      'first_name',
      'firstName',
    );
  }, [detail]);

  const phone = useMemo(
    () => (detail ? pickStr(detail, 'phone', 'phone_number', 'phoneNumber', 'mobile') : ''),
    [detail],
  );

  const linkedUserId = useMemo(
    () => (detail ? pickNum(detail, 'user_id', 'userId') : undefined),
    [detail],
  );

  const region = useMemo(
    () =>
      detail
        ? pickStr(
            detail,
            'region_name_uz',
            'regionNameUz',
            'region_name',
            'regionName',
            'region',
            'address_region',
            'addressRegion',
          )
        : '',
    [detail],
  );

  const profileStatus = useMemo(
    () =>
      detail
        ? pickStr(detail, 'profile_status', 'profileStatus', 'candidate_status', 'status')
        : '',
    [detail],
  );

  const isActiveProfile = profileStatus === 'ACTIVE';

  async function handleStatusToggle(checked: boolean) {
    if (!candidateRouteId) return;
    setStatusSaving(true);
    setActionMsg(null);
    const next: AdminProfileStatus = checked ? 'ACTIVE' : 'SUSPENDED';
    try {
      await updateCandidateProfileStatus(candidateRouteId, next);
      await load();
      setActionMsg(checked ? 'Profil faollashtirildi.' : 'Profil to‘xtatildi.');
    } catch (e) {
      setActionMsg(axiosErrorMessage(e, 'Holatni saqlab bo‘lmadi.'));
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleAssignAgent() {
    if (!candidateRouteId) return;
    const n = Number(agentIdInput.trim());
    if (!Number.isFinite(n) || n <= 0) {
      setActionMsg('Agent ID musbat son bo‘lishi kerak.');
      return;
    }
    setAgentSaving(true);
    setActionMsg(null);
    try {
      await assignCandidateAgent(candidateRouteId, n);
      await load();
      setActionMsg('Agent biriktirildi.');
    } catch (e) {
      setActionMsg(axiosErrorMessage(e, 'Agent biriktirishda xato.'));
    } finally {
      setAgentSaving(false);
    }
  }

  async function handleDeleteCandidate() {
    if (!candidateRouteId) return;
    setDeleting(true);
    setDeleteErr(null);
    try {
      await deleteCandidate(candidateRouteId);
      setDeleteOpen(false);
      navigate('/admin/candidates', { replace: true });
    } catch (e) {
      setDeleteErr(axiosErrorMessage(e, 'O‘chirishda xato.'));
    } finally {
      setDeleting(false);
    }
  }

  const languages = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'languages', 'language_items') : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const targetCountryRows = useMemo(() => {
    if (!detail) return [];
    const raw = pickCandidateField(
      detail,
      'target_countries',
      'targetCountries',
      'country_codes',
      'targetCountryCodes',
    );
    return parseAdminTargetCountries(raw);
  }, [detail]);

  const educations = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'educations', 'education_items') : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const skills = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'skills', 'skill_items') : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const documents = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'documents', 'document_items') : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const workExperiences = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'work_experiences', 'workExperiences') : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const tabs = [
    { id: 'basic', label: 'Asosiy' },
    { id: 'languages', label: `Tillar (${languages.length})` },
    { id: 'countries', label: `Mamlakatlar (${targetCountryRows.length})` },
    { id: 'education', label: `Ta’lim (${educations.length})` },
    { id: 'work', label: `Ish tajribasi (${workExperiences.length})` },
    { id: 'skills', label: `Ko‘nikmalar (${skills.length})` },
    { id: 'documents', label: `Hujjatlar (${documents.length})` },
  ];

  if (loading && !detail) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Yuklanmoqda…</p>
      </div>
    );
  }

  if (err && !detail) {
    return (
      <div className="space-y-4 p-6 md:p-8">
        <p className={`${pageKicker} mb-1`}>The Kasb · Profil</p>
        <p className="text-sm text-danger">{err}</p>
        <Link to="/admin/candidates" className="text-sm font-medium text-primary hover:underline">
          Ro‘yxatga qaytish
        </Link>
      </div>
    );
  }

  if (!detail) return null;

  const exp = pickStr(detail, 'experience_range', 'experienceRange', 'experience');
  const avail = pickStr(detail, 'availability_status', 'availabilityStatus', 'availability');
  const salMin = pickNum(
    detail,
    'salary_min',
    'salaryMin',
    'expected_salary_min',
    'desired_salary_min',
    'desiredSalaryMin',
  );
  const salMax = pickNum(
    detail,
    'salary_max',
    'salaryMax',
    'expected_salary_max',
    'desired_salary_max',
    'desiredSalaryMax',
  );
  const currency = pickStr(detail, 'currency', 'salary_currency', 'salaryCurrency') || 'USD';
  const score = pickNum(detail, 'score', 'profile_score', 'profileScore');
  const categoryDisplay = categoryLabel ?? pickStr(detail, 'category_name', 'categoryName', 'category');
  const professionDisplay =
    professionLabel ?? pickStr(detail, 'profession_name', 'professionName', 'profession');
  const registeredAt = pickStr(detail, 'created_at', 'createdAt', 'registered_at', 'registeredAt');
  const lastLogin = pickStr(detail, 'last_login_at', 'lastLoginAt', 'last_login', 'lastLogin');
  const dateBirth = pickStr(detail, 'date_birth', 'dateBirth');
  const marital = pickStr(detail, 'marital_status', 'maritalStatus');
  const eduLevel = pickStr(detail, 'education_level', 'educationLevel');
  const dataConsentRaw = pickCandidateField(detail, 'data_consent', 'dataConsent');
  const dataConsentAt = pickStr(detail, 'data_consent_at', 'dataConsentAt');
  const updatedAt = pickStr(detail, 'updated_at', 'updatedAt');
  const completenessPct = pickNum(detail, 'profile_completeness', 'profileCompleteness');
  const profileId = pickStr(detail, 'id');
  const regionId = pickNum(detail, 'region_id', 'regionId');
  const categoryId = pickNum(detail, 'profession_category_id', 'professionCategoryId');
  const professionId = pickNum(detail, 'profession_id', 'professionId');
  const customProfessionId = pickStr(detail, 'custom_profession_id', 'customProfessionId');
  const customProfessionName = pickStr(detail, 'custom_profession_name', 'customProfessionName');
  const experienceYears = pickNum(detail, 'experience_years', 'experienceYears');
  const agentId = pickNum(detail, 'agent_id', 'agentId', 'assigned_agent_id');
  const agentNotes = pickStr(detail, 'agent_notes', 'agentNotes');
  const assignedAgent = agentId != null ? agents.find((a) => a.id === agentId) : undefined;

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <p className={`${pageKicker} mb-1`}>The Kasb · Profil</p>
      <nav className="text-sm text-text-muted" aria-label="Breadcrumb">
        <Link to="/admin/candidates" className="text-primary hover:underline">
          Nomzodlar
        </Link>
        <span className="mx-1.5 text-text-muted">/</span>
        <span className="text-text-primary">
          {displayName || phone || 'Nomzod'}
        </span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <UserRound className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
              Nomzod profili
            </h1>
            <p className="truncate text-xs text-text-muted">
              Ko‘rish, holat va agentni boshqarish, bog‘langan akkaunt
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {linkedUserId != null && linkedUserId > 0 ? (
            <Link
              to={`/admin/users/${linkedUserId}`}
              className={`${btnSecondary} inline-flex items-center gap-2`}
            >
              Foydalanuvchi kartasi
            </Link>
          ) : null}
          <button
            type="button"
            className={`${btnSecondary} inline-flex items-center gap-2`}
            onClick={() =>
              document.getElementById('candidate-admin-actions')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
          >
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
            Tahrirlash
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-danger/70 bg-surface px-4 text-sm font-medium text-danger shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:bg-danger hover:text-white"
            onClick={() => {
              setDeleteErr(null);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            O‘chirish
          </button>
        </div>
      </div>

      {actionMsg ? (
        <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-2 text-sm text-text-primary">
          {actionMsg}
        </div>
      ) : null}

      {listFallbackNotice ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-sm text-text-primary">
          {listFallbackNotice}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="w-full max-w-sm flex-shrink-0 lg:w-80">
          <div className={`${panelEliteRaised} sticky top-6 space-y-4 p-6`}>
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <div
                  className="absolute -inset-1 rounded-full bg-primary/25 blur-lg motion-reduce:blur-none"
                  aria-hidden
                />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/10 text-3xl font-bold text-primary ring-2 ring-primary/25 ring-offset-2 ring-offset-background">
                  {initialsFromName(displayName) || '∑'}
                </div>
              </div>
              <h2 className="mb-1 text-center">{displayName || '—'}</h2>
              <div className="mono mb-1 text-sm text-text-muted">{phone || '—'}</div>
              <div className="flex items-center justify-center gap-1.5 text-sm text-text-muted">
                <MapPin className="h-4 w-4 flex-shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                {region || '—'}
              </div>
            </div>

            <div id="candidate-admin-actions" className="scroll-mt-24 space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-background/80 px-4 py-3 shadow-[var(--elite-shadow-xs)] transition-colors duration-300 hover:border-primary/20">
                <div className="min-w-0 space-y-0.5">
                  <Label htmlFor="profile-active" className="text-sm font-medium text-text-primary">
                    Profil faol
                  </Label>
                  <p className="text-xs text-text-muted">O‘chiq — profil to‘xtatilgan; yoqilgan — faol.</p>
                </div>
                <Switch
                  id="profile-active"
                  checked={isActiveProfile}
                  disabled={statusSaving}
                  onCheckedChange={(c) => void handleStatusToggle(c)}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>

              <div className="rounded-xl border border-border/80 bg-background/80 px-4 py-3 shadow-[var(--elite-shadow-xs)]">
                <Label className="mb-2 flex items-center gap-2 text-xs text-text-muted">
                  <UserCog className="h-3.5 w-3.5" aria-hidden />
                  Agent biriktirish
                </Label>
                <div className="flex gap-2">
                  <select
                    className={`${ctlSelect} min-w-0 flex-1`}
                    value={agentIdInput}
                    disabled={agentSaving || agentsLoading}
                    onChange={(e) => setAgentIdInput(e.target.value)}
                  >
                    <option value="">— Agent tanlang —</option>
                    {agentIdInput &&
                    !agents.some((a) => String(a.id) === agentIdInput) ? (
                      <option value={agentIdInput}>
                        ID {agentIdInput} (joriy / ro‘yxatda yo‘q)
                      </option>
                    ) : null}
                    {agents.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {getUserDisplayName(a)}
                        {a.phoneNumber ? ` · ${a.phoneNumber}` : ''} (ID {a.id})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    disabled={agentSaving}
                    onClick={() => void handleAssignAgent()}
                    className="shrink-0"
                  >
                    {agentSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Saqlash'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 border-t border-border pt-4 text-sm">
              {profileId ? (
                <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Profil ID</div>
                  <div className="mt-0.5 break-all font-mono text-xs text-text-primary">{profileId}</div>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-text-muted" strokeWidth={2} aria-hidden />
                <span className="text-text-muted">Ro‘yxatdan:</span>
                <span className="text-text-primary">{fmtDateTime(registeredAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0 text-text-muted" strokeWidth={2} aria-hidden />
                <span className="text-text-muted">Oxirgi kirish:</span>
                <span className="text-text-primary">{fmtDateTime(lastLogin)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                Holat:{' '}
                <span className="font-medium text-text-primary">
                  {profileStatus ? uzOrCode(candidateProfileStatusUz, profileStatus) : '—'}
                </span>
              </div>
              {score != null ? (
                <div className="text-xs text-text-muted">
                  Ball: <span className="font-semibold tabular-nums text-text-primary">{score}%</span>
                  {completenessPct != null ? (
                    <>
                      {' · '}To‘liqlik:{' '}
                      <span className="font-semibold tabular-nums text-text-primary">{completenessPct}%</span>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className={`${btnPrimary} h-10 w-full shadow-md shadow-primary/20 transition-[box-shadow,transform] duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.99]`}
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ma’lumotni yangilash'}
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={panelElite}>
            <div className="flex overflow-x-auto border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-5 py-4 text-sm font-medium transition-all duration-300 ease-out ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary bg-primary/[0.06] text-primary'
                      : 'border-b-2 border-transparent text-text-muted hover:bg-muted/50 hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="animate-in fade-in p-6 duration-300" key={activeTab}>
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-x-12">
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Kategoriya</div>
                    <div className="text-sm text-text-primary">{categoryDisplay || '—'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Kasb</div>
                    <div className="text-sm text-text-primary">{professionDisplay || customProfessionName || '—'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Tajriba</div>
                    <div className="text-sm text-text-primary">
                      {exp ? experienceLabels[exp] ?? exp : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Mavjudlik</div>
                    <div className="text-sm text-text-primary">
                      {avail ? availabilityLabels[avail] ?? avail : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Maosh kutishi</div>
                    <div className="text-sm text-text-primary">
                      {salMin != null && salMax != null
                        ? `${salMin.toLocaleString()} – ${salMax.toLocaleString()} ${currency}`
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Ball</div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-success transition-all duration-500"
                          style={{ width: `${Math.min(100, score ?? 0)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-text-primary">{score ?? 0}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Profil to‘liqligi</div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-sky-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, completenessPct ?? 0)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-text-primary tabular-nums">
                        {completenessPct ?? 0}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Tug‘ilgan sana</div>
                    <div className="text-sm text-text-primary">{dateBirth || '—'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Oilaviy holat</div>
                    <div className="text-sm text-text-primary">
                      {marital ? uzOrCode(maritalStatusUz, marital) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Ta’lim darajasi (profil)</div>
                    <div className="text-sm text-text-primary">
                      {eduLevel ? uzOrCode(educationLevelUz, eduLevel) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Ma’lumotlar roziligi</div>
                    <div className="text-sm text-text-primary">
                      {typeof dataConsentRaw === 'boolean' ? (dataConsentRaw ? 'Ha' : 'Yo‘q') : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Oxirgi yangilanish</div>
                    <div className="text-sm text-text-primary">{fmtDateTime(updatedAt)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Profil ID</div>
                    <div className="break-all font-mono text-xs text-text-primary">{profileId || '—'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Foydalanuvchi ID</div>
                    <div className="text-sm text-text-primary">
                      {linkedUserId != null && linkedUserId > 0 ? (
                        <Link to={`/admin/users/${linkedUserId}`} className="text-primary hover:underline">
                          {linkedUserId}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Viloyat ID</div>
                    <div className="text-sm text-text-primary">{regionId != null ? regionId : '—'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Kategoriya ID</div>
                    <div className="text-sm text-text-primary">{categoryId != null ? categoryId : '—'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Kasb ID</div>
                    <div className="text-sm text-text-primary">{professionId != null ? professionId : '—'}</div>
                  </div>
                  {customProfessionId || customProfessionName ? (
                    <div>
                      <div className="mb-1 text-xs text-text-muted">Maxsus kasb</div>
                      <div className="text-sm text-text-primary">
                        {customProfessionName || '—'}
                        {customProfessionId ? (
                          <span className="mt-1 block font-mono text-xs text-text-muted">{customProfessionId}</span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Tajriba (yil)</div>
                    <div className="text-sm text-text-primary">
                      {experienceYears != null ? `${experienceYears} yil` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Profil holati</div>
                    <div className="text-sm text-text-primary">
                      {profileStatus ? uzOrCode(candidateProfileStatusUz, profileStatus) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Agent</div>
                    <div className="text-sm text-text-primary">
                      {assignedAgent
                        ? `${getUserDisplayName(assignedAgent)} (ID ${agentId})`
                        : agentId != null
                          ? `ID ${agentId}`
                          : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Agent izohi</div>
                    <div className="text-sm text-text-primary">{agentNotes || '—'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Rozilik vaqti</div>
                    <div className="text-sm text-text-primary">{fmtDateTime(dataConsentAt)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Yaratilgan</div>
                    <div className="text-sm text-text-primary">{fmtDateTime(registeredAt)}</div>
                  </div>
                </div>
              )}

              {activeTab === 'languages' && (
                <div className="space-y-4">
                  {languages.length === 0 ? (
                    <p className="text-sm text-text-muted">Tillar ro‘yxati yo‘q.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {languages.map((lang, i) => {
                        const L = lang as Record<string, unknown>;
                        const rowId = pickStr(L, 'id') || `lang-${i}`;
                        const code = pickStr(L, 'language', 'lang', 'code');
                        const level = pickStr(L, 'level', 'language_level', 'languageLevel');
                        const cert = pickCandidateField(L, 'has_certificate', 'hasCertificate', 'certified');
                        return (
                          <div
                            key={rowId}
                            className="flex gap-4 rounded-2xl border border-border/80 bg-gradient-to-br from-muted/30 to-transparent p-4 shadow-[var(--elite-shadow-xs)] transition-colors hover:border-primary/25"
                          >
                            <div
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface shadow-inner ring-1 ring-border/60"
                              aria-hidden
                            >
                              <LanguageIcon code={code} size={30} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="text-base font-semibold text-text-primary">
                                {code ? languageLabelUz(code) : '—'}
                              </div>
                              {rowId && !rowId.startsWith('lang-') ? (
                                <p className="font-mono text-[10px] text-text-muted">{rowId}</p>
                              ) : null}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                  {level ? uzOrCode(cefrLevelUz, level) : '—'}
                                </span>
                                {typeof cert === 'boolean' ? (
                                  <span
                                    className={`inline-flex items-center gap-1 text-xs font-medium ${cert ? 'text-success' : 'text-text-muted'}`}
                                  >
                                    {cert ? (
                                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                    ) : (
                                      <XCircle className="h-3.5 w-3.5 opacity-70" aria-hidden />
                                    )}
                                    Sertifikat: {cert ? 'bor' : 'yo‘q'}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'countries' && (
                <div className="space-y-3">
                  {targetCountryRows.length === 0 ? (
                    <p className="text-sm text-text-muted">Maqsad mamlakatlar kiritilmagan.</p>
                  ) : (
                    <ul className="space-y-2">
                      {targetCountryRows.map((row) => {
                        const label =
                          row.nameUz ||
                          row.nameRu ||
                          COUNTRIES.find((c) => c.code === row.countryCode)?.name ||
                          countryNameUz(row.countryCode) ||
                          row.countryCode;
                        const flag = row.flagEmoji || countryFlagEmoji(row.countryCode);
                        const salaryStr =
                          row.salaryMin != null && row.salaryMax != null
                            ? `${row.salaryMin.toLocaleString('ru-RU')}–${row.salaryMax.toLocaleString('ru-RU')} ${row.salaryCurrency}${row.salarySymbol ? ` (${row.salarySymbol})` : ''}`
                            : null;
                        return (
                          <li
                            key={row.rowId}
                            className="flex items-center gap-4 rounded-2xl border border-border/80 bg-muted/20 px-4 py-3 transition-all hover:border-primary/30 hover:bg-muted/35"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-bold text-primary tabular-nums">
                              {row.priority}
                            </div>
                            <span className="text-2xl leading-none" aria-hidden>
                              {flag}
                            </span>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="text-sm font-semibold text-text-primary">{label}</div>
                              <div className="text-xs text-text-muted">
                                {row.countryCode}
                                {row.nameRu && row.nameUz && row.nameRu !== row.nameUz
                                  ? ` · ${row.nameRu}`
                                  : ''}
                              </div>
                              {salaryStr ? (
                                <div className="text-xs font-medium text-text-primary">{salaryStr}</div>
                              ) : null}
                              {row.languageReq ? (
                                <div className="text-xs text-text-muted">Til talabi: {row.languageReq}</div>
                              ) : null}
                              {row.note ? <div className="text-xs text-text-muted">{row.note}</div> : null}
                              {row.isActive === false ? (
                                <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                  Nofaol
                                </span>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'education' && (
                <div className="space-y-3">
                  {educations.length === 0 ? (
                    <p className="text-sm text-text-muted">Ta’lim yozuvlari yo‘q.</p>
                  ) : (
                    educations.map((ed, i) => {
                      const E = ed as Record<string, unknown>;
                      const eid = pickStr(E, 'id') || `ed-${i}`;
                      const level = pickStr(E, 'level');
                      const specialty = pickStr(E, 'specialty');
                      const institution = pickStr(E, 'institution_name', 'institutionName');
                      const country = pickStr(E, 'country');
                      const year = pickNum(E, 'graduation_year', 'graduationYear');
                      return (
                        <div
                          key={eid}
                          className="rounded-2xl border border-border/80 bg-surface/80 p-4 shadow-[var(--elite-shadow-xs)]"
                        >
                          <div className="mb-2 flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                              <GraduationCap className="h-5 w-5" strokeWidth={2} aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="text-sm font-semibold text-text-primary">
                                {specialty || 'Mutaxassislik ko‘rsatilmagan'}
                              </div>
                              <div className="text-xs text-text-muted">
                                {level ? uzOrCode(educationLevelUz, level) : '—'}
                                {year != null ? ` · ${year}` : ''}
                                {country ? (
                                  <>
                                    {' · '}
                                    <span className="inline-flex items-center gap-1">
                                      <span aria-hidden>{countryFlagEmoji(country)}</span>
                                      <span>{countryNameUz(country) ?? country}</span>
                                    </span>
                                  </>
                                ) : null}
                              </div>
                              {institution ? (
                                <div className="text-sm text-text-primary">{institution}</div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'work' && (
                <div className="space-y-3">
                  {workExperiences.length === 0 ? (
                    <p className="text-sm text-text-muted">Ish tajribasi kiritilmagan.</p>
                  ) : (
                    workExperiences.map((wx, i) => {
                      const W = wx as Record<string, unknown>;
                      const wid = pickStr(W, 'id') || `wx-${i}`;
                      const title = pickStr(W, 'position', 'title', 'job_title', 'jobTitle', 'employer_name');
                      const org = pickStr(W, 'company', 'organization', 'employer');
                      const period = pickStr(W, 'period', 'duration', 'start_date', 'startDate');
                      const desc = pickStr(W, 'description', 'responsibilities');
                      return (
                        <div
                          key={wid}
                          className="rounded-2xl border border-border/80 bg-muted/15 p-4 shadow-[var(--elite-shadow-xs)]"
                        >
                          <div className="flex gap-3">
                            <Briefcase className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                            <div className="min-w-0 space-y-1">
                              <div className="text-sm font-semibold text-text-primary">{title || '—'}</div>
                              {org ? <div className="text-sm text-text-muted">{org}</div> : null}
                              {period ? <div className="text-xs text-text-muted">{period}</div> : null}
                              {desc ? <p className="mt-2 text-sm leading-relaxed text-text-primary">{desc}</p> : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 ? (
                    <p className="text-sm text-text-muted">Ko‘nikmalar ro‘yxati bo‘sh.</p>
                  ) : (
                    skills.map((sk, i) => {
                      const S = sk as Record<string, unknown>;
                      const sid = pickStr(S, 'id') || `sk-${i}`;
                      const name = pickStr(S, 'skill_name', 'skillName', 'name');
                      const verified = pickCandidateField(S, 'is_verified', 'isVerified');
                      const v = verified === true;
                      return (
                        <span
                          key={sid}
                          className="inline-flex items-center gap-2 rounded-full border border-border/90 bg-surface px-3 py-1.5 text-sm font-medium text-text-primary shadow-[var(--elite-shadow-xs)]"
                        >
                          <Award className="h-3.5 w-3.5 text-amber-600/90" strokeWidth={2} aria-hidden />
                          {name || '—'}
                          {typeof verified === 'boolean' ? (
                            v ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                            ) : (
                              <span className="text-[10px] font-normal text-text-muted">tekshirilmagan</span>
                            )
                          ) : null}
                        </span>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <p className="text-sm text-text-muted">Hujjatlar yo‘q.</p>
                  ) : (
                    documents.map((doc, i) => {
                      const D = doc as Record<string, unknown>;
                      const did = pickStr(D, 'id') || `doc-${i}`;
                      const docType = pickStr(D, 'document_type', 'documentType');
                      const fileUrl = pickStr(D, 'file_url', 'fileUrl');
                      const fileName = pickStr(D, 'file_name', 'fileName');
                      const uploaded = pickStr(D, 'uploaded_at', 'uploadedAt');
                      const expires = pickStr(D, 'expires_at', 'expiresAt');
                      const verified = pickCandidateField(D, 'is_verified', 'isVerified');
                      const v = verified === true;
                      return (
                        <div
                          key={did}
                          className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <FileText className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-text-primary">
                                {docType ? uzOrCode(documentTypeUz, docType) : fileName || 'Hujjat'}
                              </div>
                              {fileName ? (
                                <div className="truncate text-xs text-text-muted">{fileName}</div>
                              ) : null}
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted">
                                {uploaded ? <span>Yuklangan: {uploaded}</span> : null}
                                {expires ? <span>Muddati: {expires}</span> : null}
                                {typeof verified === 'boolean' ? (
                                  <span className={v ? 'text-success' : ''}>
                                    {v ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${btnSecondary} inline-flex shrink-0 items-center gap-2 self-start sm:self-center`}
                            >
                              <Link2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                              Ochish
                            </a>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteErr(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu nomzodni o‘chirish?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <strong className="text-text-primary">{displayName || phone || 'Nomzod'}</strong> — barcha
                bog‘langan profil ma’lumotlari o‘chiriladi.
              </span>
              {deleteErr ? <span className="block text-sm text-danger">{deleteErr}</span> : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDeleteCandidate()}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Ha, o‘chirish
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
