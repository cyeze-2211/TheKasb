import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { COUNTRIES } from '../data/mockData';
import {
  assignCandidateAgent,
  axiosErrorMessage,
  fetchCandidateById,
  pickCandidateField,
  pickNum,
  pickStr,
  updateCandidateProfileStatus,
  type AdminProfileStatus,
} from '../api/candidates';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  UserCog,
  XCircle,
} from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  btnPrimary,
  ctlInput,
  pageKicker,
  panelElite,
  panelEliteRaised,
  theadElite,
} from '../components/pageChrome';

const languageFlags: Record<string, string> = {
  RUSSIAN: '🇷🇺 Rus tili',
  ENGLISH: '🇬🇧 Ingliz tili',
  GERMAN: '🇩🇪 Nemis tili',
  KOREAN: '🇰🇷 Koreys tili',
  TURKISH: '🇹🇷 Turk tili',
  POLISH: '🇵🇱 Polyak tili',
  OTHER: '🌐 Boshqa',
};

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

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [statusSaving, setStatusSaving] = useState(false);
  const [agentIdInput, setAgentIdInput] = useState('');
  const [agentSaving, setAgentSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!candidateRouteId) {
      setErr('Noto‘g‘ri ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    setActionMsg(null);
    try {
      const d = await fetchCandidateById(candidateRouteId);
      setDetail(d);
      if (!d) setErr('Ma’lumot topilmadi.');
      const ag = pickNum(d, 'agent_id', 'agentId', 'assigned_agent_id');
      if (ag != null) setAgentIdInput(String(ag));
    } catch (e) {
      setErr(axiosErrorMessage(e, 'Yuklashda xato.'));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [candidateRouteId]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const region = useMemo(
    () =>
      detail
        ? pickStr(
            detail,
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
      setActionMsg(checked ? 'Profil faollashtirildi.' : 'Profil to‘xtatildi (SUSPENDED).');
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

  const languages = useMemo(() => {
    const raw = detail ? pickCandidateField(detail, 'languages', 'language_items') : undefined;
    return Array.isArray(raw) ? raw : [];
  }, [detail]);

  const targetCountries = useMemo(() => {
    const raw = detail
      ? pickCandidateField(detail, 'target_countries', 'targetCountries', 'country_codes', 'targetCountryCodes')
      : undefined;
    if (Array.isArray(raw)) return raw.map((x) => String(x));
    const s = detail ? pickStr(detail, 'target_countries', 'targetCountries') : '';
    if (s.includes(',')) return s.split(',').map((x) => x.trim());
    return [];
  }, [detail]);

  const tabs = [
    { id: 'basic', label: 'Asosiy' },
    { id: 'languages', label: 'Tillar' },
    { id: 'countries', label: 'Mamlakatlar' },
    { id: 'json', label: 'Barcha ma‘lumot' },
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
  const salMin = pickNum(detail, 'salary_min', 'salaryMin', 'expected_salary_min');
  const salMax = pickNum(detail, 'salary_max', 'salaryMax', 'expected_salary_max');
  const currency = pickStr(detail, 'currency', 'salary_currency', 'salaryCurrency') || 'USD';
  const score = pickNum(detail, 'score', 'profile_score', 'profileScore');
  const category = pickStr(detail, 'category_name', 'categoryName', 'category');
  const profession = pickStr(detail, 'profession_name', 'professionName', 'profession');
  const registeredAt = pickStr(detail, 'created_at', 'createdAt', 'registered_at', 'registeredAt');
  const lastLogin = pickStr(detail, 'last_login_at', 'lastLoginAt', 'last_login', 'lastLogin');

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

      {actionMsg ? (
        <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-2 text-sm text-text-primary">
          {actionMsg}
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

            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-background/80 px-4 py-3 shadow-[var(--elite-shadow-xs)] transition-colors duration-300 hover:border-primary/20">
                <div className="min-w-0 space-y-0.5">
                  <Label htmlFor="profile-active" className="text-sm font-medium text-text-primary">
                    Profil faol
                  </Label>
                  <p className="text-xs text-text-muted">ACTIVE / SUSPENDED (dark mode kabi)</p>
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
                  <Input
                    type="number"
                    className={ctlInput}
                    placeholder="agent_id"
                    value={agentIdInput}
                    onChange={(e) => setAgentIdInput(e.target.value)}
                  />
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
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-text-muted" strokeWidth={2} aria-hidden />
                <span className="text-text-muted">Ro‘yxatdan:</span>
                <span className="text-text-primary">{registeredAt || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0 text-text-muted" strokeWidth={2} aria-hidden />
                <span className="text-text-muted">Oxirgi kirish:</span>
                <span className="text-text-primary">{lastLogin || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                Holat: <span className="font-medium text-text-primary">{profileStatus || '—'}</span>
              </div>
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
                    <div className="text-sm text-text-primary">{category || '—'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-text-muted">Kasb</div>
                    <div className="text-sm text-text-primary">{profession || '—'}</div>
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
                </div>
              )}

              {activeTab === 'languages' && (
                <div className="space-y-4">
                  {languages.length === 0 ? (
                    <p className="text-sm text-text-muted">Tillar ro‘yxati yo‘q yoki format boshqacha.</p>
                  ) : (
                    <table className="w-full">
                      <thead className={theadElite}>
                        <tr>
                          <th className="pb-3 text-left text-xs font-semibold uppercase text-text-muted">Til</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase text-text-muted">Daraja</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase text-text-muted">Boshqa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {languages.map((lang, i) => {
                          const L = lang as Record<string, unknown>;
                          const code = pickStr(L, 'language', 'lang', 'code');
                          const level = pickStr(L, 'level', 'language_level', 'languageLevel');
                          const cert = pickCandidateField(L, 'has_certificate', 'hasCertificate', 'certified');
                          return (
                            <tr key={i}>
                              <td className="py-3 text-sm text-text-primary">
                                {languageFlags[code] ?? ''} {code || JSON.stringify(L)}
                              </td>
                              <td className="py-3">
                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                  {level || '—'}
                                </span>
                              </td>
                              <td className="py-3 text-sm">
                                {typeof cert === 'boolean' ? (
                                  cert ? (
                                    <span className="inline-flex items-center gap-1 text-success">
                                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                      Bor
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-text-muted">
                                      <XCircle className="h-3.5 w-3.5 opacity-70" aria-hidden />
                                      Yo‘q
                                    </span>
                                  )
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'countries' && (
                <div className="space-y-3">
                  {targetCountries.length === 0 ? (
                    <p className="text-sm text-text-muted">Mamlakatlar yo‘q.</p>
                  ) : (
                    targetCountries.map((code, index) => {
                      const country = COUNTRIES.find((c) => c.code === code);
                      return (
                        <div
                          key={`${code}-${index}`}
                          className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all duration-200 hover:border-primary/20 hover:bg-muted/40"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {index + 1}
                          </div>
                          <span className="text-2xl">{country?.flag ?? '🌍'}</span>
                          <span className="text-sm font-medium text-text-primary">
                            {country?.name ?? code}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'json' && (
                <div className="space-y-3">
                  <p className="text-xs text-text-muted">
                    API javobi — maydon nomlari backend bilan mos kelishi mumkin (snake_case / camelCase).
                  </p>
                  <pre className="max-h-[min(70vh,560px)] overflow-auto rounded-xl border border-border/80 bg-muted/20 p-4 text-[11px] leading-relaxed text-text-primary">
                    {JSON.stringify(detail, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className={`${panelElite} mt-6 p-6`}>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
              Qo‘shimcha bloklar
            </h3>
            <p className="mb-4 text-sm text-text-muted">
              Ta’lim, ko‘nikmalar va hujjatlar API dagi kalitlar bilan kelganda shu yerda kengaytiramiz.
              Hozircha to‘liq struktura «Barcha ma‘lumot» yorlig‘ida.
            </p>
            <div className="rounded-lg border border-dashed border-border/80 p-4 text-center text-sm text-text-muted">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" aria-hidden />
              education / skills / documents — JSON dan tekshiring
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
