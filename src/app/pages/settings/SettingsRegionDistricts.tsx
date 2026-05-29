import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Loader2, MapPin, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import {
  createAdminDistrict,
  deleteAdminDistrict,
  fetchAdminDistrictById,
  fetchAdminDistricts,
  patchAdminDistrict,
  type AdminDistrict,
  type AdminDistrictCreateBody,
  type AdminDistrictPatchBody,
} from '../../api/districts';
import { fetchAdminRegionById, type AdminRegion } from '../../api/regions';
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
import { SETTINGS_BASE } from '../../lib/settingsNav';
import { SettingsSectionChrome } from './SettingsSectionChrome';

type ActiveFilter = '' | 'true' | 'false';

function parseRegionId(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

export function SettingsRegionDistricts() {
  const { id: idParam } = useParams<{ id: string }>();
  const regionId = parseRegionId(idParam);

  const [region, setRegion] = useState<AdminRegion | null>(null);
  const [regionLoading, setRegionLoading] = useState(true);
  const [regionError, setRegionError] = useState<string | null>(null);

  const [districts, setDistricts] = useState<AdminDistrict[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [districtError, setDistrictError] = useState<string | null>(null);
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

  const [deleteTarget, setDeleteTarget] = useState<AdminDistrict | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadRegion = useCallback(async (rid: number) => {
    setRegionError(null);
    setRegionLoading(true);
    try {
      const one = await fetchAdminRegionById(rid);
      if (!one) {
        setRegion(null);
        setRegionError('Viloyat topilmadi.');
        return;
      }
      setRegion(one);
    } catch (e: unknown) {
      setRegion(null);
      setRegionError(e instanceof Error ? e.message : 'Viloyatni yuklashda xato.');
    } finally {
      setRegionLoading(false);
    }
  }, []);

  const loadDistricts = useCallback(async (rid: number) => {
    setDistrictError(null);
    setDistrictsLoading(true);
    try {
      setDistricts(await fetchAdminDistricts({ region_id: rid }));
    } catch (e: unknown) {
      setDistricts([]);
      setDistrictError(e instanceof Error ? e.message : 'Tumanlar ro‘yxatini yuklashda xato.');
    } finally {
      setDistrictsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (regionId == null) return;
    void loadRegion(regionId);
    void loadDistricts(regionId);
  }, [regionId, loadRegion, loadDistricts]);

  const filtered = useMemo(() => {
    if (activeFilter === 'true') return districts.filter((d) => d.is_active !== false);
    if (activeFilter === 'false') return districts.filter((d) => d.is_active === false);
    return districts;
  }, [districts, activeFilter]);

  const regionTitle = region?.name_uz ?? region?.name_ru ?? 'Viloyat';

  function resetFormForCreate() {
    setEditingId(null);
    setCode('');
    setNameUz('');
    setNameRu('');
    setIsActive(true);
    setSaveError(null);
  }

  function applyDto(d: AdminDistrict) {
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

  async function openEdit(row: AdminDistrict) {
    setDialogMode('edit');
    setEditingId(row.id);
    setDialogOpen(true);
    setDetailLoading(true);
    setSaveError(null);
    try {
      const one = await fetchAdminDistrictById(row.id);
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
    if (regionId == null) return;
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
        const body: AdminDistrictCreateBody = {
          code: c,
          name_uz: nu,
          name_ru: nr,
          region_id: regionId,
        };
        await createAdminDistrict(body);
      } else {
        if (editingId == null) throw new Error('Yozuv tanlanmagan.');
        const body: AdminDistrictPatchBody = {
          code: c,
          name_uz: nu,
          name_ru: nr,
          region_id: regionId,
          is_active: isActive,
        };
        await patchAdminDistrict(editingId, body);
      }
      setDialogOpen(false);
      await loadDistricts(regionId);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Saqlashda xato.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || regionId == null) return;
    setDeleteBusy(true);
    setDistrictError(null);
    try {
      await deleteAdminDistrict(deleteTarget.id);
      setDeleteTarget(null);
      await loadDistricts(regionId);
    } catch (e: unknown) {
      setDistrictError(e instanceof Error ? e.message : 'O‘chirishda xato.');
    } finally {
      setDeleteBusy(false);
    }
  }

  if (regionId == null) {
    return <Navigate to={`${SETTINGS_BASE}/regions`} replace />;
  }

  if (regionLoading && !region) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 p-8 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Yuklanmoqda…
      </div>
    );
  }

  if (regionError && !region) {
    return (
      <SettingsSectionChrome
        title="Tumanlar"
        description={regionError}
        backTo={`${SETTINGS_BASE}/regions`}
        backLabel="Viloyatlar"
      >
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {regionError}
        </div>
      </SettingsSectionChrome>
    );
  }

  return (
    <SettingsSectionChrome
      title={`Tumanlar — ${regionTitle}`}
      description="Bu viloyatga tegishli tumanlar ro‘yxati"
      backTo={`${SETTINGS_BASE}/regions`}
      backLabel="Viloyatlar"
      actions={
        <button type="button" onClick={() => openCreate()} className={`${btnPrimary} h-10 min-h-10`}>
          <Plus className="h-4 w-4" aria-hidden />
          Yangi tuman
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
          onClick={() => void loadDistricts(regionId)}
          disabled={districtsLoading}
          className={`${btnSecondary} inline-flex items-center gap-2`}
        >
          <RefreshCw className={`h-4 w-4 ${districtsLoading ? 'animate-spin' : ''}`} aria-hidden />
          Yangilash
        </button>
      </div>

      {districtError ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {districtError}
        </div>
      ) : null}

      <div className={panelElite}>
        <div className="overflow-x-auto">
          {districtsLoading && !districts.length ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Tumanlar yuklanmoqda…
            </div>
          ) : (
            <table className="w-full">
              <thead className={theadElite}>
                <tr>
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
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">
                      Tumanlar yo‘q
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className={rowElite}>
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
                  {dialogMode === 'create' ? 'Yangi tuman' : 'Tumanni tahrirlash'}
                </DialogTitle>
              </div>
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
              <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm">
                <span className="text-text-muted">Viloyat: </span>
                <span className="font-medium text-text-primary">{regionTitle}</span>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Kod</label>
                <input
                  className={ctlInputLg}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="masalan: 1703202"
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
            <AlertDialogTitle>Tumanni o‘chirish</AlertDialogTitle>
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
