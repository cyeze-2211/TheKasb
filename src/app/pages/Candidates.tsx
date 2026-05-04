import { useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { mockCandidates, REGIONS, COUNTRIES } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
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

const languageFlags: Record<string, string> = {
  RUSSIAN: '🇷🇺',
  ENGLISH: '🇬🇧',
  GERMAN: '🇩🇪',
  KOREAN: '🇰🇷',
  TURKISH: '🇹🇷',
  POLISH: '🇵🇱',
};

export function Candidates() {
  const [showFilters, setShowFilters] = useState(true);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleRow = (id: number) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  };

  const getScoreDots = (score: number) => {
    const filled = Math.round((score / 100) * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < filled ? 'text-current' : 'text-gray-300'}>
        ●
      </span>
    ));
  };

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">Nomzodlar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Barcha nomzodlarni boshqarish va filtrlash
        </p>
      </div>

      <FilterPanel
        id="candidates-filters"
        collapsible
        expanded={showFilters}
        onToggle={() => setShowFilters((v) => !v)}
      >
        <div className="space-y-4">
            <div className={filterFieldGrid}>
              <select className={ctlSelect} defaultValue="">
                <option value="">Holat — barchasi</option>
                <option>PENDING</option>
                <option>REVIEWING</option>
                <option>APPROVED</option>
                <option>REJECTED</option>
              </select>
              <select className={ctlSelect} defaultValue="">
                <option value="">Viloyat — barchasi</option>
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <select className={ctlSelect} defaultValue="">
                <option value="">Kasb kategoriyasi</option>
                <option>Oshpazchilik</option>
                <option>Qurilish</option>
                <option>Tibbiyot</option>
              </select>
              <select className={ctlSelect} defaultValue="">
                <option value="">Kasb</option>
              </select>
              <select className={ctlSelect} defaultValue="">
                <option value="">Agent</option>
              </select>
            </div>

            <div className={filterFieldGrid}>
              <select className={ctlSelect} defaultValue="">
                <option value="">Tajriba</option>
                <option>1-3 yil</option>
                <option>3-5 yil</option>
                <option>5+ yil</option>
              </select>
              <select className={ctlSelect} defaultValue="">
                <option value="">Mavjudligi</option>
                <option>Hozir tayyor</option>
                <option>1 oy ichida</option>
                <option>3 oy ichida</option>
              </select>
              <select className={ctlSelect} defaultValue="">
                <option value="">Maqsad mamlakat</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <select className={ctlSelect} defaultValue="">
                <option value="">Til</option>
                <option>Rus tili</option>
                <option>Ingliz tili</option>
                <option>Nemis tili</option>
              </select>
              <select className={ctlSelect} defaultValue="">
                <option value="">Til darajasi</option>
                <option>A1</option>
                <option>A2</option>
                <option>B1</option>
                <option>B2</option>
                <option>C1</option>
                <option>C2</option>
              </select>
            </div>

            <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-text-muted">Maosh</span>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="number" placeholder="Min" className={`${ctlInput} w-28 sm:w-32`} />
                  <span className="text-text-muted">—</span>
                  <input type="number" placeholder="Max" className={`${ctlInput} w-28 sm:w-32`} />
                </div>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <button type="button" className={btnPrimary}>
                  <Search className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Qidirish
                </button>
                <button type="button" className={btnSecondary}>
                  Tozalash
                </button>
              </div>
            </div>

            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {activeFilters.map((filter, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {filter}
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-primary hover:bg-primary/15"
                      aria-label={`${filter} olib tashlash`}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
        </div>
      </FilterPanel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="m-0">Nomzodlar</h2>
          <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-text-muted">
            {mockCandidates.length.toLocaleString('ru-RU')} ta topildi
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnSecondary}>
            <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
            Export
          </button>
          <button type="button" className={btnSecondary}>
            <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden />
            Yangilash
          </button>
          <button type="button" className={btnSecondary}>
            Jadval
            <ChevronDown className="h-4 w-4 opacity-70" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      {selectedRows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/[0.12] to-primary/[0.06] p-4 shadow-[var(--elite-shadow-sm)] ring-1 ring-primary/10 backdrop-blur-sm">
          <span className="text-sm font-medium text-primary">
            {selectedRows.length} ta tanlangan
          </span>
          <button
            type="button"
            className="h-8 rounded-md border border-primary px-3 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Status o&apos;zgartirish
          </button>
          <button
            type="button"
            className="h-8 rounded-md border border-primary px-3 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Agent belgilash
          </button>
          <button
            type="button"
            className="h-8 px-3 text-xs font-medium text-text-muted transition-colors hover:text-danger"
            onClick={() => setSelectedRows([])}
          >
            Tanlovni bekor qilish
          </button>
        </div>
      ) : null}

      <div className={panelElite}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theadElite}>
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input type="checkbox" className="h-4 w-4 rounded border-border" aria-label="Barchasini tanlash" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Ism / Telefon
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Viloyat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kasb</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tajriba</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tillar</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Mamlakat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Maosh kutishi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Ball</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Holat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockCandidates.map((candidate) => {
                const experienceLabels: Record<string, string> = {
                  YEAR_1_3: '1-3 yil',
                  YEAR_3_5: '3-5 yil',
                  YEAR_5_PLUS: '5+ yil',
                };
                return (
                  <tr
                    key={candidate.id}
                    className={`${rowElite} ${selectedRows.includes(candidate.id) ? 'bg-accent/80' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={selectedRows.includes(candidate.id)}
                        onChange={() => toggleRow(candidate.id)}
                        aria-label={`${candidate.name} tanlash`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-text-primary">{candidate.name}</div>
                      <div className="mono text-xs text-text-muted">{candidate.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {candidate.region.split(' ')[0]}
                      <br />
                      {candidate.region.split(' ').slice(1).join(' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{candidate.profession}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {experienceLabels[candidate.experience]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {candidate.languages.map((lang, i) => (
                          <span key={i} className="text-xs">
                            {languageFlags[lang.lang]} {lang.level}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {candidate.targetCountries.map((code) => {
                          const country = COUNTRIES.find((c) => c.code === code);
                          return <span key={code}>{country?.flag}</span>;
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-text-primary">
                        ${candidate.salaryMin.toLocaleString()}–${candidate.salaryMax.toLocaleString()}
                      </div>
                      <div className="text-xs text-text-muted">{candidate.currency}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 text-sm ${getScoreColor(candidate.score)}`}>
                        {getScoreDots(candidate.score)} {candidate.score}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={candidate.status} type="profile" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/admin/candidates/${candidate.id}`}
                          className={iconAction}
                          title="Ko&apos;rish"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </Link>
                        <button type="button" className={iconAction} title="Tahrirlash">
                          <Edit className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <div className="text-sm text-text-muted">
            1–{mockCandidates.length} / 10,847 ta
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${btnSecondary} disabled:pointer-events-none disabled:opacity-50`}
              disabled
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Oldingi
            </button>
            <button
              type="button"
              className="h-9 min-w-9 rounded-md border border-primary bg-primary text-sm font-medium text-white"
            >
              1
            </button>
            <button type="button" className="h-9 min-w-9 rounded-md border border-border bg-surface text-sm font-medium hover:bg-muted">
              2
            </button>
            <button type="button" className="h-9 min-w-9 rounded-md border border-border bg-surface text-sm font-medium hover:bg-muted">
              3
            </button>
            <span className="text-text-muted">…</span>
            <button type="button" className="h-9 min-w-9 rounded-md border border-border bg-surface text-sm font-medium hover:bg-muted">
              48
            </button>
            <button type="button" className={btnSecondary}>
              Keyingi
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
