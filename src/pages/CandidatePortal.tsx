import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import { isCompleteNationalNine, PhoneInput } from '../components/PhoneInput';
import { sanitizeNationalDigits, toApiPhone } from '../app/lib/uzPhone';
import {
  candidateAddEducation,
  candidateAddLanguage,
  candidateAddTargetCountry,
  candidateCreateProfile,
  candidateFetchProfileMe,
  candidateFetchVacancies,
  candidateLogout,
  candidatePortalError,
  candidateSendOtp,
  candidateSubmitProfile,
  candidateUploadDocument,
  candidateVerifyOtp,
} from '../app/api/candidatePortal';
import {
  getCandidateProfileId,
  getCandidateToken,
} from '../app/candidate/candidateSession';

type PortalStep = 'otp' | 'profile' | 'fill' | 'submit' | 'submitted' | 'vacancies';

const MARITAL = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] as const;
const EDUCATION = ['PRIMARY', 'SECONDARY', 'SECONDARY_SPECIAL', 'HIGHER', 'OTHER'] as const;
const LANGS = ['ENGLISH', 'RUSSIAN', 'GERMAN', 'KOREAN', 'TURKISH', 'POLISH', 'OTHER'] as const;
const LEVELS = ['NONE', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const EXP = ['YEAR_1_3', 'YEAR_3_5', 'YEAR_5_PLUS'] as const;
const AVAIL = ['READY_NOW', 'WITHIN_1_MONTH', 'WITHIN_3_MONTHS'] as const;

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30';
const labelCls = 'mb-1.5 block text-xs font-medium text-white/60';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50';
const btnGhost =
  'rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5';

function pickStr(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (v != null && String(v).trim()) return String(v);
  }
  return '';
}

