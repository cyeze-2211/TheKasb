import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router';
import {
  adminCandidateIdFromListRow,
  assignCandidateAgent,
  axiosErrorMessage,
  deleteCandidate,
  fetchCandidateById,
  fetchCandidateCvHtml,
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
  Printer,
  RefreshCw,
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

// Helper to unwrap API response if it contains { success: true, object: ... }
function unwrapApiResponse(data: unknown): Record<string, unknown> {
  if (data && typeof data === 'object' && 'success' in data && data.success === true && 'object' in data) {
    return (data as { object: Record<string, unknown> }).object;
  }
  return data as Record<string, unknown>;
}

const experienceLabels: Record<string, string> = {
  YEAR_1_3: '1-3 yil',
  YEAR_3_5: '3-5 yil',
  YEAR_5_PLUS: '5+ yil',
  LESS_THAN_1_YEAR: '1 yildan kam',
  NO_EXPERIENCE: 'Tajribasiz',
};

const availabilityLabels: Record<string, string> = {
  READY_NOW: 'Hozir tayyor',
  WITHIN_1_MONTH: '1 oy ichida',
  WITHIN_3_MONTHS: '3 oy ichida',
  WITHIN_6_MONTHS: '6 oy ichida',
  IMMEDIATELY: 'Darhol',
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

function Avatar({ name, size = 96 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (initials) {
    return (
      <div
        style={{ width: size, height: size, fontSize: size * 0.33 }}
        className="flex items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 font-bold text-primary ring-2 ring-primary/25 ring-offset-2 ring-offset-background"
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-muted/60 to-muted/30 ring-2 ring-border/40 ring-offset-2 ring-offset-background"
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-text-muted opacity-60"
      >
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" opacity="0.7" />
      </svg>
    </div>
  );
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

  const [cvHtml, setCvHtml] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [cvPrintLoading, setCvPrintLoading] = useState(false);

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
      setErr("Notoʻgʻri ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    setActionMsg(null);
    setListFallbackNotice(null);
    try {
      const rawData = await fetchCandidateById(candidateRouteId);
      // Unwrap if the API returns { success: true, object: ... }
      const unwrapped = unwrapApiResponse(rawData);
      if (unwrapped && Object.keys(unwrapped).length > 0) {
        setDetail(unwrapped);
        setListFallbackNotice(null);
        const ag = pickNum(unwrapped, 'agent_id', 'agentId', 'assigned_agent_id');
        if (ag != null) setAgentIdInput(String(ag));
      } else if (listRowSnapshot) {
        setDetail(listRowSnapshot);
        setErr(null);
        setListFallbackNotice(
          "To'liq profil API dan kelmadi — ro'yxatdagi ma'lumot ko'rsatiladi. Sahifani yangilab ko'ring.",
        );
        const ag = pickNum(listRowSnapshot, 'agent_id', 'agentId', 'assigned_agent_id');
        if (ag != null) setAgentIdInput(String(ag));
      } else {
        setDetail(null);
        setErr("Ma'lumot topilmadi.");
      }
    } catch (e) {
      if (listRowSnapshot) {
        setDetail(listRowSnapshot);
        setErr(null);
        setListFallbackNotice(
          axiosErrorMessage(e, "Profilni yuklashda xato — ro'yxatdagi ma'lumot ko'rsatiladi."),
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

  useEffect(() => {
    if (activeTab !== 'cv' || !candidateRouteId) return;
    if (cvHtml !== null) return;
    let cancelled = false;
    setCvLoading(true);
    setCvError(null);
    void (async () => {
      try {
        const html = await fetchCandidateCvHtml(candidateRouteId);
        if (!cancelled) setCvHtml(html);
      } catch (e) {
        if (!cancelled) setCvError(axiosErrorMessage(e, 'CV yuklanmadi.'));
      } finally {
        if (!cancelled) setCvLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, candidateRouteId, cvHtml]);

  const displayName = useMemo(() => {
    if (!detail) return '';
    const full = pickStr(detail, 'full_name', 'fullName', 'name');
    if (full) return full;
    const first = pickStr(detail, 'first_name', 'firstName');
    const last = pickStr(detail, 'last_name', 'lastName');
    if (first || last) return [first, last].filter(Boolean).join(' ');
    return '';
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
      setActionMsg(checked ? "Profil faollashtirildi." : "Profil to'xtatildi.");
    } catch (e) {
      setActionMsg(axiosErrorMessage(e, "Holatni saqlab bo'lmadi."));
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleAssignAgent() {
    if (!candidateRouteId) return;
    const n = Number(agentIdInput.trim());
    if (!Number.isFinite(n) || n <= 0) {
      setActionMsg("Agent ID musbat son bo'lishi kerak.");
      return;
    }
    setAgentSaving(true);
    setActionMsg(null);
    try {
      await assignCandidateAgent(candidateRouteId, n);
      await load();
      setActionMsg("Agent biriktirildi.");
    } catch (e) {
      setActionMsg(axiosErrorMessage(e, "Agent biriktirishda xato."));
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
      setDeleteErr(axiosErrorMessage(e, "O'chirishda xato."));
    } finally {
      setDeleting(false);
    }
  }

  function handleCvPrint() {
    if (!cvHtml) return;
    setCvPrintLoading(true);
    try {
      const win = window.open('', '_blank');
      if (!win) {
        setCvError("Yangi oyna ochilmadi. Pop-up blokerini tekshiring.");
        return;
      }
      win.document.write(`<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CV — ${displayName || 'Nomzod'}</title>
  <style>
    @media print {
      body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>${cvHtml}</body>
</html>`);
      win.document.close();
      win.addEventListener('load', () => {
        setTimeout(() => {
          win.focus();
          win.print();
        }, 300);
      });
    } finally {
      setCvPrintLoading(false);
    }
  }

  // Data extraction from detail (already unwrapped)
  const languages = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'languages') : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const targetCountryRows = useMemo(() => {
    if (!detail) return [];
    const raw = pickCandidateField(detail, 'target_countries', 'targetCountries');
    return parseAdminTargetCountries(raw);
  }, [detail]);

  const educations = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'educations') : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const skills = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'skills') : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const documents = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'documents') : undefined;
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
    { id: 'education', label: `Ta'lim (${educations.length})` },
    { id: 'work', label: `Ish tajribasi (${workExperiences.length})` },
    { id: 'skills', label: `Ko'nikmalar (${skills.length})` },
    { id: 'documents', label: `Hujjatlar (${documents.length})` },
    { id: 'cv', label: 'CV' },
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
          Ro'yxatga qaytish
        </Link>
      </div>
    );
  }

  if (!detail) return null;

  const exp = pickStr(detail, 'experience_range', 'experienceRange', 'experience');
  const avail = pickStr(detail, 'availability_status', 'availabilityStatus', 'availability');
  const salMin = pickNum(detail, 'salary_min', 'salaryMin', 'expected_salary_min', 'desired_salary_min', 'desiredSalaryMin');
  const salMax = pickNum(detail, 'salary_max', 'salaryMax', 'expected_salary_max', 'desired_salary_max', 'desiredSalaryMax');
  const currency = pickStr(detail, 'currency', 'salary_currency', 'salaryCurrency') || 'USD';
  const score = pickNum(detail, 'score', 'profile_score', 'profileScore');
  const categoryDisplay = categoryLabel ?? pickStr(detail, 'category_name', 'categoryName', 'category');
  const professionDisplay = professionLabel ?? pickStr(detail, 'profession_name', 'professionName', 'profession');
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
        <span className="text-text-primary">{displayName || phone || 'Nomzod'}</span>
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
              Ko'rish, holat va agentni boshqarish, bog'langan akkaunt
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
            O'chirish
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
                <div className="relative">
                  <Avatar name={displayName} size={96} />
                </div>
              </div>
              <h2 className="mb-1 text-center">{displayName || phone || 'Nomzod'}</h2>
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
                  <p className="text-xs text-text-muted">O'chiq — profil to'xtatilgan; yoqilgan — faol.</p>
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
                    {agentIdInput && !agents.some((a) => String(a.id) === agentIdInput) ? (
                      <option value={agentIdInput}>
                        ID {agentIdInput} (joriy / ro'yxatda yo'q)
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
                <span className="text-text-muted">Ro'yxatdan:</span>
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
                      {' · '}To'liqlik:{' '}
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ma'lumotni yangilash"}
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
              {/* ========== BASIC TAB ========== */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-x-12">
                  <ProfileField label="To‘liq ism">{displayName || '—'}</ProfileField>
                  <ProfileField label="Telefon">{phone || '—'}</ProfileField>
                  <ProfileField label="Tug‘ilgan sana">{dateBirth || '—'}</ProfileField>
                  <ProfileField label="Oilaviy holat">
                    {marital ? uzOrCode(maritalStatusUz, marital) : '—'}
                  </ProfileField>
                  <ProfileField label="Viloyat / Tuman">
                    {region ? `${region} / ${pickStr(detail, 'district_name_uz', 'districtNameUz') || '—'}` : '—'}
                  </ProfileField>
                  <ProfileField label="Ta’lim darajasi">
                    {eduLevel ? uzOrCode(educationLevelUz, eduLevel) : '—'}
                  </ProfileField>
                  <ProfileField label="Ish tajribasi">
                    {exp ? experienceLabels[exp] || exp : (experienceYears ? `${experienceYears} yil` : '—')}
                  </ProfileField>
                  <ProfileField label="Mavjudlik">
                    {avail ? availabilityLabels[avail] || avail : '—'}
                  </ProfileField>
                  <ProfileField label="Kutilayotgan maosh">
                    {salMin != null && salMax != null
                      ? `${salMin.toLocaleString()} – ${salMax.toLocaleString()} ${currency}`
                      : salMin != null
                      ? `${salMin.toLocaleString()} ${currency}`
                      : salMax != null
                      ? `≤ ${salMax.toLocaleString()} ${currency}`
                      : '—'}
                  </ProfileField>
                  <ProfileField label="Kasb sohasi">{categoryDisplay || '—'}</ProfileField>
                  <ProfileField label="Kasb / mutaxassislik">
                    {professionDisplay || customProfessionName || '—'}
                  </ProfileField>
                  <ProfileField label="Agent">
                    {assignedAgent ? getUserDisplayName(assignedAgent) : agentId ? `ID ${agentId}` : 'Biriktirilmagan'}
                  </ProfileField>
                  {agentNotes && (
                    <ProfileField label="Agent eslatmasi">{agentNotes}</ProfileField>
                  )}
                  <ProfileField label="Profil to‘liqlik foizi">
                    {completenessPct != null ? `${completenessPct}%` : '—'}
                  </ProfileField>
                  <ProfileField label="Ma’lumotlarga rozilik">
                    {dataConsentRaw === true ? 'Ha' : dataConsentRaw === false ? "Yo‘q" : '—'}
                    {dataConsentAt && ` (${fmtDateTime(dataConsentAt)})`}
                  </ProfileField>
                  <ProfileField label="Oxirgi yangilanish">{fmtDateTime(updatedAt)}</ProfileField>
                </div>
              )}

              {/* ========== LANGUAGES TAB ========== */}
              {activeTab === 'languages' && (
                <div className="space-y-3">
                  {languages.length === 0 ? (
                    <p className="text-sm text-text-muted">Tillar maʼlumoti yo‘q.</p>
                  ) : (
                    languages.map((lang, idx) => {
                      const L = lang as Record<string, unknown>;
                      const langName = pickStr(L, 'language');
                      const level = pickStr(L, 'level');
                      const hasCert = pickCandidateField(L, 'has_certificate') === true;
                      const certUrl = pickStr(L, 'certificate_file_url');
                      return (
                        <div key={pickStr(L, 'id') || idx} className="flex items-center justify-between rounded-2xl border border-border/80 bg-muted/20 p-4">
                          <div className="flex items-center gap-3">
                            <LanguageIcon language={langName} className="h-8 w-8" />
                            <div>
                              <div className="font-semibold text-text-primary">
                                {langName ? languageLabelUz(langName) : '—'}
                              </div>
                              <div className="text-xs text-text-muted">
                                Daraja: {level ? uzOrCode(cefrLevelUz, level) : level || '—'}
                                {hasCert && <span className="ml-2 text-success">✓ Sertifikat</span>}
                              </div>
                            </div>
                          </div>
                          {certUrl && (
                            <a href={certUrl} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} text-xs`}>
                              Sertifikat
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ========== COUNTRIES (TARGET COUNTRIES) TAB ========== */}
              {activeTab === 'countries' && (
                <div className="space-y-3">
                  {targetCountryRows.length === 0 ? (
                    <p className="text-sm text-text-muted">Maqsadli davlatlar belgilanmagan.</p>
                  ) : (
                    targetCountryRows.map((tc, idx) => {
                      const country = tc.destination_country as Record<string, unknown> | undefined;
                      const code = pickStr(country, 'country_code');
                      const name = pickStr(country, 'name_uz') || pickStr(country, 'name_ru') || code;
                      const flag = pickStr(country, 'flag_emoji') || countryFlagEmoji(code);
                      const salMinC = pickNum(country, 'salary_min');
                      const salMaxC = pickNum(country, 'salary_max');
                      const salCurr = pickStr(country, 'salary_currency');
                      const langReq = pickStr(country, 'language_req');
                      const priority = tc.priority;
                      return (
                        <div key={tc.id || idx} className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{flag || '🌍'}</span>
                            <div className="flex-1">
                              <div className="font-semibold text-text-primary">{name || code}</div>
                              <div className="text-xs text-text-muted">
                                {salMinC != null && salMaxC != null
                                  ? `💰 ${salMinC.toLocaleString()} – ${salMaxC.toLocaleString()} ${salCurr || 'USD'}`
                                  : salMinC != null
                                  ? `💰 ${salMinC.toLocaleString()} ${salCurr || 'USD'}`
                                  : salMaxC != null
                                  ? `💰 ≤ ${salMaxC.toLocaleString()} ${salCurr || 'USD'}`
                                  : '💰 Maʼlumot yo‘q'}
                              </div>
                              {langReq && <div className="text-xs text-text-muted mt-1">📢 {langReq}</div>}
                            </div>
                            {priority != null && (
                              <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                Priority {priority}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ========== EDUCATION TAB ========== */}
              {activeTab === 'education' && (
                <div className="space-y-3">
                  {educations.length === 0 ? (
                    <p className="text-sm text-text-muted">Taʼlim maʼlumotlari yo‘q.</p>
                  ) : (
                    educations.map((edu, idx) => {
                      const E = edu as Record<string, unknown>;
                      const instName = pickStr(E, 'institution_name');
                      const specialty = pickStr(E, 'specialty');
                      const level = pickStr(E, 'level');
                      const gradYear = pickNum(E, 'graduation_year');
                      const country = pickStr(E, 'country');
                      return (
                        <div key={pickStr(E, 'id') || idx} className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                          <div className="flex items-start gap-3">
                            <GraduationCap className="mt-0.5 h-5 w-5 text-primary" strokeWidth={2} />
                            <div className="flex-1">
                              <div className="font-semibold text-text-primary">{instName || '—'}</div>
                              {specialty && <div className="text-sm text-text-muted">{specialty}</div>}
                              <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-text-muted">
                                {level && <span>📘 {uzOrCode(educationLevelUz, level)}</span>}
                                {gradYear && <span>🎓 {gradYear}</span>}
                                {country && <span>🌍 {countryNameUz(country) || country}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ========== WORK EXPERIENCE TAB ========== */}
              {activeTab === 'work' && (
                <div className="space-y-3">
                  {workExperiences.length === 0 ? (
                    <p className="text-sm text-text-muted">Ish tajribasi kiritilmagan.</p>
                  ) : (
                    workExperiences.map((exp, idx) => {
                      const W = exp as Record<string, unknown>;
                      const company = pickStr(W, 'company', 'employer');
                      const position = pickStr(W, 'position', 'job_title');
                      const start = pickStr(W, 'start_date', 'date_from');
                      const end = pickStr(W, 'end_date', 'date_to');
                      const desc = pickStr(W, 'description', 'responsibilities');
                      return (
                        <div key={idx} className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                          <div className="flex items-start gap-3">
                            <Briefcase className="mt-0.5 h-5 w-5 text-primary" strokeWidth={2} />
                            <div className="flex-1">
                              <div className="font-semibold text-text-primary">{position || 'Lavozim ko‘rsatilmagan'}</div>
                              {company && <div className="text-sm text-text-muted">{company}</div>}
                              {(start || end) && (
                                <div className="text-xs text-text-muted">
                                  {start || '?'} – {end || 'hozirgacha'}
                                </div>
                              )}
                              {desc && <div className="mt-2 text-sm text-text-primary">{desc}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ========== SKILLS TAB ========== */}
              {activeTab === 'skills' && (
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 ? (
                    <p className="text-sm text-text-muted">Ko‘nikmalar kiritilmagan.</p>
                  ) : (
                    skills.map((skill, idx) => {
                      const S = skill as Record<string, unknown>;
                      const skillName = pickStr(S, 'skill_name', 'name');
                      const verified = pickCandidateField(S, 'is_verified') === true;
                      return (
                        <div
                          key={pickStr(S, 'id') || idx}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                        >
                          {skillName || '—'}
                          {verified && <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2} />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ========== DOCUMENTS TAB ========== */}
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
                      const verified = pickCandidateField(D, 'is_verified') === true;
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
                              {fileName ? <div className="truncate text-xs text-text-muted">{fileName}</div> : null}
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted">
                                {uploaded ? <span>Yuklangan: {uploaded}</span> : null}
                                {expires ? <span>Muddati: {expires}</span> : null}
                                <span className={verified ? 'text-success' : ''}>
                                  {verified ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
                                </span>
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

              {/* ========== CV TAB ========== */}
              {activeTab === 'cv' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary">
                          {displayName || 'Nomzod'} — CV
                        </div>
                        <div className="text-xs text-text-muted">
                          HTML format · brauzer orqali PDF saqlash mumkin
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={cvLoading}
                        onClick={() => { setCvHtml(null); setCvError(null); }}
                        className={`${btnSecondary} inline-flex items-center gap-2`}
                        title="CV ni qayta yuklash"
                      >
                        {cvLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Yangilash
                      </button>
                      <button
                        type="button"
                        disabled={!cvHtml || cvLoading || cvPrintLoading}
                        onClick={handleCvPrint}
                        className={`${btnPrimary} inline-flex items-center gap-2`}
                        title="Chop etish / PDF saqlash"
                      >
                        {cvPrintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                        Chop etish / PDF
                      </button>
                    </div>
                  </div>

                  {cvLoading && (
                    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-muted/10 text-text-muted">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm">CV yuklanmoqda…</p>
                    </div>
                  )}

                  {cvError && !cvLoading && (
                    <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-5 py-4">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-sm font-medium text-danger">{cvError}</p>
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                          onClick={() => { setCvHtml(null); setCvError(null); }}
                        >
                          Qayta urinish
                        </button>
                      </div>
                    </div>
                  )}

                  {cvHtml && !cvLoading && (
                    <div className="overflow-hidden rounded-2xl border border-border/80 shadow-[var(--elite-shadow-sm)]">
                      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-5 py-2.5">
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <div className="h-2.5 w-2.5 rounded-full bg-danger/70" />
                          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                          <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
                          <span className="ml-2">CV Preview</span>
                        </div>
                        <span className="text-xs text-text-muted">{displayName || 'Nomzod'}.cv</span>
                      </div>
                      <iframe
                        srcDoc={cvHtml}
                        title={`CV — ${displayName || 'Nomzod'}`}
                        className="h-[80vh] w-full bg-white"
                        sandbox="allow-same-origin allow-popups"
                      />
                    </div>
                  )}

                  {!cvHtml && !cvLoading && !cvError && (
                    <div className="flex min-h-[25vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 text-text-muted">
                      <FileText className="h-12 w-12 opacity-20" strokeWidth={1.5} aria-hidden />
                      <p className="text-sm font-medium">CV hali yuklanmagan yoki mavjud emas</p>
                      <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => { setCvHtml(null); setCvError(null); }}
                      >
                        Yuklashga urinish
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteErr(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu nomzodni o'chirish?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <strong className="text-text-primary">{displayName || phone || 'Nomzod'}</strong> — barcha
                bog'langan profil ma'lumotlari o'chiriladi.
              </span>
              {deleteErr ? <span className="block text-sm text-danger">{deleteErr}</span> : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDeleteCandidate()}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Ha, o'chirish
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}