import { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { fetchAdminRegions, type AdminRegion } from '../../api/regions';
import {
  createAdminUniversity,
  deleteAdminUniversity,
  fetchAdminUniversities,
  fetchAdminUniversityById,
  patchAdminUniversity,
  type AdminUniversity,
  type AdminUniversityCreateBody,
  type AdminUniversityPatchBody,
} from '../../api/universities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import {
  btnPrimary,
  btnPrimaryLg,
  btnSecondary,
  btnSecondaryLg,
  ctlInput,
  ctlInputLg,
  iconAction,
  iconActionDanger,
  panelElite,
  rowElite,
  theadElite,
} from '../../components/pageChrome';
import { SettingsSectionChrome } from './SettingsSectionChrome';

const UNIVERSITY_TYPES = [
  { value: '', label: 'Barcha turlar' },
  { value: 'davlat', label: 'Davlat' },
  { value: 'nodavlat', label: 'Nodavlat' },
] as const;

type ActiveFilter = '' | 'true' | 'false';

export function SettingsUniversities() {
  const [regions, setRegions] = useState<AdminRegion[]>([]);
  const [items, setItems] = useState<AdminUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRegionId, setFilterRegionId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [regionId, setRegionId] = useState('');
  const [score, setScore] = useState('');
  const [type, setType] = useState('davlat');
  const [url, setUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<AdminUniversity | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const regionNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of regions) {
      m.set(r.id, r.name_uz ?? r.name_ru ?? String(r.id));
    }
    return m;
  }, [regions]);

  const loadRegions = useCallback(async () => {
    try {
      setRegions(await fetchAdminRegions());
    } catch {
      setRegions([]);
    }
  }, []);

  const loadList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const region_id = filterRegionId.trim() ? Number(filterRegionId) : undefined;
      const typeQ = filterType.trim() || undefined;
      const list = await fetchAdminUniversities({
        region_id: region_id != null && Number.isFinite(region_id) ? region_id : undefined,
        type: typeQ,
      });
      setItems(list);
    } catch (e: unknown) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Ro‘yxatni yuklashda xato.');
    } finally {
      setLoading(false);
    }
  }, [filterRegionId, filterType]);

  useEffect(() => {
    void loadRegions();
  }, [loadRegions]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filtered = useMemo(() => {
    if (activeFilter === 'true') return items.filter((u) => u.is_active !== false);
    if (activeFilter === 'false') return items.filter((u) => u.is_active === false);
    return items;
  }, [items, activeFilter]);

  function resetFormForCreate() {
    setEditingId(null);
    setName('');
    setRegionId(regions[0] ? String(regions[0].id) : '');
    setScore('');
    setType('davlat');
    setUrl('');
    setIsActive(true);
    setSaveError(null);
  }

  function applyDto(d: AdminUniversity) {
    setEditingId(d.id);
    setName(d.name ?? '');
    setRegionId(d.region_id != null ? String(d.region_id) : '');
    setScore(d.score != null ? String(d.score) : '');
    setType(d.type?.trim() || 'davlat');
    setUrl(d.url ?? '');
    setIsActive(d.is_active !== false);
    setSaveError(null);
  }

  function openCreate() {
    setDialogMode('create');
    resetFormForCreate();
    setDialogOpen(true);
  }

  async function openEdit(row: AdminUniversity) {
    setDialogMode('edit');
    setEditingId(row.id);
    setDialogOpen(true);
    setDetailLoading(true);
    setSaveError(null);
    try {
      const one = await fetchAdminUniversityById(row.id);
      applyDto(one ?? row);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Ma’lumotni yuklashda xato.');
      applyDto(row);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const n = name.trim();
    const rid = Number(regionId);
    if (!n) {
      setSaveError('OTM nomini kiriting.');
      return;
    }
    if (!Number.isFinite(rid) || rid <= 0) {
      setSaveError('Viloyatni tanlang.');
      return;
    }
    const scoreNum = score.trim() ? Number(score) : undefined;
    setSaving(true);
    try {
      if (dialogMode === 'create') {
        const body: AdminUniversityCreateBody = {
          id: null,
          name: n,
          region_id: Math.trunc(rid),
          type: type.trim() || undefined,
          url: url.trim() || undefined,
        };
        if (scoreNum != null && Number.isFinite(scoreNum)) body.score = scoreNum;
        await createAdminUniversity(body);
      } else {
        if (editingId == null) throw new Error('Yozuv tanlanmagan.');
        const body: AdminUniversityPatchBody = {
          name: n,
          region_id: Math.trunc(rid),
          type: type.trim() || undefined,
          url: url.trim() || undefined,
          is_active: isActive,
        };
        if (scoreNum != null && Number.isFinite(scoreNum)) body.score = scoreNum;
        await patchAdminUniversity(editingId, body);
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
      await deleteAdminUniversity(deleteTarget.id);
      setDeleteTarget(null);
      await loadList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'O‘chirishda xato.');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <SettingsSectionChrome
      title="Universitetlar"
      description="Oliy ta’lim muassasalari — viloyat va tur bo‘yicha filtrlash mumkin"
      actions={
        <button type="button" onClick={() => openCreate()} className={`${btnPrimary} h-10 min-h-10`}>
          <Plus className="h-4 w-4" aria-hidden />
          Yangi OTM
        </button>
      }
    >
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border/80 bg-surface/80 p-4 shadow-sm">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Viloyat</label>
          <select className={ctlInput} value={filterRegionId} onChange={(e) => setFilterRegionId(e.target.value)}>
            <option value="">Barchasi</option>
            {regions.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.name_uz ?? r.name_ru ?? r.id}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Tur</label>
          <select className={ctlInput} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            {UNIVERSITY_TYPES.map((t) => (
              <option key={t.value || 'all'} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] flex-1">
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
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Viloyat</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Tur</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Ball</th>
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
                      <td className="px-6 py-3 font-mono text-sm text-text-muted">{row.id}</td>
                      <td className="max-w-[220px] px-6 py-3 text-sm font-medium text-text-primary">
                        {row.name || '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-text-muted">
                        {row.region_id != null ? regionNameById.get(row.region_id) ?? row.region_id : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm capitalize text-text-muted">{row.type || '—'}</td>
                      <td className="px-6 py-3 text-sm tabular-nums text-text-muted">{row.score ?? '—'}</td>
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
        <DialogContent className="max-h-[min(92vh,720px)] gap-0 overflow-hidden border-border/90 p-0 sm:max-w-lg">
          <div className="border-b border-border/80 bg-gradient-to-br from-primary/[0.08] to-transparent px-6 pb-4 pt-5">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-primary">
                <GraduationCap className="h-5 w-5" aria-hidden />
                <DialogTitle className="text-lg">
                  {dialogMode === 'create' ? 'Yangi OTM' : 'OTMni tahrirlash'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-text-muted">
                {dialogMode === 'create' ? 'POST' : 'PATCH'} /api/admin/universities
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex max-h-[calc(92vh-10rem)] flex-col">
            <div className="space-y-4 overflow-y-auto px-6 py-4">
              {detailLoading ? (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Yuklanmoqda…
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm font-medium">Nomi</label>
                <input
                  className={ctlInputLg}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Viloyat</label>
                <select className={ctlInputLg} value={regionId} onChange={(e) => setRegionId(e.target.value)}>
                  <option value="">Tanlang</option>
                  {regions.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name_uz ?? r.name_ru ?? r.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Tur</label>
                  <select className={ctlInputLg} value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="davlat">Davlat</option>
                    <option value="nodavlat">Nodavlat</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Ball (ixtiyoriy)</label>
                  <input
                    className={ctlInputLg}
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">URL (ixtiyoriy)</label>
                <input
                  className={ctlInputLg}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                  autoComplete="off"
                />
              </div>
              {dialogMode === 'edit' ? (
                <div className="flex items-center justify-between rounded-xl border border-border/80 px-4 py-3">
                  <span className="text-sm font-medium">Faol</span>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              ) : null}
              {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}
            </div>
            <DialogFooter className="border-t border-border/80 px-6 py-4">
              <button type="button" className={btnSecondaryLg} onClick={() => setDialogOpen(false)}>
                Bekor
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
            <AlertDialogTitle>OTMni o‘chirish</AlertDialogTitle>
            <AlertDialogDescription>«{deleteTarget?.name}» o‘chirilsinmi?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Bekor</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBusy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-danger hover:bg-danger/90"
            >
              {deleteBusy ? 'O‘chirilmoqda…' : 'O‘chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSectionChrome>
  );
}
