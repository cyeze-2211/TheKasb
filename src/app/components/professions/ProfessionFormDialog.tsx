import { useEffect, useState } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';
import {
  createAdminProfession,
  patchAdminProfession,
  type AdminProfessionBody,
  type ProfessionCategoryDto,
  type ProfessionDto,
} from '../../api/professions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { btnPrimaryLg, btnSecondaryLg, ctlInputLg, ctlSelectLg } from '../pageChrome';

type Mode = 'create' | 'edit';

export type ProfessionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  profession: ProfessionDto | null;
  categories: ProfessionCategoryDto[];
  /** `create` uchun boshlang‘ich kategoriya */
  defaultCategoryId: number;
  defaultSortOrder: number;
  onSuccess: (payload: { createdId: number | null; categoryId: number }) => void | Promise<void>;
};

export function ProfessionFormDialog({
  open,
  onOpenChange,
  mode,
  profession,
  categories,
  defaultCategoryId,
  defaultSortOrder,
  onSuccess,
}: ProfessionFormDialogProps) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLocalError(null);
    if (mode === 'edit' && profession) {
      setCategoryId(profession.category_id);
      setNameUz(profession.name_uz ?? '');
      setNameRu(profession.name_ru ?? '');
      setSortOrder(profession.sort_order ?? 0);
      setIsActive(profession.is_active !== false);
    } else {
      setCategoryId(defaultCategoryId > 0 ? defaultCategoryId : categories[0]?.id ?? 0);
      setNameUz('');
      setNameRu('');
      setSortOrder(defaultSortOrder);
      setIsActive(true);
    }
  }, [open, mode, profession, defaultCategoryId, defaultSortOrder, categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const nu = nameUz.trim();
    const nr = nameRu.trim();
    if (!nu) {
      setLocalError('O‘zbekcha nom kiriting.');
      return;
    }
    if (!nr) {
      setLocalError('Ruscha nom kiriting.');
      return;
    }
    if (!categoryId || categoryId <= 0) {
      setLocalError('Kategoriyani tanlang.');
      return;
    }
    const body: AdminProfessionBody = {
      category_id: categoryId,
      is_active: isActive,
      name_ru: nr,
      name_uz: nu,
      sort_order: Number.isFinite(Number(sortOrder)) ? Math.trunc(Number(sortOrder)) : 0,
    };
    setSaving(true);
    try {
      if (mode === 'create') {
        const newId = await createAdminProfession(body);
        await onSuccess({ createdId: newId, categoryId: body.category_id });
      } else {
        if (!profession) throw new Error('Kasb tanlanmagan.');
        await patchAdminProfession(profession.id, body);
        await onSuccess({ createdId: null, categoryId: body.category_id });
      }
      onOpenChange(false);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Saqlashda xato.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,720px)] gap-0 overflow-hidden border-border/90 p-0 sm:max-w-lg [box-shadow:var(--elite-inset),var(--elite-shadow-lg)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-emerald-600 via-primary to-sky-500"
          aria-hidden
        />
        <div className="relative border-b border-border/80 bg-gradient-to-br from-primary/[0.12] via-emerald-500/[0.06] to-transparent px-6 pb-4 pt-5">
          <div className="flex items-start gap-4 pr-8">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/12 text-primary shadow-[var(--elite-shadow-sm)]">
              <Briefcase className="h-6 w-6" strokeWidth={2} aria-hidden />
            </span>
            <DialogHeader className="min-w-0 flex-1 space-y-1 p-0 text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {mode === 'create' ? 'Yangi kasb' : 'Kasbni tahrirlash'}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Nomlar katalogda va vakansiya formalarida ko‘rinadi.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex max-h-[min(68vh,520px)] flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Kategoriya</label>
              <select
                className={ctlSelectLg}
                value={categoryId || ''}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                disabled={!categories.length}
              >
                {categories.length === 0 ? (
                  <option value="">Kategoriya yo‘q</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_uz || c.name_ru}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Nom (Oʻzb)</label>
                <input
                  className={ctlInputLg}
                  value={nameUz}
                  onChange={(e) => setNameUz(e.target.value)}
                  placeholder="Masalan: Elektrik"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Nom (RU)</label>
                <input
                  className={ctlInputLg}
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  placeholder="Например: Электрик"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Tartib raqami</label>
                <input
                  type="number"
                  className={ctlInputLg}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value === '' ? 0 : Number(e.target.value))}
                  min={0}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 shadow-[var(--elite-shadow-xs)] transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/[0.1]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus-visible:ring-primary/30"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="text-sm font-medium text-text-primary">Faol kasb</span>
              </label>
            </div>

            {localError ? (
              <div className="rounded-xl border border-danger/35 bg-danger/10 px-3 py-2 text-sm text-danger">{localError}</div>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/70 bg-gradient-to-t from-muted/25 to-surface px-6 py-4 sm:justify-end">
            <button type="button" className={btnSecondaryLg} disabled={saving} onClick={() => onOpenChange(false)}>
              Bekor qilish
            </button>
            <button type="submit" className={btnPrimaryLg} disabled={saving || !categories.length}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {mode === 'create' ? 'Yaratish' : 'Saqlash'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
