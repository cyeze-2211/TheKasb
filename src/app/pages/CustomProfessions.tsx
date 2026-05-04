import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { mockCustomProfessions } from '../data/mockData';
import { FilterPanel } from '../components/FilterPanel';
import {
  btnPrimary,
  btnPrimaryLg,
  btnSecondary,
  ctlInputLg,
  ctlSelect,
  ctlSelectLg,
  pageKicker,
  panelElite,
  rowElite,
  theadElite,
} from '../components/pageChrome';

export function CustomProfessions() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState<(typeof mockCustomProfessions)[0] | null>(
    null,
  );

  const openApproveModal = (prof: (typeof mockCustomProfessions)[0]) => {
    setSelectedProfession(prof);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">Maxsus kasblar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Nomzodlar tomonidan yaratilgan kasblarni tasdiqlash
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-warning/35 bg-gradient-to-r from-warning/12 to-warning/5 p-4 shadow-sm transition-[box-shadow] duration-300 hover:shadow-md">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" strokeWidth={2} aria-hidden />
        <div className="text-sm text-text-primary">
          <strong>Diqqat:</strong> Nomzodlar o&apos;zlari yozgan, rasmiy ro&apos;yxatda yo&apos;q kasblar.
          Ko&apos;rib chiqib, rasmiy kasb sifatida qabul qiling yoki rad eting.
        </div>
      </div>

      <FilterPanel
        id="custom-professions-filters"
        title="Filtr"
        collapsible
        expanded={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
      >
        <div className="max-w-md">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Ko&apos;rib chiqilgan</label>
          <select className={ctlSelect} defaultValue="">
            <option value="">Barchasi</option>
            <option>Ha</option>
            <option>Yo&apos;q</option>
          </select>
        </div>
      </FilterPanel>

      <div className={panelElite}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theadElite}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Kasb nomi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Ishlatilish
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">
                  Ko&apos;rib chiqilgan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockCustomProfessions.map((prof) => (
                <tr key={prof.id} className={rowElite}>
                  <td className="px-6 py-3 text-sm font-medium text-text-primary">&quot;{prof.name}&quot;</td>
                  <td className="px-6 py-3 text-sm text-text-muted">{prof.usage} marta</td>
                  <td className="px-6 py-3 text-sm">
                    {prof.reviewed ? (
                      <span className="inline-flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                        Ha
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-text-muted">
                        <XCircle className="h-4 w-4 flex-shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                        Yo&apos;q
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {!prof.reviewed ? (
                      <button
                        type="button"
                        onClick={() => openApproveModal(prof)}
                        className={`${btnPrimary} h-8 px-4 text-xs`}
                      >
                        Tasdiqlash
                      </button>
                    ) : (
                      <span className="text-sm text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedProfession ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] transition-opacity duration-300">
          <div className="max-h-[90vh] w-full max-w-md animate-in fade-in zoom-in overflow-y-auto rounded-xl border border-border/90 bg-surface p-6 shadow-2xl ring-1 ring-black/[0.06] duration-200">
            <h2 className="m-0 text-lg">&quot;{selectedProfession.name}&quot;ni tasdiqlash</h2>
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">
                  Kategoriyaga bog&apos;lash
                </label>
                <select className={ctlSelectLg}>
                  <option>Transport va logistika</option>
                  <option>Oshpazchilik</option>
                  <option>Qurilish</option>
                  <option>Tibbiyot</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">
                  Rasmiy kasb nomi (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Yuk avtomobili haydovchisi"
                  className={ctlInputLg}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-4">
              <button type="button" onClick={() => setShowModal(false)} className={btnSecondary}>
                Bekor qilish
              </button>
              <button type="button" onClick={() => setShowModal(false)} className={btnPrimaryLg}>
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
