import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Loader2, Plus, X } from 'lucide-react';
import { COUNTRIES } from '../data/mockData';
import {
  fetchProfessionCategories,
  fetchProfessionsByCategory,
  type ProfessionDto,
} from '../api/professions';
import { createVacancy, fetchVacancyById, patchVacancy } from '../api/vacancies';
import {
  btnPrimaryLg,
  btnSecondaryLg,
  ctlInput,
  ctlInputLg,
  ctlSelect,
  ctlSelectLg,
  ctlTextarea,
  pageKicker,
  panelElite,
} from '../components/pageChrome';

export function VacancyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const vacancyId = id ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [city, setCity] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [workSchedule, setWorkSchedule] = useState('FULL_TIME');
  const [isUrgent, setIsUrgent] = useState(false);
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [salaryCurrency, setSalaryCurrency] = useState('EUR');
  const [salaryNegotiable, setSalaryNegotiable] = useState(false);
  const [placesTotal, setPlacesTotal] = useState<number | ''>('');
  const [contractMonths, setContractMonths] = useState<number | ''>('');
  const [expiresAt, setExpiresAt] = useState('');
  const [accommodation, setAccommodation] = useState(false);
  const [mealsProvided, setMealsProvided] = useState(false);
  const [medicalInsurance, setMedicalInsurance] = useState(false);
  const [flightTicket, setFlightTicket] = useState(false);

  const [professions, setProfessions] = useState([
    {
      profession_category_id: 0,
      profession_id: 0,
      custom_profession_id: null as string | null,
      places_count: 1,
      gender_requirement: 'ANY',
      age_min: 0,
      age_max: 0,
      experience_range: 'YEAR_1_3',
    },
  ]);

  const [languages, setLanguages] = useState([
    { language: 'ENGLISH', min_level: 'A1', is_mandatory: true },
  ]);

  const addProfession = () => {
    setProfessions([
      ...professions,
      {
        profession_category_id: 0,
        profession_id: 0,
        custom_profession_id: null,
        places_count: 1,
        gender_requirement: 'ANY',
        age_min: 0,
        age_max: 0,
        experience_range: 'YEAR_1_3',
      },
    ]);
  };

  const removeProfession = (index: number) => {
    setProfessions(professions.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    setLanguages([...languages, { language: 'ENGLISH', min_level: 'A1', is_mandatory: true }]);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingVacancy, setLoadingVacancy] = useState(false);

  const [professionCategories, setProfessionCategories] = useState<
    Awaited<ReturnType<typeof fetchProfessionCategories>>
  >([]);
  const [professionsByCategory, setProfessionsByCategory] = useState<Record<number, ProfessionDto[]>>({});
  const [professionsLoadError, setProfessionsLoadError] = useState<string | null>(null);
  const [loadingProfessionCategories, setLoadingProfessionCategories] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProfessionsLoadError(null);
      setLoadingProfessionCategories(true);
      try {
        const cats = await fetchProfessionCategories();
        if (!cancelled) setProfessionCategories(cats);
      } catch (e: unknown) {
        if (!cancelled) {
          setProfessionsLoadError(e instanceof Error ? e.message : 'Kasb kategoriyalarini yuklashda xato.');
        }
      } finally {
        if (!cancelled) setLoadingProfessionCategories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit || !vacancyId) return;
    let cancelled = false;
    (async () => {
      setLoadingVacancy(true);
      setError(null);
      try {
        const v = await fetchVacancyById(vacancyId);
        if (cancelled) return;
        if (!v) {
          setError('Vakansiya topilmadi.');
          return;
        }
        const pickStr = (...keys: string[]) => {
          for (const k of keys) {
            const val = v[k];
            if (val != null && String(val).trim()) return String(val);
          }
          return '';
        };
        const pickBool = (...keys: string[]) => {
          for (const k of keys) {
            const val = v[k];
            if (typeof val === 'boolean') return val;
          }
          return undefined;
        };
        const pickNum = (...keys: string[]) => {
          for (const k of keys) {
            const val = v[k];
            if (typeof val === 'number' && Number.isFinite(val)) return val;
            if (typeof val === 'string' && val.trim() !== '') {
              const n = Number(val);
              if (Number.isFinite(n)) return n;
            }
          }
          return undefined;
        };

        setTitle(pickStr('title'));
        setDescription(pickStr('description'));
        setCountryCode(pickStr('country_code', 'countryCode'));
        setCity(pickStr('city'));
        setEmployerName(pickStr('employer_name', 'employerName'));
        setWorkSchedule(pickStr('work_schedule', 'workSchedule') || 'FULL_TIME');
        setIsUrgent(pickBool('is_urgent', 'isUrgent', 'urgent') ?? false);
        setSalaryMin(pickNum('salary_min', 'salaryMin') ?? 0);
        setSalaryMax(pickNum('salary_max', 'salaryMax') ?? 0);
        setSalaryCurrency(pickStr('salary_currency', 'salaryCurrency') || 'EUR');
        setSalaryNegotiable(pickBool('salary_is_negotiable', 'salaryIsNegotiable') ?? false);
        setPlacesTotal(pickNum('places_total', 'placesTotal') ?? 0);
        setContractMonths(pickNum('contract_duration_months', 'contractDurationMonths') ?? 0);
        const expIso = pickStr('expires_at', 'expiresAt');
        setExpiresAt(expIso ? expIso.slice(0, 16) : '');
        setAccommodation(pickBool('accommodation') ?? false);
        setMealsProvided(pickBool('meals_provided', 'mealsProvided') ?? false);
        setMedicalInsurance(pickBool('medical_insurance', 'medicalInsurance') ?? false);
        setFlightTicket(pickBool('flight_ticket', 'flightTicket') ?? false);

        const profRaw = v.professions;
        if (Array.isArray(profRaw) && profRaw.length) {
          setProfessions(
            profRaw.map((p) => ({
              profession_category_id: Number((p as any).profession_category_id ?? (p as any).professionCategoryId ?? 0) || 0,
              profession_id: Number((p as any).profession_id ?? (p as any).professionId ?? 0) || 0,
              custom_profession_id: ((p as any).custom_profession_id ?? (p as any).customProfessionId ?? null) as string | null,
              places_count: Number((p as any).places_count ?? (p as any).placesCount ?? 1) || 1,
              gender_requirement: String((p as any).gender_requirement ?? (p as any).genderRequirement ?? 'ANY'),
              age_min: Number((p as any).age_min ?? (p as any).ageMin ?? 0) || 0,
              age_max: Number((p as any).age_max ?? (p as any).ageMax ?? 0) || 0,
              experience_range: String((p as any).experience_range ?? (p as any).experienceRange ?? 'YEAR_1_3'),
            })),
          );
        }
        const langRaw = v.language_requirements;
        if (Array.isArray(langRaw) && langRaw.length) {
          setLanguages(
            langRaw.map((r) => ({
              language: String((r as any).language ?? 'ENGLISH'),
              min_level: String((r as any).min_level ?? (r as any).minLevel ?? 'A1'),
              is_mandatory: Boolean((r as any).is_mandatory ?? (r as any).isMandatory ?? true),
            })),
          );
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Vakansiyani yuklashda xato.');
      } finally {
        if (!cancelled) setLoadingVacancy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, vacancyId]);

  function prefetchProfessionsForCategory(categoryId: number) {
    if (categoryId <= 0) return;
    void fetchProfessionsByCategory(categoryId)
      .then((list) => {
        setProfessionsByCategory((prev) => ({ ...prev, [categoryId]: list }));
      })
      .catch(() => {
        setProfessionsByCategory((prev) => ({ ...prev, [categoryId]: [] }));
      });
  }

  async function handleSave(status: 'ACTIVE' | 'DRAFT') {
    setError(null);
    if (!title.trim()) return setError('Sarlavha kiriting.');
    if (!countryCode) return setError('Mamlakat kodini tanlang.');
    if (!expiresAt) return setError('Muddat (expires_at) kiriting.');
    if ((placesTotal === '' ? 0 : placesTotal) <= 0) return setError('Joylar soni (places_total) kiriting.');
    for (let i = 0; i < professions.length; i++) {
      const p = professions[i];
      if (!p.profession_category_id || !p.profession_id) {
        return setError(`Kasb ${i + 1}: kategoriya va kasbni tanlang.`);
      }
    }
    setSaving(true);
    try {
      const req = {
        title: title.trim(),
        description: description.trim(),
        country_code: countryCode,
        city: city.trim(),
        employer_name: employerName.trim(),
        work_schedule: workSchedule,
        is_urgent: isUrgent,
        expires_at: new Date(expiresAt).toISOString(),
        salary_min: salaryMin === '' ? 0 : salaryMin,
        salary_max: salaryMax === '' ? 0 : salaryMax,
        salary_currency: salaryCurrency,
        salary_is_negotiable: salaryNegotiable,
        places_total: placesTotal === '' ? 0 : placesTotal,
        contract_duration_months: contractMonths === '' ? 0 : contractMonths,
        accommodation,
        meals_provided: mealsProvided,
        medical_insurance: medicalInsurance,
        flight_ticket: flightTicket,
        professions,
        language_requirements: languages,
      };
      if (isEdit) {
        if (!vacancyId) throw new Error('ID yo‘q');
        await patchVacancy(vacancyId, req);
      } else {
        await createVacancy({ ...req, status });
      }
      navigate('/admin/vacancies', { replace: true });
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Saqlashda xato.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      {/* Page Header */}
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">{isEdit ? 'Vakansiyani tahrirlash' : 'Yangi vakansiya yaratish'}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Barcha zarur ma&apos;lumotlarni to&apos;ldiring
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Main Fields */}
        <div className="col-span-2 space-y-6">
          {/* Basic Info Section */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <h2>Asosiy ma'lumotlar</h2>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Sarlavha <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="Masalan: Oshpaz — Seul, Koreya"
                className={ctlInputLg}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Tavsif</label>
              <textarea
                rows={4}
                placeholder="Vakansiya haqida batafsil ma'lumot..."
                className={ctlTextarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Mamlakat kodi <span className="text-danger">*</span>
                </label>
                <select className={ctlSelectLg} value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                  <option value="">Tanlang</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Ish grafigi</label>
                <select className={ctlSelectLg} value={workSchedule} onChange={(e) => setWorkSchedule(e.target.value)}>
                  <option value="FULL_TIME">FULL_TIME</option>
                  <option value="PART_TIME">PART_TIME</option>
                  <option value="SHIFT">SHIFT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Tajriba talab</label>
                <select className={ctlSelectLg}>
                  <option>1-3 YIL</option>
                  <option>3-5 YIL</option>
                  <option>5+ YIL</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-primary"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                  />
                  <span className="text-sm text-text-primary">Ha, bu vakansiya shoshilinch</span>
                </label>
              </div>
            </div>
          </div>

          {/* Salary Section */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <h2>Maosh</h2>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-1">Min</label>
                <input
                  type="number"
                  placeholder="800"
                  className={ctlInputLg}
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <span className="text-text-muted mt-6">—</span>
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-1">Max</label>
                <input
                  type="number"
                  placeholder="1200"
                  className={ctlInputLg}
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-text-primary mb-1">Valyuta</label>
                <select className={ctlSelectLg} value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="UZS">UZS</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border text-primary"
                checked={salaryNegotiable}
                onChange={(e) => setSalaryNegotiable(e.target.checked)}
              />
              <span className="text-sm text-text-primary">Maosh muzokara</span>
            </label>
          </div>

          {/* Additional Info */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <h2>Qo'shimcha</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Minimal yosh</label>
                <input
                  type="number"
                  placeholder="18"
                  className={ctlInputLg}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Maksimal yosh</label>
                <input
                  type="number"
                  placeholder="45"
                  className={ctlInputLg}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Jins talabi</label>
                <select className={ctlSelectLg}>
                  <option>Farq qilmaydi</option>
                  <option>Erkak</option>
                  <option>Ayol</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Joylar soni</label>
                <input
                  type="number"
                  placeholder="5"
                  className={ctlInputLg}
                  value={placesTotal}
                  onChange={(e) => setPlacesTotal(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Kontrakt (oy)</label>
                <input
                  type="number"
                  placeholder="6"
                  className={ctlInputLg}
                  value={contractMonths}
                  onChange={(e) => setContractMonths(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Muddat (expires_at) <span className="text-danger">*</span>
                </label>
                <input
                  type="datetime-local"
                  className={ctlInputLg}
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary" checked={accommodation} onChange={(e) => setAccommodation(e.target.checked)} />
                <span className="text-sm text-text-primary">Yotoqxona</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary" checked={mealsProvided} onChange={(e) => setMealsProvided(e.target.checked)} />
                <span className="text-sm text-text-primary">Ovqat</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary" checked={medicalInsurance} onChange={(e) => setMedicalInsurance(e.target.checked)} />
                <span className="text-sm text-text-primary">Sug‘urta</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary" checked={flightTicket} onChange={(e) => setFlightTicket(e.target.checked)} />
                <span className="text-sm text-text-primary">Bilet</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Relations */}
        <div className="space-y-6">
          {/* Professions Section */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Kasblar</h3>
              <button
                type="button"
                onClick={addProfession}
                className="flex h-8 items-center gap-1 rounded-md bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Kasb qo'shish
              </button>
            </div>

            {professionsLoadError ? (
              <p className="text-xs text-danger">{professionsLoadError}</p>
            ) : null}
            {professions.map((prof, index) => (
              <div key={index} className="relative space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 shadow-[var(--elite-shadow-xs)] ring-1 ring-black/[0.03]">
                {professions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProfession(index)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25"
                    aria-label="Kasbni olib tashlash"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Kategoriya</label>
                  <select
                    className={`${ctlSelect} w-full text-xs`}
                    disabled={loadingProfessionCategories}
                    value={prof.profession_category_id || ''}
                    onChange={(e) => {
                      const catId = Number(e.target.value);
                      const next = [...professions];
                      next[index].profession_category_id = catId;
                      next[index].profession_id = 0;
                      setProfessions(next);
                      prefetchProfessionsForCategory(catId);
                    }}
                  >
                    <option value="">Tanlang</option>
                    {professionCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_uz || c.name_ru}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Kasb</label>
                  <select
                    className={`${ctlSelect} w-full text-xs`}
                    disabled={!prof.profession_category_id}
                    value={prof.profession_id || ''}
                    onChange={(e) => {
                      const next = [...professions];
                      next[index].profession_id = Number(e.target.value);
                      setProfessions(next);
                    }}
                  >
                    <option value="">
                      {!prof.profession_category_id ? 'Avval kategoriya' : 'Tanlang'}
                    </option>
                    {(professionsByCategory[prof.profession_category_id] ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name_uz || p.name_ru}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Joy soni:</label>
                  <input
                    type="number"
                    value={prof.places_count}
                    onChange={(e) => {
                      const newProfs = [...professions];
                      newProfs[index].places_count = Number(e.target.value);
                      setProfessions(newProfs);
                    }}
                    className={`${ctlInput} px-2 text-xs`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">age_min</label>
                    <input
                      type="number"
                      value={prof.age_min}
                      onChange={(e) => {
                        const next = [...professions];
                        next[index].age_min = Number(e.target.value);
                        setProfessions(next);
                      }}
                      className={`${ctlInput} px-2 text-xs`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">age_max</label>
                    <input
                      type="number"
                      value={prof.age_max}
                      onChange={(e) => {
                        const next = [...professions];
                        next[index].age_max = Number(e.target.value);
                        setProfessions(next);
                      }}
                      className={`${ctlInput} px-2 text-xs`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">gender_requirement</label>
                    <select
                      className={`${ctlSelect} text-xs`}
                      value={prof.gender_requirement}
                      onChange={(e) => {
                        const next = [...professions];
                        next[index].gender_requirement = e.target.value;
                        setProfessions(next);
                      }}
                    >
                      <option value="ANY">ANY</option>
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">experience_range</label>
                    <select
                      className={`${ctlSelect} text-xs`}
                      value={prof.experience_range}
                      onChange={(e) => {
                        const next = [...professions];
                        next[index].experience_range = e.target.value;
                        setProfessions(next);
                      }}
                    >
                      <option value="YEAR_1_3">YEAR_1_3</option>
                      <option value="YEAR_3_5">YEAR_3_5</option>
                      <option value="YEAR_5_PLUS">YEAR_5_PLUS</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Languages Section */}
          <div className={`${panelElite} space-y-4 p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Til talablari</h3>
              <button
                type="button"
                onClick={addLanguage}
                className="flex h-8 items-center gap-1 rounded-md bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Til qo'shish
              </button>
            </div>

            {languages.map((lang, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  className={`${ctlSelect} min-w-0 flex-1 text-xs`}
                  value={lang.language}
                  onChange={(e) => {
                    const next = [...languages];
                    next[index].language = e.target.value;
                    setLanguages(next);
                  }}
                >
                  <option value="ENGLISH">ENGLISH</option>
                  <option value="GERMAN">GERMAN</option>
                  <option value="KOREAN">KOREAN</option>
                  <option value="POLISH">POLISH</option>
                  <option value="RUSSIAN">RUSSIAN</option>
                  <option value="TURKISH">TURKISH</option>
                  <option value="OTHER">OTHER</option>
                </select>
                <select
                  className={`${ctlSelect} w-24 flex-shrink-0 text-xs`}
                  value={lang.min_level}
                  onChange={(e) => {
                    const next = [...languages];
                    next[index].min_level = e.target.value;
                    setLanguages(next);
                  }}
                >
                  <option value="NONE">NONE</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
                <label className="flex items-center gap-2 text-xs text-text-muted">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary"
                    checked={lang.is_mandatory}
                    onChange={(e) => {
                      const next = [...languages];
                      next[index].is_mandatory = e.target.checked;
                      setLanguages(next);
                    }}
                  />
                  majburiy
                </label>
                {languages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25"
                    aria-label="Tilni olib tashlash"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={() => navigate('/admin/vacancies')} className={btnSecondaryLg}>
          Bekor qilish
        </button>
        <button type="button" className={btnSecondaryLg} disabled={saving || loadingVacancy} onClick={() => void handleSave('DRAFT')}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isEdit ? 'Saqlash (PATCH)' : 'Qoralama saqla'}
        </button>
        <button type="button" className={btnPrimaryLg} disabled={saving || loadingVacancy} onClick={() => void handleSave('ACTIVE')}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isEdit ? 'Saqlash (PATCH)' : 'Nashr qilish (ACTIVE)'}
        </button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
