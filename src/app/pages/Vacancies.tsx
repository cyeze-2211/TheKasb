import { useState } from 'react';
import { Link } from 'react-router';
import { CircleAlert, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { mockVacancies, COUNTRIES } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { FilterPanel } from '../components/FilterPanel';
import {
  btnPrimary,
  ctlSelect,
  iconAction,
  iconActionDanger,
  pageKicker,
  panelElite,
  rowElite,
  theadElite,
} from '../components/pageChrome';

export function Vacancies() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const experienceLabels: Record<string, string> = {
    YEAR_1_3: '1-3 yil',
    YEAR_3_5: '3-5 yil',
    YEAR_5_PLUS: '5+ yil',
  };

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
          <h1 className="mb-1">Vakansiyalar</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
            Barcha vakansiyalarni boshqarish
          </p>
        </div>
        <Link to="/admin/vacancies/create" className={`${btnPrimary} h-10 min-h-10`}>
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Yangi vakansiya
        </Link>
      </div>

      <FilterPanel
        id="vacancies-filters"
        title="Filtrlar va saralash"
        collapsible
        expanded={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
      >
        <div className="flex flex-wrap gap-3">
          <select className={`${ctlSelect} min-w-[10rem] max-w-full flex-1 sm:max-w-[11.5rem]`} defaultValue="">
            <option value="">Status — barchasi</option>
            <option>DRAFT (Qoralama)</option>
            <option>ACTIVE (Faol)</option>
            <option>CLOSED (Yopiq)</option>
            <option>ARCHIVED (Arxiv)</option>
          </select>
          <select className={`${ctlSelect} min-w-[10rem] max-w-full flex-1 sm:max-w-[13rem]`} defaultValue="">
            <option value="">Mamlakat — barchasi</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          <select className={`${ctlSelect} min-w-[9rem] max-w-full flex-1 sm:max-w-[11rem]`} defaultValue="">
            <option value="">Kategoriya</option>
            <option>Oshpazchilik</option>
            <option>Qurilish</option>
            <option>Tibbiyot</option>
          </select>
          <select className={`${ctlSelect} min-w-[8rem] max-w-full flex-1 sm:max-w-[10rem]`} defaultValue="">
            <option value="">Kasb</option>
          </select>
          <select className={`${ctlSelect} min-w-[10rem] max-w-full flex-1 sm:max-w-[12rem]`} defaultValue="">
            <option value="">Shoshilinch — barchasi</option>
            <option>Ha</option>
            <option>Yo&apos;q</option>
          </select>
          <select className={`${ctlSelect} min-w-[9rem] max-w-full flex-1 sm:max-w-[11rem]`} defaultValue="">
            <option value="">Yaratuvchi</option>
          </select>
        </div>
      </FilterPanel>

      <div className={panelElite}>
        <div className="border-b border-border/80 bg-gradient-to-r from-muted/30 to-transparent px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0">Barcha vakansiyalar</h2>
            <span className="rounded-full border border-border/60 bg-surface px-2.5 py-1 text-sm font-semibold tabular-nums text-text-muted shadow-[var(--elite-shadow-xs)]">
              {mockVacancies.length} ta
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theadElite}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Sarlavha
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Mamlakat
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Kasb / Kategoriya
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tajriba</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Shoshilinch
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Yaratuvchi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockVacancies.map((vacancy) => {
                const country = COUNTRIES.find((c) => c.code === vacancy.country);
                return (
                  <tr key={vacancy.id} className={rowElite}>
                    <td className="px-6 py-3">
                      <div className="font-medium text-text-primary">{vacancy.title.split(' — ')[0]}</div>
                      <div className="text-xs text-text-muted">{vacancy.title.split(' — ')[1]}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{country?.flag}</span>
                        <span className="text-sm text-text-muted">{vacancy.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm text-text-primary">{vacancy.profession}</div>
                      <div className="text-xs text-text-muted">{vacancy.category}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-text-muted">
                      {experienceLabels[vacancy.experience]}
                    </td>
                    <td className="px-6 py-3">
                      {vacancy.urgent ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger">
                          <CircleAlert className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                          HA
                        </span>
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={vacancy.status} type="vacancy" />
                    </td>
                    <td className="px-6 py-3 text-sm text-text-muted">{vacancy.creator}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-0.5">
                        <button type="button" className={iconAction} title="Ko&apos;rish">
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <Link
                          to={`/admin/vacancies/${vacancy.id}/edit`}
                          className={iconAction}
                          title="Tahrirlash"
                        >
                          <Edit className="h-4 w-4" strokeWidth={2} />
                        </Link>
                        <button type="button" className={iconActionDanger} title="O&apos;chirish">
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