export default function CandidatePortal() {
  const [step, setStep] = useState<PortalStep>('otp');
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [profileMe, setProfileMe] = useState<Record<string, unknown> | null>(null);

  const [nationalDigits, setNationalDigits] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [regionId, setRegionId] = useState('1');
  const [marital, setMarital] = useState<string>(MARITAL[0]);
  const [education, setEducation] = useState<string>(EDUCATION[3]);
  const [dataConsent, setDataConsent] = useState(true);
  const [professionId, setProfessionId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expRange, setExpRange] = useState<string>(EXP[0]);
  const [avail, setAvail] = useState<string>(AVAIL[0]);
  const [salMin, setSalMin] = useState('');
  const [salMax, setSalMax] = useState('');

  const [lang, setLang] = useState<string>(LANGS[1]);
  const [langLevel, setLangLevel] = useState<string>(LEVELS[3]);
  const [langCert, setLangCert] = useState(false);

  const [eduLevel, setEduLevel] = useState<string>(EDUCATION[3]);
  const [institution, setInstitution] = useState('');
  const [gradYear, setGradYear] = useState(String(new Date().getFullYear()));
  const [eduCountry, setEduCountry] = useState('Uzbekistan');
  const [specialty, setSpecialty] = useState('');

  const [countryCode, setCountryCode] = useState('KR');
  const [priority, setPriority] = useState('1');

  const [docType, setDocType] = useState('PASSPORT');
  const [docFile, setDocFile] = useState<File | null>(null);

  const [vacCountry, setVacCountry] = useState('');
  const [vacProfessionId, setVacProfessionId] = useState('');
  const [vacancies, setVacancies] = useState<Record<string, unknown>[]>([]);
  const [vacLoading, setVacLoading] = useState(false);

  const hydrate = useCallback(async () => {
    setHydrating(true);
    try {
      const token = getCandidateToken();
      if (!token) {
        setStep('otp');
        return;
      }
      const me = await candidateFetchProfileMe();
      if (!me) {
        setStep(getCandidateProfileId() ? 'fill' : 'profile');
        return;
      }
      setProfileMe(me);
      const st = pickStr(me, 'profile_status', 'profileStatus').toUpperCase();
      if (st === 'PENDING') {
        setStep('submitted');
        return;
      }
      if (st === 'ACTIVE' || st === 'PLACED') {
        setStep('vacancies');
        return;
      }
      if (st === 'DRAFT' || !st) {
        setStep(getCandidateProfileId() ? 'fill' : 'profile');
        return;
      }
      setStep('fill');
    } finally {
      setHydrating(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const phoneApi = () => toApiPhone(sanitizeNationalDigits(nationalDigits));

  const onSendOtp = async () => {
    const phone = phoneApi();
    if (!phone) {
      toast.error('Telefon raqamini to‘liq kiriting.');
      return;
    }
    setLoading(true);
    try {
      await candidateSendOtp(phone);
      setOtpSent(true);
      toast.success('OTP yuborildi.');
    } catch (e) {
      toast.error(candidatePortalError(e, 'OTP yuborilmadi.'));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    const phone = phoneApi();
    if (!phone || !otpCode.trim()) {
      toast.error('Telefon va kodni kiriting.');
      return;
    }
    setLoading(true);
    try {
      await candidateVerifyOtp({
        phoneE164: phone,
        code: otpCode.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      toast.success('Muvaffaqiyatli kirdingiz.');
      await hydrate();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Tasdiqlashda xato.'));
    } finally {
      setLoading(false);
    }
  };

  const onCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const rid = Number(regionId);
    if (!Number.isFinite(rid) || rid <= 0) {
      toast.error('region_id musbat bo‘lsin.');
      return;
    }
    if (!dataConsent) {
      toast.error('Ma’lumotlarni qayta ishlashga rozilik berishingiz kerak.');
      return;
    }
    setLoading(true);
    try {
      await candidateCreateProfile({
        region_id: rid,
        marital_status: marital,
        education_level: education,
        data_consent: true,
        experience_range: expRange,
        availability_status: avail,
        desired_salary_min: salMin ? Number(salMin) : undefined,
        desired_salary_max: salMax ? Number(salMax) : undefined,
        salary_currency: 'USD',
        profession_id: professionId ? Number(professionId) : undefined,
        profession_category_id: categoryId ? Number(categoryId) : undefined,
      });
      toast.success('Profil yaratildi (DRAFT).');
      setStep('fill');
      const me = await candidateFetchProfileMe();
      setProfileMe(me);
    } catch (e) {
      toast.error(candidatePortalError(e, 'Profil yaratilmadi.'));
    } finally {
      setLoading(false);
    }
  };

  const onAddLanguage = async () => {
    setLoading(true);
    try {
      await candidateAddLanguage({
        language: lang,
        level: langLevel,
        has_certificate: langCert,
      });
      toast.success('Til qo‘shildi.');
    } catch (e) {
      toast.error(candidatePortalError(e, 'Til qo‘shilmadi.'));
    } finally {
      setLoading(false);
    }
  };

  const onAddEducation = async () => {
    setLoading(true);
    try {
      await candidateAddEducation({
        level: eduLevel,
        institution_name: institution.trim() || '—',
        graduation_year: Number(gradYear) || new Date().getFullYear(),
        country: eduCountry.trim() || undefined,
        specialty: specialty.trim() || undefined,
      });
      toast.success('Ta’lim qo‘shildi.');
    } catch (e) {
      toast.error(candidatePortalError(e, 'Ta’lim qo‘shilmadi.'));
    } finally {
      setLoading(false);
    }
  };

  const onAddCountry = async () => {
    setLoading(true);
    try {
      await candidateAddTargetCountry({
        country_code: countryCode.trim().toUpperCase(),
        priority: Number(priority) || 1,
      });
      toast.success('Mamlakat qo‘shildi.');
    } catch (e) {
      toast.error(candidatePortalError(e, 'Mamlakat qo‘shilmadi.'));
    } finally {
      setLoading(false);
    }
  };

  const onUploadDoc = async () => {
    if (!docFile) {
      toast.error('Fayl tanlang.');
      return;
    }
    setLoading(true);
    try {
      await candidateUploadDocument(docFile, docType);
      toast.success('Hujjat yuklandi.');
      setDocFile(null);
    } catch (e) {
      toast.error(candidatePortalError(e, 'Yuklashda xato.'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmitApplication = async () => {
    setLoading(true);
    try {
      await candidateSubmitProfile();
      toast.success('Ariza yuborildi. Holat: PENDING.');
      setStep('submitted');
      setProfileMe(await candidateFetchProfileMe());
    } catch (e) {
      toast.error(candidatePortalError(e, 'Yuborishda xato.'));
    } finally {
      setLoading(false);
    }
  };

  const loadVacancies = useCallback(async () => {
    setVacLoading(true);
    try {
      const list = await candidateFetchVacancies({
        countryCode: vacCountry.trim() || undefined,
        professionId: vacProfessionId ? Number(vacProfessionId) : undefined,
      });
      setVacancies(list);
    } catch (e) {
      toast.error(candidatePortalError(e, 'Vakansiyalar yuklanmadi.'));
      setVacancies([]);
    } finally {
      setVacLoading(false);
    }
  }, [vacCountry, vacProfessionId]);

  useEffect(() => {
    if (step === 'vacancies') void loadVacancies();
  }, [step, loadVacancies]);

  const onLogoutCandidate = () => {
    candidateLogout();
    setProfileMe(null);
    setStep('otp');
    setOtpSent(false);
    toast.success('Chiqdingiz.');
  };

  if (hydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" aria-hidden />
      </div>
    );
  }

  const statusLabel = profileMe
    ? pickStr(profileMe, 'profile_status', 'profileStatus') || '—'
    : '—';

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <header className="border-b border-white/10 px-6 py-4 md:px-10">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">The Kasb</p>
            <h1 className="text-lg font-bold">Nomzod kabineti</h1>
            <p className="text-xs text-white/50">Ro‘yxatdan o‘tish → profil → ariza (admin bilan alohida)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {getCandidateToken() ? (
              <button type="button" className={btnGhost} onClick={onLogoutCandidate}>
                Chiqish
              </button>
            ) : null}
            <Link to="/login" className={`${btnGhost} no-underline`}>
              Admin kirish
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 md:px-10">
        {/* Progress */}
        <ol className="mb-8 flex flex-wrap gap-2 text-[11px] font-medium text-white/50">
          {[
            ['otp', '1. OTP'],
            ['profile', '2. Profil'],
            ['fill', '3. To‘ldirish'],
            ['submit', '4. Yuborish'],
            ['submitted', '5. Kutish'],
            ['vacancies', '6. Vakansiyalar'],
          ].map(([k, label]) => (
            <li
              key={k}
              className={`rounded-full px-2.5 py-1 ${
                step === k ? 'bg-blue-500/25 text-blue-200' : 'bg-white/5'
              }`}
            >
              {label}
            </li>
          ))}
        </ol>

        {step === 'otp' && (
          <section
            className="rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-xl md:p-8"
          >
            <h2 className="mb-1 text-base font-semibold">1-qadam — Ro‘yxatdan o‘tish</h2>
            <p className="mb-6 text-sm text-white/55">
              POST /auth/send-otp va /auth/verify-otp — SMS kod, keyin ism-familiya (ixtiyoriy).
            </p>
            <div className="space-y-4">
              <div>
                <span className={labelCls}>Telefon</span>
                <PhoneInput nationalDigits={nationalDigits} onNationalDigitsChange={setNationalDigits} />
              </div>
              <button
                type="button"
                className={btnPrimary}
                disabled={loading || !isCompleteNationalNine(sanitizeNationalDigits(nationalDigits))}
                onClick={() => void onSendOtp()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                OTP yuborish
              </button>
              {otpSent ? (
                <>
                  <div>
                    <span className={labelCls}>SMS kodi</span>
                    <input
                      className={inputCls}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className={labelCls}>Ism</span>
                      <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <span className={labelCls}>Familiya</span>
                      <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <button type="button" className={btnPrimary} disabled={loading} onClick={() => void onVerifyOtp()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Tasdiqlash va kirish
                  </button>
                </>
              ) : null}
            </div>
          </section>
        )}

        {step === 'profile' && (
          <section className="rounded-2xl border border-white/10 bg-[#111827] p-6 md:p-8">
            <h2 className="mb-1 text-base font-semibold">2-qadam — Profil (DRAFT)</h2>
            <p className="mb-6 text-sm text-white/55">POST /candidate/profile — asosiy ma’lumotlar.</p>
            <form onSubmit={onCreateProfile} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className={labelCls}>region_id</span>
                <input className={inputCls} type="number" min={1} value={regionId} onChange={(e) => setRegionId(e.target.value)} />
              </div>
              <div>
                <span className={labelCls}>marital_status</span>
                <select className={inputCls} value={marital} onChange={(e) => setMarital(e.target.value)}>
                  {MARITAL.map((m) => (
                    <option key={m} value={m} className="bg-[#111827]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className={labelCls}>education_level</span>
                <select className={inputCls} value={education} onChange={(e) => setEducation(e.target.value)}>
                  {EDUCATION.map((m) => (
                    <option key={m} value={m} className="bg-[#111827]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className={labelCls}>experience_range</span>
                <select className={inputCls} value={expRange} onChange={(e) => setExpRange(e.target.value)}>
                  {EXP.map((m) => (
                    <option key={m} value={m} className="bg-[#111827]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className={labelCls}>availability_status</span>
                <select className={inputCls} value={avail} onChange={(e) => setAvail(e.target.value)}>
                  {AVAIL.map((m) => (
                    <option key={m} value={m} className="bg-[#111827]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className={labelCls}>profession_id (ixtiyoriy)</span>
                <input className={inputCls} value={professionId} onChange={(e) => setProfessionId(e.target.value)} />
              </div>
              <div>
                <span className={labelCls}>profession_category_id (ixtiyoriy)</span>
                <input className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
              </div>
              <div>
                <span className={labelCls}>Maosh min</span>
                <input className={inputCls} value={salMin} onChange={(e) => setSalMin(e.target.value)} />
              </div>
              <div>
                <span className={labelCls}>Maosh max</span>
                <input className={inputCls} value={salMax} onChange={(e) => setSalMax(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 sm:col-span-2">
                <input type="checkbox" checked={dataConsent} onChange={(e) => setDataConsent(e.target.checked)} />
                <span className="text-sm text-white/70">data_consent — shaxsiy ma’lumotlarni qayta ishlashga roziman</span>
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className={btnPrimary} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Profil yaratish
                </button>
              </div>
            </form>
          </section>
        )}

        {step === 'fill' && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-[#111827] p-6 md:p-8">
              <h2 className="mb-4 text-base font-semibold">3-qadam — Profilni to‘ldirish</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-white/5 p-4">
                  <h3 className="mb-3 text-sm font-medium text-blue-300">Tillar</h3>
                  <select className={`${inputCls} mb-2`} value={lang} onChange={(e) => setLang(e.target.value)}>
                    {LANGS.map((l) => (
                      <option key={l} value={l} className="bg-[#111827]">
                        {l}
                      </option>
                    ))}
                  </select>
                  <select className={`${inputCls} mb-2`} value={langLevel} onChange={(e) => setLangLevel(e.target.value)}>
                    {LEVELS.map((l) => (
                      <option key={l} value={l} className="bg-[#111827]">
                        {l}
                      </option>
                    ))}
                  </select>
                  <label className="mb-2 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={langCert} onChange={(e) => setLangCert(e.target.checked)} />
                    has_certificate
                  </label>
                  <button type="button" className={btnGhost} disabled={loading} onClick={() => void onAddLanguage()}>
                    Qo‘shish
                  </button>
                </div>
                <div className="rounded-xl border border-white/5 p-4">
                  <h3 className="mb-3 text-sm font-medium text-blue-300">Ta’lim</h3>
                  <select className={`${inputCls} mb-2`} value={eduLevel} onChange={(e) => setEduLevel(e.target.value)}>
                    {EDUCATION.map((l) => (
                      <option key={l} value={l} className="bg-[#111827]">
                        {l}
                      </option>
                    ))}
                  </select>
                  <input
                    className={`${inputCls} mb-2`}
                    placeholder="institution_name"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                  />
                  <input
                    className={`${inputCls} mb-2`}
                    type="number"
                    placeholder="graduation_year"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                  />
                  <input
                    className={`${inputCls} mb-2`}
                    placeholder="country"
                    value={eduCountry}
                    onChange={(e) => setEduCountry(e.target.value)}
                  />
                  <input
                    className={`${inputCls} mb-2`}
                    placeholder="specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                  <button type="button" className={btnGhost} disabled={loading} onClick={() => void onAddEducation()}>
                    Qo‘shish
                  </button>
                </div>
                <div className="rounded-xl border border-white/5 p-4">
                  <h3 className="mb-3 text-sm font-medium text-blue-300">Maqsad mamlakatlar</h3>
                  <input
                    className={`${inputCls} mb-2`}
                    placeholder="country_code (KR, PL)"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  />
                  <input
                    className={`${inputCls} mb-2`}
                    type="number"
                    placeholder="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <button type="button" className={btnGhost} disabled={loading} onClick={() => void onAddCountry()}>
                    Qo‘shish
                  </button>
                </div>
                <div className="rounded-xl border border-white/5 p-4">
                  <h3 className="mb-3 text-sm font-medium text-blue-300">Hujjat</h3>
                  <input className={`${inputCls} mb-2`} value={docType} onChange={(e) => setDocType(e.target.value)} />
                  <input
                    type="file"
                    className="mb-2 w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:text-white"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  />
                  <button type="button" className={btnGhost} disabled={loading} onClick={() => void onUploadDoc()}>
                    Yuklash
                  </button>
                </div>
              </div>
              <button
                type="button"
                className={`${btnPrimary} mt-6`}
                onClick={() => setStep('submit')}
              >
                Keyingi: ariza yuborish
              </button>
            </section>
          </div>
        )}

        {step === 'submit' && (
          <section className="rounded-2xl border border-white/10 bg-[#111827] p-6 md:p-8">
            <h2 className="mb-1 text-base font-semibold">4-qadam — Ariza (PENDING)</h2>
            <p className="mb-6 text-sm text-white/55">
              POST /candidate/submit — profil ID: {getCandidateProfileId() ?? '—'}
            </p>
            <button type="button" className={btnPrimary} disabled={loading} onClick={() => void onSubmitApplication()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Arizani yuborish
            </button>
            <button type="button" className={`${btnGhost} ml-2`} onClick={() => setStep('fill')}>
              Orqaga
            </button>
          </section>
        )}

        {step === 'submitted' && (
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 md:p-8">
            <h2 className="mb-2 text-base font-semibold text-amber-200">Ariza qabul qilindi</h2>
            <p className="mb-4 text-sm text-white/70">
              Holat: <strong>{statusLabel}</strong>. Admin ko‘rib chiqguncha kuting (5-qadam).
            </p>
            <button type="button" className={btnPrimary} onClick={() => setStep('vacancies')}>
              Faol vakansiyalarni ko‘rish
            </button>
          </section>
        )}

        {step === 'vacancies' && (
          <section className="rounded-2xl border border-white/10 bg-[#111827] p-6 md:p-8">
            <h2 className="mb-1 text-base font-semibold">6-qadam — Vakansiyalar (ACTIVE)</h2>
            <p className="mb-4 text-sm text-white/55">GET /vacancies?status=ACTIVE</p>
            <div className="mb-4 flex flex-wrap gap-2">
              <input
                className={`${inputCls} max-w-[10rem]`}
                placeholder="countryCode"
                value={vacCountry}
                onChange={(e) => setVacCountry(e.target.value)}
              />
              <input
                className={`${inputCls} max-w-[10rem]`}
                placeholder="professionId"
                value={vacProfessionId}
                onChange={(e) => setVacProfessionId(e.target.value)}
              />
              <button type="button" className={btnGhost} disabled={vacLoading} onClick={() => void loadVacancies()}>
                {vacLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Qidirish
              </button>
            </div>
            <ul className="space-y-3">
              {vacancies.length === 0 && !vacLoading ? (
                <li className="text-sm text-white/45">Natija yo‘q yoki API boshqacha formatda.</li>
              ) : (
                vacancies.map((v, i) => (
                  <li
                    key={pickStr(v, 'id', 'vacancy_id') || String(i)}
                    className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-sm"
                  >
                    <div className="font-medium text-white">{pickStr(v, 'title', 'employer_name', 'employerName') || 'Vakansiya'}</div>
                    <div className="mt-1 text-white/55">
                      {pickStr(v, 'country_code', 'countryCode')} · {pickStr(v, 'city', 'description').slice(0, 120)}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        )}

        <p className="mt-10 text-center text-[11px] text-white/35">
          DRAFT → PENDING → ACTIVE → PLACED · SUSPENDED rad / to‘xtatish
        </p>
      </main>
    </div>
  );
}
