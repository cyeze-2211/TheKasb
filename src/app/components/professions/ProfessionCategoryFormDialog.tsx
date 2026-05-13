import { useEffect, useState } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import {
  createAdminProfessionCategory,
  patchAdminProfessionCategory,
  type AdminProfessionCategoryBody,
  type ProfessionCategoryDto,
} from '../../api/professions';
import {
  ProfessionCategoryIcon,
  PROFESSION_CATEGORY_ICON_PRESETS,
} from '../ProfessionCategoryIcon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { btnPrimaryLg, btnSecondaryLg, ctlInputLg } from '../pageChrome';

type Mode = 'create' | 'edit';

export type ProfessionCategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  /** `edit` uchun */
  category: ProfessionCategoryDto | null;
  /** `create` uchun boshlang‘ich tartib */
  defaultSortOrder: number;
  onSuccess: (createdId: number | null) => void | Promise<void>;
};

export function ProfessionCategoryFormDialog({
  open,
  onOpenChange,
  mode,
  category,
  defaultSortOrder,
  onSuccess,
}: ProfessionCategoryFormDialogProps) {
  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [icon, setIcon] = useState('default');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLocalError(null);
    if (mode === 'edit' && category) {
      setNameUz(category.name_uz ?? '');
      setNameRu(category.name_ru ?? '');
      setIcon((category.icon || 'default').trim() || 'default');
      setSortOrder(category.sort_order ?? 0);
      setIsActive(category.is_active !== false);
    } else {
      setNameUz('');
      setNameRu('');
      setIcon('default');
      setSortOrder(defaultSortOrder);
      setIsActive(true);
    }
  }, [open, mode, category, defaultSortOrder]);

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
    const body: AdminProfessionCategoryBody = {
      icon: icon.trim() || 'default',
      is_active: isActive,
      name_ru: nr,
      name_uz: nu,
      sort_order: Number.isFinite(Number(sortOrder)) ? Math.trunc(Number(sortOrder)) : 0,
    };
    setSaving(true);
    try {
      if (mode === 'create') {
        const newId = await createAdminProfessionCategory(body);
        await onSuccess(newId);
      } else {
        if (!category) throw new Error('Kategoriya tanlanmagan.');
        await patchAdminProfessionCategory(category.id, body);
        await onSuccess(null);
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
      <DialogContent className="max-h-[min(92vh,760px)] gap-0 overflow-hidden border-border/90 p-0 sm:max-w-lg [box-shadow:var(--elite-inset),var(--elite-shadow-lg)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-primary via-sky-500 to-indigo-500"
          aria-hidden
        />
        <div className="relative border-b border-border/80 bg-gradient-to-br from-primary/[0.14] via-primary/[0.06] to-transparent px-6 pb-4 pt-5">
          <div className="flex items-start gap-4 pr-8">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-[var(--elite-shadow-sm)]">
              <FolderPlus className="h-6 w-6" strokeWidth={2} aria-hidden />
            </span>
            <DialogHeader className="min-w-0 flex-1 space-y-1 p-0 text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {mode === 'create' ? 'Yangi kategoriya' : 'Kategoriyani tahrirlash'}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Nomlar va ikonka katalogda nomzodlar va admin uchun ko‘rinadi.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex max-h-[min(70vh,560px)] flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Nom (Oʻzb)</label>
                <input
                  className={ctlInputLg}
                  value={nameUz}
                  onChange={(e) => setNameUz(e.target.value)}
                  placeholder="Masalan: Qurilish"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Nom (RU)</label>
                <input
                  className={ctlInputLg}
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  placeholder="Например: Строительство"
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
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 shadow-[var(--elite-shadow-xs)] transition-colors hover:border-primary/35 hover:bg-primary/[0.1]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus-visible:ring-primary/30"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="text-sm font-medium text-text-primary">Faol kategoriya</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Ikonka (slug)</label>
              <div className="flex flex-wrap gap-2 rounded-xl border border-primary/15 bg-gradient-to-b from-primary/[0.07] to-muted/20 p-3 shadow-inner">
                {PROFESSION_CATEGORY_ICON_PRESETS.map((slug) => {
                  const selected = icon.trim().toLowerCase() === slug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      title={slug}
                      onClick={() => setIcon(slug)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                        selected
                          ? 'border-primary bg-primary/20 text-primary shadow-[0_0_0_2px_rgba(37,99,235,0.25)]'
                          : 'border-border/70 bg-surface/95 text-primary/70 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <ProfessionCategoryIcon name={slug} className="h-5 w-5" strokeWidth={2} />
                    </button>
                  );
                })}
              </div>
              <input
                className={ctlInputLg}
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Slug yoki URL (masalan: construction)"
                autoComplete="off"
              />
              <p className="text-[11px] leading-relaxed text-text-muted">
                Maxsus slug kiriting yoki yuqoridagi piktogrammalardan birini tanlang.
              </p>
            </div>

            {localError ? (
              <div className="rounded-xl border border-danger/35 bg-danger/10 px-3 py-2 text-sm text-danger">{localError}</div>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/70 bg-gradient-to-t from-muted/25 to-surface px-6 py-4 sm:justify-end">
            <button type="button" className={btnSecondaryLg} disabled={saving} onClick={() => onOpenChange(false)}>
              Bekor qilish
            </button>
            <button type="submit" className={btnPrimaryLg} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {mode === 'create' ? 'Yaratish' : 'Saqlash'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
