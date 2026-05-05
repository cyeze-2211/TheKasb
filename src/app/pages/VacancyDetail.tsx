import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Calendar, CircleAlert, ClipboardList, Loader2, MapPin, Pencil, ShieldCheck, Ticket, Trash2, UtensilsCrossed } from 'lucide-react';
import {
  axiosErrorMessage,
  deleteVacancy,
  fetchVacancyById,
  patchVacancy,
  pickBool,
  pickNum,
  pickStr,
  type VacancyPatchRequest,
} from '../api/vacancies';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { btnPrimaryLg, btnSecondary, btnSecondaryLg, ctlInputLg, ctlSelectLg, pageKicker, panelElite, panelEliteRaised, theadElite } from '../components/pageChrome';

type FormState = Required<
  Pick<
    VacancyPatchRequest,
    | 'title'
    | 'description'
    | 'country_code'
    | 'city'
    | 'employer_name'
    | 'salary_currency'
    | 'salary_min'
    | 'salary_max'
    | 'salary_is_negotiable'
    | 'places_total'
    | 'work_schedule'
    | 'contract_duration_months'
    | 'expires_at'
    | 'accommodation'
    | 'flight_ticket'
    | 'meals_provided'
    | 'medical_insurance'
  >
>;

function toForm(v: Record<string, unknown>): FormState {
  return {
    title: pickStr(v, 'title') || '',
    description: pickStr(v, 'description') || '',
    country_code: pickStr(v, 'country_code', 'countryCode') || '',
    city: pickStr(v, 'city') || '',
    employer_name: pickStr(v, 'employer_name', 'employerName') || '',
    salary_currency: pickStr(v, 'salary_currency', 'salaryCurrency') || 'EUR',
    salary_min: pickNum(v, 'salary_min', 'salaryMin') ?? 0,
    salary_max: pickNum(v, 'salary_max', 'salaryMax') ?? 0,
    salary_is_negotiable: pickBool(v, 'salary_is_negotiable', 'salaryIsNegotiable') ?? false,
    places_total: pickNum(v, 'places_total', 'placesTotal') ?? 0,
    work_schedule: pickStr(v, 'work_schedule', 'workSchedule') || 'FULL_TIME',
    contract_duration_months: pickNum(v, 'contract_duration_months', 'contractDurationMonths') ?? 0,
    expires_at: pickStr(v, 'expires_at', 'expiresAt') || '',
    accommodation: pickBool(v, 'accommodation') ?? false,
    flight_ticket: pickBool(v, 'flight_ticket', 'flightTicket') ?? false,
    meals_provided: pickBool(v, 'meals_provided', 'mealsProvided') ?? false,
    medical_insurance: pickBool(v, 'medical_insurance', 'medicalInsurance') ?? false,
  };
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const dialogSurface =
  'sm:max-w-2xl gap-0 overflow-hidden border-border/80 p-0 shadow-2xl duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[98%]';

export function VacancyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vacancyId = id ?? '';

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => ({
    title: '',
    description: '',
    country_code: '',
    city: '',
    employer_name: '',
    salary_currency: 'EUR',
    salary_min: 0,
    salary_max: 0,
    salary_is_negotiable: false,
    places_total: 0,
    work_schedule: 'FULL_TIME',
    contract_duration_months: 0,
    expires_at: '',
    accommodation: false,
    flight_ticket: false,
    meals_provided: false,
    medical_insurance: false,
  }));

  const load = useCallback(async () => {
    if (!vacancyId) {
      setErr('ID yo‘q');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const v = await fetchVacancyById(vacancyId);
      setData(v);
      if (!v) setErr('Vakansiya topilmadi.');
      if (v) setForm(toForm(v));
    } catch (e) {
      setErr(axiosErrorMessage(e, 'Yuklashda xato.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [vacancyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = useMemo(() => (data ? pickStr(data, 'title') : ''), [data]);
  const status = useMemo(() => (data ? pickStr(data, 'status') : ''), [data]);
  const countryCode = useMemo(() => (data ? pickStr(data, 'country_code', 'countryCode') : ''), [data]);
  const city = useMemo(() => (data ? pickStr(data, 'city') : ''), [data]);
  const employer = useMemo(() => (data ? pickStr(data, 'employer_name', 'employerName') : ''), [data]);
  const urgent = useMemo(() => (data ? (pickBool(data, 'is_urgent', 'isUrgent', 'urgent') ?? false) : false), [data]);
  const salaryMin = useMemo(() => (data ? pickNum(data, 'salary_min', 'salaryMin') : undefined), [data]);
  const salaryMax = useMemo(() => (data ? pickNum(data, 'salary_max', 'salaryMax') : undefined), [data]);
  const salaryCurrency = useMemo(() => (data ? pickStr(data, 'salary_currency', 'salaryCurrency') || 'EUR' : 'EUR'), [data]);
  const placesTotal = useMemo(() => (data ? pickNum(data, 'places_total', 'placesTotal') ?? 0 : 0), [data]);
  const placesFilled = useMemo(() => (data ? pickNum(data, 'places_filled', 'placesFilled') ?? 0 : 0), [data]);
  const placesAvailable = Math.max(0, placesTotal - placesFilled);
  const publishedAt = useMemo(() => (data ? pickStr(data, 'published_at', 'publishedAt') : ''), [data]);
  const expiresAt = useMemo(() => (data ? pickStr(data, 'expires_at', 'expiresAt') : ''), [data]);
  const accommodation = useMemo(() => (data ? (pickBool(data, 'accommodation') ?? false) : false), [data]);
  const mealsProvided = useMemo(() => (data ? (pickBool(data, 'meals_provided', 'mealsProvided') ?? false) : false), [data]);
  const medicalInsurance = useMemo(() => (data ? (pickBool(data, 'medical_insurance', 'medicalInsurance') ?? false) : false), [data]);
  const flightTicket = useMemo(() => (data ? (pickBool(data, 'flight_ticket', 'flightTicket') ?? false) : false), [data]);
  const workSchedule = useMemo(() => (data ? pickStr(data, 'work_schedule', 'workSchedule') : ''), [data]);
  const contractMonths = useMemo(
    () => (data ? pickNum(data, 'contract_duration_months', 'contractDurationMonths') : undefined),
    [data],
  );
  const salaryNegotiable = useMemo(
    () => (data ? (pickBool(data, 'salary_is_negotiable', 'salaryIsNegotiable') ?? false) : false),
    [data],
  );
  const createdBy = useMemo(() => (data ? pickNum(data, 'created_by', 'createdBy') : undefined), [data]);
  const updatedBy = useMemo(() => (data ? pickNum(data, 'updated_by', 'updatedBy') : undefined), [data]);
  const createdAt = useMemo(() => (data ? pickStr(data, 'created_at', 'createdAt') : ''), [data]);
  const updatedAt = useMemo(() => (data ? pickStr(data, 'updated_at', 'updatedAt') : ''), [data]);

  const professions = useMemo(() => {
    const raw = data ? (data as Record<string, unknown>).professions : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const languageReqs = useMemo(() => {
    const raw = data ? (data as Record<string, unknown>).language_requirements : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const badgeShell =
    'inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface px-2.5 py-1 text-xs font-semibold shadow-[var(--elite-shadow-xs)]';

  const statusPill = (s: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
      PAUSED: 'bg-amber-100 text-amber-800 border-amber-200',
      CLOSED: 'bg-rose-100 text-rose-800 border-rose-200',
      FILLED: 'bg-sky-100 text-sky-800 border-sky-200',
    };
    return <span className={`${badgeShell} ${map[s] ?? ''}`}>{s || '—'}</span>;
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('uz-UZ', { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  };

  async function confirmDelete() {
    if (!vacancyId) return;
    setDeleting(true);
    setDeleteErr(null);
    try {
      await deleteVacancy(vacancyId);
      setDeleteOpen(false);
      navigate('/admin/vacancies', { replace: true });
    } catch (e) {
      setDeleteErr(axiosErrorMessage(e, 'O‘chirishda xato.'));
    } finally {
      setDeleting(false);
    }
  }

  async function submitPatch(e: React.FormEvent) {
    e.preventDefault();
    if (!vacancyId) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const req: VacancyPatchRequest = {
        ...form,
        salary_min: Number(form.salary_min) || 0,
        salary_max: Number(form.salary_max) || 0,
        places_total: Number(form.places_total) || 0,
        contract_duration_months: Number(form.contract_duration_months) || 0,
      };
      await patchVacancy(vacancyId, req);
      setEditOpen(false);
      await load();
    } catch (e2) {
      setSaveErr(axiosErrorMessage(e2, 'Saqlashda xato.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Yuklanmoqda…</p>
      </div>
    );
  }

  if (err && !data) {
    return (
      <div className="space-y-4 p-6 md:p-8">
        <p className={`${pageKicker} mb-1`}>The Kasb · Admin</p>
        <p className="text-sm text-danger">{err}</p>
        <Link to="/admin/vacancies" className={`${btnSecondary} inline-flex`}>
          Ro‘yxatga qaytish
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <p className={`${pageKicker} mb-1`}>The Kasb · Admin</p>
      <nav className="text-sm text-text-muted" aria-label="Breadcrumb">
        <Link to="/admin/vacancies" className="text-primary hover:underline">
          Vakansiyalar
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-primary">{title || 'Vakansiya'}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Vakansiya</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {statusPill(status)}
            {urgent ? (
              <span className={`${badgeShell} bg-rose-100 text-rose-800 border-rose-200`}>
                <CircleAlert className="h-3.5 w-3.5" aria-hidden />
                Shoshilinch
              </span>
            ) : null}
            <span className={`${badgeShell} text-text-muted`}>
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {countryCode || '—'} · {city || '—'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnSecondary} onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" aria-hidden />
            Edit (PATCH)
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-danger/70 bg-surface px-4 text-sm font-medium text-danger shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:bg-danger hover:text-white"
            onClick={() => {
              setDeleteErr(null);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className={`${panelEliteRaised} p-6`}>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">Ish beruvchi</p>
              <p className="text-sm font-medium text-text-primary">{employer || '—'}</p>
            </div>
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Maosh</span>
                <span className="text-sm font-semibold text-text-primary tabular-nums">
                  {salaryMin != null && salaryMax != null
                    ? `${salaryMin.toLocaleString('ru-RU')}–${salaryMax.toLocaleString('ru-RU')} ${salaryCurrency}`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Joylar</span>
                <span className="text-sm font-semibold text-text-primary tabular-nums">
                  {placesFilled}/{placesTotal} · bo‘sh {placesAvailable}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary/80 transition-all duration-500"
                  style={{ width: `${placesTotal > 0 ? Math.min(100, Math.round((placesFilled / placesTotal) * 100)) : 0}%` }}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Calendar className="h-4 w-4 flex-shrink-0" aria-hidden />
                <span>Chop etilgan:</span>
                <span className="text-text-primary">{fmtDate(publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Calendar className="h-4 w-4 flex-shrink-0" aria-hidden />
                <span>Muddat:</span>
                <span className="text-text-primary">{fmtDate(expiresAt)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {accommodation ? <span className={badgeShell}>🏠 Yotoqxona</span> : null}
              {mealsProvided ? (
                <span className={badgeShell}>
                  <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden /> Ovqat
                </span>
              ) : null}
              {medicalInsurance ? (
                <span className={badgeShell}>
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Sug‘urta
                </span>
              ) : null}
              {flightTicket ? (
                <span className={badgeShell}>
                  <Ticket className="h-3.5 w-3.5" aria-hidden /> Bilet
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className={panelElite}>
          <div className="border-b border-border/80 bg-gradient-to-r from-muted/35 to-transparent px-6 py-4">
            <h2 className="m-0 text-base font-semibold">Tavsif</h2>
          </div>
          <div className="px-6 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
              {pickStr(data, 'description') || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={panelElite}>
          <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-gradient-to-r from-muted/35 to-transparent px-6 py-4">
            <h2 className="m-0 flex items-center gap-2 text-base font-semibold">
              <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
              Kasblar (professions)
            </h2>
            <span className="text-xs font-semibold text-text-muted">{professions.length} ta</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={theadElite}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kategoriya</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kasb</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Joy</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Jins</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Yosh</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tajriba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {professions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-text-muted">
                      Kasblar yo‘q
                    </td>
                  </tr>
                ) : (
                  professions.map((p, i) => {
                    const o = p as Record<string, unknown>;
                    const catId = pickNum(o, 'profession_category_id', 'professionCategoryId');
                    const profId = pickNum(o, 'profession_id', 'professionId');
                    const places = pickNum(o, 'places_count', 'placesCount') ?? 0;
                    const gender = pickStr(o, 'gender_requirement', 'genderRequirement') || 'ANY';
                    const ageMin = pickNum(o, 'age_min', 'ageMin');
                    const ageMax = pickNum(o, 'age_max', 'ageMax');
                    const exp = pickStr(o, 'experience_range', 'experienceRange') || '—';
                    return (
                      <tr key={`p-${i}`} className="hover:bg-primary/[0.035]">
                        <td className="px-6 py-3 text-sm text-text-muted tabular-nums">{catId ?? '—'}</td>
                        <td className="px-6 py-3 text-sm text-text-muted tabular-nums">{profId ?? '—'}</td>
                        <td className="px-6 py-3 text-sm font-medium text-text-primary tabular-nums">{places}</td>
                        <td className="px-6 py-3 text-sm text-text-muted">{gender}</td>
                        <td className="px-6 py-3 text-sm text-text-muted tabular-nums">
                          {ageMin != null || ageMax != null ? `${ageMin ?? '—'}–${ageMax ?? '—'}` : '—'}
                        </td>
                        <td className="px-6 py-3 text-sm text-text-muted">{exp}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={panelElite}>
          <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-gradient-to-r from-muted/35 to-transparent px-6 py-4">
            <h2 className="m-0 text-base font-semibold">Til talablari (language_requirements)</h2>
            <span className="text-xs font-semibold text-text-muted">{languageReqs.length} ta</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={theadElite}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Til</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Daraja</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Majburiymi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {languageReqs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-text-muted">
                      Til talablari yo‘q
                    </td>
                  </tr>
                ) : (
                  languageReqs.map((r, i) => {
                    const o = r as Record<string, unknown>;
                    const language = pickStr(o, 'language') || '—';
                    const level = pickStr(o, 'min_level', 'minLevel') || '—';
                    const mandatory = pickBool(o, 'is_mandatory', 'isMandatory');
                    return (
                      <tr key={`l-${i}`} className="hover:bg-primary/[0.035]">
                        <td className="px-6 py-3 text-sm text-text-primary">{language}</td>
                        <td className="px-6 py-3 text-sm text-text-muted">{level}</td>
                        <td className="px-6 py-3 text-sm text-text-muted">{mandatory === true ? 'Ha' : mandatory === false ? 'Yo‘q' : '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={panelElite}>
        <div className="border-b border-border/80 bg-gradient-to-r from-muted/35 to-transparent px-6 py-4">
          <h2 className="m-0 text-base font-semibold">Qo‘shimcha ma’lumot</h2>
        </div>
        <div className="grid gap-3 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-[var(--elite-shadow-xs)]">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Ish grafigi</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{workSchedule || '—'}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-[var(--elite-shadow-xs)]">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Kontrakt</p>
            <p className="mt-1 text-sm font-semibold text-text-primary tabular-nums">
              {contractMonths != null ? `${contractMonths} oy` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-[var(--elite-shadow-xs)]">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Maosh muzokara</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{salaryNegotiable ? 'Ha' : 'Yo‘q'}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-[var(--elite-shadow-xs)]">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Yaratgan</p>
            <p className="mt-1 text-sm font-semibold text-text-primary tabular-nums">{createdBy != null ? String(createdBy) : '—'}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-[var(--elite-shadow-xs)]">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Yangilagan</p>
            <p className="mt-1 text-sm font-semibold text-text-primary tabular-nums">{updatedBy != null ? String(updatedBy) : '—'}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-[var(--elite-shadow-xs)]">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Vaqtlar</p>
            <p className="mt-1 text-xs text-text-muted">created_at</p>
            <p className="text-sm font-semibold text-text-primary">{fmtDate(createdAt)}</p>
            <p className="mt-2 text-xs text-text-muted">updated_at</p>
            <p className="text-sm font-semibold text-text-primary">{fmtDate(updatedAt)}</p>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/80 shadow-2xl duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <AlertDialogHeader>
            <AlertDialogTitle>Vakansiyani o‘chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{title || 'Ushbu vakansiya'}</span> o‘chirilsinmi? Bu
              amalni qaytarib bo‘lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteErr ? <p className="text-sm text-danger">{deleteErr}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    O‘chirilmoqda…
                  </>
                ) : (
                  'Ha, o‘chirish'
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className={dialogSurface}>
          <DialogHeader className="border-b border-border/70 bg-gradient-to-r from-muted/40 to-transparent px-6 py-4 text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight">Vakansiyani tahrirlash</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              <span className="mono text-xs">PATCH /api/admin/vacancies/{`{id}`}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void submitPatch(e)}>
            <div className="grid max-h-[min(72vh,640px)] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="mb-1.5 text-xs text-text-muted">Sarlavha</Label>
                <Input className={ctlInputLg} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 text-xs text-text-muted">Tavsif</Label>
                <Input className={ctlInputLg} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-muted">country_code</Label>
                <Input className={ctlInputLg} value={form.country_code} onChange={(e) => setForm((p) => ({ ...p, country_code: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-muted">city</Label>
                <Input className={ctlInputLg} value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 text-xs text-text-muted">employer_name</Label>
                <Input className={ctlInputLg} value={form.employer_name} onChange={(e) => setForm((p) => ({ ...p, employer_name: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-muted">salary_currency</Label>
                <Input className={ctlInputLg} value={form.salary_currency} onChange={(e) => setForm((p) => ({ ...p, salary_currency: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-muted">work_schedule</Label>
                <select className={ctlSelectLg} value={form.work_schedule} onChange={(e) => setForm((p) => ({ ...p, work_schedule: e.target.value }))}>
                  <option value="FULL_TIME">FULL_TIME</option>
                  <option value="PART_TIME">PART_TIME</option>
                  <option value="SHIFT">SHIFT</option>
                </select>
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-muted">salary_min</Label>
                <Input className={ctlInputLg} type="number" value={form.salary_min} onChange={(e) => setForm((p) => ({ ...p, salary_min: num(e.target.value) }))} />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-muted">salary_max</Label>
                <Input className={ctlInputLg} type="number" value={form.salary_max} onChange={(e) => setForm((p) => ({ ...p, salary_max: num(e.target.value) }))} />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-muted">places_total</Label>
                <Input className={ctlInputLg} type="number" value={form.places_total} onChange={(e) => setForm((p) => ({ ...p, places_total: num(e.target.value) }))} />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-muted">contract_duration_months</Label>
                <Input className={ctlInputLg} type="number" value={form.contract_duration_months} onChange={(e) => setForm((p) => ({ ...p, contract_duration_months: num(e.target.value) }))} />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 text-xs text-text-muted">expires_at (ISO)</Label>
                <Input className={ctlInputLg} value={form.expires_at} onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 text-xs text-text-muted">Options</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ['salary_is_negotiable', 'salary_is_negotiable'],
                      ['accommodation', 'accommodation'],
                      ['flight_ticket', 'flight_ticket'],
                      ['meals_provided', 'meals_provided'],
                      ['medical_insurance', 'medical_insurance'],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k} className="flex items-center justify-between rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm shadow-[var(--elite-shadow-xs)]">
                      <span className="text-text-muted">{label}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={Boolean(form[k])}
                        onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.checked }))}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {saveErr ? <p className="border-t border-border/60 bg-danger/5 px-6 py-3 text-sm text-danger">{saveErr}</p> : null}
            <DialogFooter className="gap-2 border-t border-border/70 bg-muted/20 px-6 py-4 sm:justify-end">
              <Button type="button" variant="outline" className={btnSecondaryLg} disabled={saving} onClick={() => setEditOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" className={`${btnPrimaryLg} min-w-[8.5rem]`} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saqlanmoqda…
                  </>
                ) : (
                  'Saqlash'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

