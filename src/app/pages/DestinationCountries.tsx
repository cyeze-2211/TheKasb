import { useCallback, useEffect, useMemo, useState } from 'react';
import { Globe, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import {
  createAdminDestinationCountry,
  deleteAdminDestinationCountry,
  fetchAdminDestinationCountries,
  fetchAdminDestinationCountryById,
  patchAdminDestinationCountry,
  type AdminDestinationCountry,
  type DestinationCountryWriteBody,
} from '../api/destinationCountries';
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
import { Switch } from '../components/ui/switch';
import {
  btnPrimary,
  btnPrimaryLg,
  btnSecondary,
  btnSecondaryLg,
  ctlInput,
  ctlInputLg,
  ctlTextarea,
  iconAction,
  iconActionDanger,
  pageKicker,
  panelElite,
  rowElite,
  theadElite,
} from '../components/pageChrome';

type ActiveFilter = '' | 'true' | 'false';

function formatSalary(c: AdminDestinationCountry): string {
  const cur = c.salary_currency?.trim() || '—';
  const min = c.salary_min;
  const max = c.salary_max;
  if (typeof min === 'number' && typeof max === 'number') return `${min}–${max} ${cur}`;
  if (typeof min === 'number') return `${min}+ ${cur}`;
  if (typeof max === 'number') return `≤${max} ${cur}`;
  return cur;
}

export function DestinationCountries() {
  const [items, setItems] = useState<AdminDestinationCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [countryCode, setCountryCode] = useState('');
  const [flagEmoji, setFlagEmoji] = useState('');
  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [languageReq, setLanguageReq] = useState('');
  const [note, setNote] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('AED');
  const [salaryMin, setSalaryMin] = useState('0');
  const [salaryMax, setSalaryMax] = useState('0');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<AdminDestinationCountry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await fetchAdminDestinationCountries();
      setItems(list);
    } catch (e: unknown) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Ro‘yxatni yuklashda xato.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const nextSortOrder = useMemo(() => {
    if (!items.length) return 0;
    return Math.max(...items.map((c) => c.sort_order ?? 0), 0) + 1;
  }, [items]);

  const filtered = useMemo(() => {
    if (activeFilter === 'true') return items.filter((c) => c.is_active !== false);
    if (activeFilter === 'false') return items.filter((c) => c.is_active === false);
    return items;
  }, [items, activeFilter]);

  function resetFormForCreate() {
    setEditingId(null);
    setCountryCode('');
    setFlagEmoji('');
    setNameUz('');
    setNameRu('');
    setLanguageReq('');
    setNote('');
    setSalaryCurrency('AED');
    setSalaryMin('0');
    setSalaryMax('0');
    setSortOrder(String(nextSortOrder));
    setIsActive(true);
    setSaveError(null);
  }

  function applyDto(d: AdminDestinationCountry) {
    setEditingId(d.id);
    setCountryCode(d.country_code ?? '');
    setFlagEmoji(d.flag_emoji ?? '');
    setNameUz(d.name_uz ?? '');
    setNameRu(d.name_ru ?? '');
    setLanguageReq(d.language_req ?? '');
    setNote(d.note ?? '');
    setSalaryCurrency(d.salary_currency?.trim() || 'AED');
    setSalaryMin(String(d.salary_min ?? 0));
    setSalaryMax(String(d.salary_max ?? 0));
    setSortOrder(String(d.sort_order ?? 0));
    setIsActive(d.is_active !== false);
    setSaveError(null);
  }

  function openCreate() {
    setDialogMode('create');
    resetFormForCreate();
    setDialogOpen(true);
  }

  async function openEdit(row: AdminDestinationCountry) {
    setDialogMode('edit');
    setEditingId(row.id);
    setDialogOpen(true);
    setDetailLoading(true);
    setSaveError(null);
    try {
      const one = await fetchAdminDestinationCountryById(row.id);
      if (one) applyDto(one);
      else applyDto(row);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Ma’lumotni yuklashda xato.');
      applyDto(row);
    } finally {
      setDetailLoading(false);
    }
  }

  function buildBody(): DestinationCountryWriteBody {
    const smin = Number(salaryMin);
    const smax = Number(salaryMax);
    const sort = Number(sortOrder);
    const body: DestinationCountryWriteBody = {
      flag_emoji: flagEmoji.trim(),
      is_active: isActive,
      language_req: languageReq.trim(),
      name_ru: nameRu.trim(),
      name_uz: nameUz.trim(),
      note: note.trim(),
      salary_currency: salaryCurrency.trim().toUpperCase() || 'AED',
      salary_min: Number.isFinite(smin) ? smin : 0,
      salary_max: Number.isFinite(smax) ? smax : 0,
      sort_order: Number.isFinite(sort) ? Math.trunc(sort) : 0,
    };
    const cc = countryCode.trim().toUpperCase();
    if (cc) body.country_code = cc;
    return body;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const nu = nameUz.trim();
    const nr = nameRu.trim();
    if (!nu) {
      setSaveError('O‘zbekcha nom kiriting.');
      return;
    }
    if (!nr) {
      setSaveError('Ruscha nom kiriting.');
      return;
    }
    const body = buildBody();
    setSaving(true);
    try {
      if (dialogMode === 'create') {
        await createAdminDestinationCountry(body);
      } else {
        if (!editingId) throw new Error('Yozuv tanlanmagan.');
        await patchAdminDestinationCountry(editingId, body);
      }
      setDialogOpen(false);
      await loadList();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Saqlashda xato.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteAdminDestinationCountry(deleteTarget.id);
      setDeleteTarget(null);
      await loadList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'O‘chirishda xato.');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
          <h1 className="mb-1">Maqsad mamlakatlar</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
            Vakansiya va nomzod oqimlarida ko‘rinadigan mamlakatlar katalogi (CRUD)
          </p>
        </div>
        <button type="button" onClick={() => openCreate()} className={`${btnPrimary} h-10 min-h-10`}>
          <Plus className="h-4 w-4" aria-hidden />
          Yangi mamlakat
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border/80 bg-surface/80 p-4 shadow-sm">
        <div className="min-w-[200px] max-w-xs flex-1">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Holat</label>
          <select
            className={ctlInput}
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
          >
            <option value="">Barchasi</option>
            <option value="true">Faol</option>
            <option value="false">Nofaol</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => void loadList()}
          disabled={loading}
          className={`${btnSecondary} inline-flex items-center gap-2`}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Yangilash
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className={panelElite}>
        <div className="overflow-x-auto">
          {loading && !items.length ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Yuklanmoqda…
            </div>
          ) : (
            <table className="w-full">
              <thead className={theadElite}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Bayroq</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Nom (UZ)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kod</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Maosh</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tartib</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Faol</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-text-muted">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">
                      Yozuvlar yo‘q
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className={rowElite}>
                      <td className="px-6 py-3 text-xl leading-none" title={row.flag_emoji}>
                        {row.flag_emoji || '—'}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-text-primary">{row.name_uz || '—'}</td>
                      <td className="px-6 py-3 font-mono text-sm text-text-muted">{row.country_code || '—'}</td>
                      <td className="px-6 py-3 text-sm text-text-muted">{formatSalary(row)}</td>
                      <td className="px-6 py-3 text-sm text-text-muted">{row.sort_order ?? 0}</td>
                      <td className="px-6 py-3 text-sm">{row.is_active === false ? 'Yo‘q' : 'Ha'}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className={iconAction}
                            title="Tahrirlash"
                            onClick={() => void openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={iconActionDanger}
                            title="O‘chirish"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(92vh,800px)] gap-0 overflow-hidden border-border/90 p-0 sm:max-w-lg [box-shadow:var(--elite-inset),var(--elite-shadow-lg)]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-sky-600 via-primary to-indigo-500"
            aria-hidden
          />
          <div className="relative border-b border-border/80 bg-gradient-to-br from-primary/[0.1] via-sky-500/[0.05] to-transparent px-6 pb-4 pt-5">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-primary">
                <Globe className="h-5 w-5" aria-hidden />
                <DialogTitle className="text-lg">
                  {dialogMode === 'create' ? 'Yangi mamlakat' : 'Mamlakatni tahrirlash'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-text-muted">
                POST / PATCH <code className="rounded bg-muted px-1">/api/admin/destination-countries</code>
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex max-h-[calc(92vh-12rem)] flex-col">
            <div className="space-y-4 overflow-y-auto px-6 py-4">
              {detailLoading ? (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Yuklanmoqda…
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Mamlakat kodi (ixtiyoriy)</label>
                <input
                  className={ctlInputLg}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="masalan: AE"
                  maxLength={8}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Bayroq (emoji)</label>
                <input
                  className={ctlInputLg}
                  value={flagEmoji}
                  onChange={(e) => setFlagEmoji(e.target.value)}
                  placeholder="🇦🇪"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Nom (O‘zbekcha) *</label>
                <input
                  className={ctlInputLg}
                  value={nameUz}
                  onChange={(e) => setNameUz(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Nom (Ruscha) *</label>
                <input
                  className={ctlInputLg}
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Til talabi</label>
                <input
                  className={ctlInputLg}
                  value={languageReq}
                  onChange={(e) => setLanguageReq(e.target.value)}
                  placeholder="masalan: Ingliz tili B1"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Izoh</label>
                <textarea className={ctlTextarea} value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium text-text-primary">Valyuta</label>
                  <input
                    className={ctlInputLg}
                    value={salaryCurrency}
                    onChange={(e) => setSalaryCurrency(e.target.value)}
                    placeholder="AED"
                    maxLength={8}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Min maosh</label>
                  <input
                    className={ctlInputLg}
                    type="number"
                    inputMode="numeric"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Max maosh</label>
                  <input
                    className={ctlInputLg}
                    type="number"
                    inputMode="numeric"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Tartib raqami</label>
                  <input
                    className={ctlInputLg}
                    type="number"
                    inputMode="numeric"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border/90 bg-muted/30 px-3 py-2.5">
                    <span className="text-sm font-medium text-text-primary">Faol</span>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </div>

              {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}
            </div>

            <DialogFooter className="flex-shrink-0 border-t border-border bg-surface/95 px-6 py-4">
              <button type="button" className={btnSecondaryLg} onClick={() => setDialogOpen(false)} disabled={saving}>
                Bekor qilish
              </button>
              <button type="submit" className={btnPrimaryLg} disabled={saving || detailLoading}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Saqlash
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mamlakatni o‘chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  <span className="font-medium text-text-primary">{deleteTarget.name_uz || deleteTarget.id}</span> —
                  qayta tiklanmaydi. Davom etasizmi?
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteBusy}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              O‘chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
