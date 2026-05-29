import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import {
  createAdminRegion,
  deleteAdminRegion,
  fetchAdminRegionById,
  fetchAdminRegions,
  patchAdminRegion,
  type AdminRegion,
  type AdminRegionCreateBody,
  type AdminRegionPatchBody,
} from '../../api/regions';
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

type ActiveFilter = '' | 'true' | 'false';

export function SettingsRegions() {
  const [items, setItems] = useState<AdminRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<AdminRegion | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setItems(await fetchAdminRegions());
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

  const filtered = useMemo(() => {
    if (activeFilter === 'true') return items.filter((r) => r.is_active !== false);
    if (activeFilter === 'false') return items.filter((r) => r.is_active === false);
    return items;
  }, [items, activeFilter]);

  function resetFormForCreate() {
    setEditingId(null);
    setCode('');
    setNameUz('');
    setNameRu('');
    setIsActive(true);
    setSaveError(null);
  }

  function applyDto(d: AdminRegion) {
    setEditingId(d.id);
    setCode(d.code ?? '');
    setNameUz(d.name_uz ?? '');
    setNameRu(d.name_ru ?? '');
    setIsActive(d.is_active !== false);
    setSaveError(null);
  }

  function openCreate() {
    setDialogMode('create');
    resetFormForCreate();
    setDialogOpen(true);
  }

  async function openEdit(row: AdminRegion) {
    setDialogMode('edit');
    setEditingId(row.id);
    setDialogOpen(true);
    setDetailLoading(true);
    setSaveError(null);
    try {
      const one = await fetchAdminRegionById(row.id);
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
    const c = code.trim();
    const nu = nameUz.trim();
    const nr = nameRu.trim();
    if (!c) {
      setSaveError('Kod kiriting.');
      return;
    }
    if (!nu) {
      setSaveError('O‘zbekcha nom kiriting.');
      return;
    }
    if (!nr) {
      setSaveError('Ruscha nom kiriting.');
      return;
    }
    setSaving(true);
    try {
      if (dialogMode === 'create') {
        const body: AdminRegionCreateBody = { code: c, name_uz: nu, name_ru: nr };
        await createAdminRegion(body);
      } else {
        if (editingId == null) throw new Error('Yozuv tanlanmagan.');
        const body: AdminRegionPatchBody = { code: c, name_uz: nu, name_ru: nr, is_active: isActive };
        await patchAdminRegion(editingId, body);
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
      await deleteAdminRegion(deleteTarget.id);
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
      title="Viloyatlar"
      description="O‘zbekiston viloyatlari katalogi (nomzod manzili va OTM tanlash uchun)"
      actions={
        <button type="button" onClick={() => openCreate()} className={`${btnPrimary} h-10 min-h-10`}>
          <Plus className="h-4 w-4" aria-hidden />
          Yangi viloyat
        </button>
      }
    >
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
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kod</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Nom (UZ)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Nom (RU)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Faol</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-text-muted">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-muted">
                      Yozuvlar yo‘q
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className={rowElite}>
                      <td className="px-6 py-3 font-mono text-sm text-text-muted">{row.id}</td>
                      <td className="px-6 py-3 font-mono text-sm">{row.code || '—'}</td>
                      <td className="px-6 py-3 text-sm font-medium text-text-primary">{row.name_uz || '—'}</td>
                      <td className="px-6 py-3 text-sm text-text-muted">{row.name_ru || '—'}</td>
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
        <DialogContent className="max-h-[min(92vh,640px)] gap-0 overflow-hidden border-border/90 p-0 sm:max-w-lg">
          <div className="border-b border-border/80 bg-gradient-to-br from-primary/[0.08] to-transparent px-6 pb-4 pt-5">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" aria-hidden />
                <DialogTitle className="text-lg">
                  {dialogMode === 'create' ? 'Yangi viloyat' : 'Viloyatni tahrirlash'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-text-muted">
                {dialogMode === 'create' ? 'POST' : 'PATCH'} /api/admin/regions
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
                <label className="mb-1 block text-sm font-medium">Kod</label>
                <input
                  className={ctlInputLg}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="masalan: 1703"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nom (o‘zbekcha)</label>
                <input
                  className={ctlInputLg}
                  value={nameUz}
                  onChange={(e) => setNameUz(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nom (ruscha)</label>
                <input
                  className={ctlInputLg}
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
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
            <AlertDialogTitle>Viloyatni o‘chirish</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.name_uz ?? deleteTarget?.code}» o‘chirilsinmi?
            </AlertDialogDescription>
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
