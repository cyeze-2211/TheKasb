import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { mockCandidates, COUNTRIES } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  MapPin,
  XCircle,
} from 'lucide-react';
import { btnPrimary, ctlSelect, pageKicker, panelElite, panelEliteRaised, theadElite } from '../components/pageChrome';

const languageFlags: any = {
  RUSSIAN: '🇷🇺 Rus tili',
  ENGLISH: '🇬🇧 Ingliz tili',
  GERMAN: '🇩🇪 Nemis tili',
  KOREAN: '🇰🇷 Koreys tili',
  TURKISH: '🇹🇷 Turk tili',
  POLISH: '🇵🇱 Polyak tili'
};

export function CandidateDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('basic');
  const candidate = mockCandidates.find(c => c.id === Number(id));

  if (!candidate) {
    return (
      <div className="p-6 text-sm text-text-muted">
        Nomzod topilmadi.{' '}
        <Link to="/admin/candidates" className="font-medium text-primary hover:underline">
          Ro&apos;yxatga qaytish
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Asosiy ma\'lumotlar' },
    { id: 'languages', label: 'Tillar' },
    { id: 'countries', label: 'Maqsad mamlakatlar' },
    { id: 'education', label: 'Ta\'lim' },
    { id: 'skills', label: 'Ko\'nikmalar' },
    { id: 'documents', label: 'Hujjatlar' }
  ];

  const experienceLabels: any = {
    YEAR_1_3: '1-3 yil',
    YEAR_3_5: '3-5 yil',
    YEAR_5_PLUS: '5+ yil'
  };

  const availabilityLabels: any = {
    READY_NOW: 'Hozir tayyor',
    WITHIN_1_MONTH: '1 oy ichida',
    WITHIN_3_MONTHS: '3 oy ichida'
  };

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      {/* Breadcrumb */}
      <p className={`${pageKicker} mb-1`}>The Kasb · Profil</p>
      <nav className="text-sm text-text-muted" aria-label="Breadcrumb">
        <Link to="/admin/candidates" className="text-primary hover:underline">
          Nomzodlar
        </Link>
        <span className="mx-1.5 text-text-muted">/</span>
        <span className="text-text-primary">Ko&apos;rish</span>
      </nav>

      <div className="flex gap-6 lg:gap-8">
        {/* Left Sidebar - Profile Card */}
        <div className="w-80 flex-shrink-0">
          <div className={`${panelEliteRaised} sticky top-6 space-y-4 p-6`}>
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <div
                  className="absolute -inset-1 rounded-full bg-primary/25 blur-lg motion-reduce:blur-none"
                  aria-hidden
                />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/10 text-3xl font-bold text-primary ring-2 ring-primary/25 ring-offset-2 ring-offset-background">
                  {candidate.name.split(' ').map((n) => n[0]).join('')}
                </div>
              </div>
              <h2 className="text-center mb-1">{candidate.name}</h2>
              <div className="text-sm mono text-text-muted mb-1">{candidate.phone}</div>
              <div className="flex items-center justify-center gap-1.5 text-sm text-text-muted">
                <MapPin className="h-4 w-4 flex-shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                {candidate.region}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              {/* Status Selector */}
              <div>
                <label className="block text-xs text-text-muted mb-1">Holat:</label>
                <select className={ctlSelect}>
                  <option>APPROVED</option>
                  <option>PENDING</option>
                  <option>REVIEWING</option>
                  <option>REJECTED</option>
                </select>
              </div>

              {/* Score */}
              <div>
                <label className="block text-xs text-text-muted mb-1">Ball:</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${candidate.score}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-text-primary">{candidate.score}%</span>
                </div>
              </div>

              {/* Agent Assignment */}
              <div>
                <label className="block text-xs text-text-muted mb-1">Agent:</label>
                <select className={ctlSelect}>
                  <option>Sardor A.</option>
                  <option>Kamola A.</option>
                  <option>Admin</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-text-muted" strokeWidth={2} aria-hidden />
                <span className="text-text-muted">Ro&apos;yxatdan:</span>
                <span className="text-text-primary">{candidate.registeredAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0 text-text-muted" strokeWidth={2} aria-hidden />
                <span className="text-text-muted">Oxirgi kirish:</span>
                <span className="text-text-primary">{candidate.lastLogin}</span>
              </div>
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                Tasdiqlangan
              </div>
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                Aktiv
              </div>
            </div>

            <button
              type="button"
              className={`${btnPrimary} h-10 w-full shadow-md shadow-primary/20 transition-[box-shadow,transform] duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.99]`}
            >
              Profil holatini saqlash
            </button>
          </div>
        </div>

        {/* Right Main Content - Tabs */}
        <div className="min-w-0 flex-1">
          <div className={panelElite}>
            {/* Tab Headers */}
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

            {/* Tab Content */}
            <div className="animate-in fade-in p-6 duration-300" key={activeTab}>
              {activeTab === 'basic' && (
                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  <div>
                    <div className="text-xs text-text-muted mb-1">Oilaviy holat</div>
                    <div className="text-sm text-text-primary">Bo'ydoq</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted mb-1">Kasb kategoriyasi</div>
                    <div className="text-sm text-text-primary">{candidate.category}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted mb-1">Ta'lim darajasi</div>
                    <div className="text-sm text-text-primary">Oliy</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted mb-1">Kasb</div>
                    <div className="text-sm text-text-primary">{candidate.profession}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted mb-1">Tajriba</div>
                    <div className="text-sm text-text-primary">{experienceLabels[candidate.experience]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted mb-1">Maosh kutishi</div>
                    <div className="text-sm text-text-primary">
                      ${candidate.salaryMin.toLocaleString()} – ${candidate.salaryMax.toLocaleString()} ({candidate.currency})
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted mb-1">Mavjudligi</div>
                    <div className="text-sm text-text-primary">{availabilityLabels[candidate.availability]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted mb-1">Ma'lumot roziligi</div>
                    <div className="flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                      Ha
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'languages' && (
                <div className="space-y-4">
                  <table className="w-full">
                    <thead className={theadElite}>
                      <tr>
                        <th className="text-left pb-3 text-xs font-semibold text-text-muted uppercase">Til</th>
                        <th className="text-left pb-3 text-xs font-semibold text-text-muted uppercase">Daraja</th>
                        <th className="text-left pb-3 text-xs font-semibold text-text-muted uppercase">Sertifikat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {candidate.languages.map((lang, i) => (
                        <tr key={i}>
                          <td className="py-3 text-sm text-text-primary">{languageFlags[lang.lang]}</td>
                          <td className="py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                              {lang.level}
                            </span>
                          </td>
                          <td className="py-3 text-sm">
                            {lang.hasCert ? (
                              <span className="inline-flex items-center gap-1 text-success">
                                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                                Bor
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-text-muted">
                                <XCircle className="h-3.5 w-3.5 opacity-70" strokeWidth={2} aria-hidden />
                                Yo&apos;q
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'countries' && (
                <div className="space-y-3">
                  <p className="text-sm text-text-muted mb-4">Quyidagi tartibda mamlakatlar ko'rsatilgan:</p>
                  {candidate.targetCountries.map((code, index) => {
                    const country = COUNTRIES.find(c => c.code === code);
                    return (
                      <div
                        key={code}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all duration-200 hover:border-primary/20 hover:bg-muted/40 hover:shadow-sm"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {index + 1}
                        </div>
                        <span className="text-2xl">{country?.flag}</span>
                        <span className="text-sm font-medium text-text-primary">{country?.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'education' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <GraduationCap className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary mb-1">Oliy ta'lim</h3>
                        <div className="text-sm text-text-primary mb-1">Toshkent Davlat Texnika Universiteti</div>
                        <div className="text-sm text-text-muted mb-1">Ixtisosi: Mexanika muhandisligi</div>
                        <div className="text-xs text-text-muted">Bitirgan: 2019 yil · O'zbekiston</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="flex flex-wrap gap-2">
                  {['Haydovchilik', 'Excel', 'Payvandlash', 'Rus tili', 'MS Word', 'Jamoa bilan ishlash', 'Tezkor o\'rganish'].map(skill => (
                    <span key={skill} className="px-3 py-1.5 rounded-full bg-muted border border-border text-sm text-text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {activeTab === 'documents' && (
                <div>
                  <table className="w-full">
                    <thead className={theadElite}>
                      <tr>
                        <th className="text-left pb-3 text-xs font-semibold text-text-muted uppercase">Hujjat turi</th>
                        <th className="text-left pb-3 text-xs font-semibold text-text-muted uppercase">Fayl</th>
                        <th className="text-left pb-3 text-xs font-semibold text-text-muted uppercase">Yuklangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-3 text-sm text-text-primary">Pasport</td>
                        <td className="py-3 text-sm">
                          <span className="inline-flex items-center gap-1.5 text-primary">
                            <FileText className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                            passport.pdf
                          </span>
                        </td>
                        <td className="py-3 text-sm text-text-muted">12.03.2025</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
