import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteAdminProfession,
  deleteAdminProfessionCategory,
  fetchProfessionCategories,
  fetchProfessionsByCategory,
  type ProfessionCategoryDto,
  type ProfessionDto,
} from '../api/professions';
import { ProfessionCategoryFormDialog } from '../components/professions/ProfessionCategoryFormDialog';
import { ProfessionFormDialog } from '../components/professions/ProfessionFormDialog';
import { ProfessionCategoryIcon } from '../components/ProfessionCategoryIcon';
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
import { btnPrimary, iconAction, iconActionDanger, pageKicker, panelElite } from '../components/pageChrome';
import { FolderPlus, LayoutGrid, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

export function Professions() {
  const [categories, setCategories] = useState<ProfessionCategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [professions, setProfessions] = useState<ProfessionDto[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProfs, setLoadingProfs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catFormMode, setCatFormMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<ProfessionCategoryDto | null>(null);

  const [profFormOpen, setProfFormOpen] = useState(false);
  const [profFormMode, setProfFormMode] = useState<'create' | 'edit'>('create');
  const [editingProfession, setEditingProfession] = useState<ProfessionDto | null>(null);

  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<ProfessionCategoryDto | null>(null);
  const [deleteCategoryBusy, setDeleteCategoryBusy] = useState(false);

  const [deleteProfessionTarget, setDeleteProfessionTarget] = useState<ProfessionDto | null>(null);
  const [deleteProfessionBusy, setDeleteProfessionBusy] = useState(false);

  const reloadCategories = useCallback(async (): Promise<ProfessionCategoryDto[]> => {
    setError(null);
    const list = await fetchProfessionCategories();
    setCategories(list);
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCats(true);
      try {
        const list = await reloadCategories();
        if (cancelled) return;
        if (list.length > 0) {
          setSelectedCategoryId((prev) => (prev != null && list.some((c) => c.id === prev) ? prev : list[0]!.id));
        } else {
          setSelectedCategoryId(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Kategoriyalarni yuklashda xato.');
        }
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadCategories]);

  const loadProfessions = useCallback(async (categoryId: number) => {
    setLoadingProfs(true);
    setError(null);
    try {
      const list = await fetchProfessionsByCategory(categoryId);
      setProfessions(list);
    } catch (e: unknown) {
      setProfessions([]);
      setError(e instanceof Error ? e.message : 'Kasblarni yuklashda xato.');
    } finally {
      setLoadingProfs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategoryId == null) {
      setProfessions([]);
      return;
    }
    void loadProfessions(selectedCategoryId);
  }, [selectedCategoryId, loadProfessions]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const nextCategorySortOrder = useMemo(() => {
    if (!categories.length) return 0;
    return Math.max(...categories.map((c) => c.sort_order ?? 0), 0) + 1;
  }, [categories]);

  const nextProfessionSortOrder = useMemo(() => {
    if (!professions.length) return 0;
    return Math.max(...professions.map((p) => p.sort_order ?? 0), 0) + 1;
  }, [professions]);

  function openCreateCategory() {
    setCatFormMode('create');
    setEditingCategory(null);
    setCatFormOpen(true);
  }

  function openEditCategory(cat: ProfessionCategoryDto) {
    setCatFormMode('edit');
    setEditingCategory(cat);
    setCatFormOpen(true);
  }

  async function handleCategoryFormSuccess(createdId: number | null) {
    const list = await reloadCategories();
    if (createdId != null && list.some((c) => c.id === createdId)) {
      setSelectedCategoryId(createdId);
    } else if (catFormMode === 'create' && list.length > 0) {
      setSelectedCategoryId(list[list.length - 1]!.id);
    } else if (catFormMode === 'edit' && editingCategory) {
      setSelectedCategoryId(editingCategory.id);
    }
  }

  async function confirmDeleteCategory() {
    if (!deleteCategoryTarget) return;
    setDeleteCategoryBusy(true);
    setError(null);
    try {
      await deleteAdminProfessionCategory(deleteCategoryTarget.id);
      const list = await reloadCategories();
      setDeleteCategoryTarget(null);
      const wasSelected = selectedCategoryId === deleteCategoryTarget.id;
      if (wasSelected || (selectedCategoryId != null && !list.some((c) => c.id === selectedCategoryId))) {
        setSelectedCategoryId(list[0]?.id ?? null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'O‘chirishda xato.');
    } finally {
      setDeleteCategoryBusy(false);
    }
  }

  function openCreateProfession() {
    if (!selectedCategoryId) {
      setError('Avval kategoriya tanlang.');
      return;
    }
    setProfFormMode('create');
    setEditingProfession(null);
    setProfFormOpen(true);
  }

  function openEditProfession(prof: ProfessionDto) {
    setProfFormMode('edit');
    setEditingProfession(prof);
    setProfFormOpen(true);
  }

  async function handleProfessionFormSuccess({ categoryId }: { createdId: number | null; categoryId: number }) {
    await reloadCategories();
    setSelectedCategoryId(categoryId);
    await loadProfessions(categoryId);
  }

  async function confirmDeleteProfession() {
    if (!deleteProfessionTarget) return;
    setDeleteProfessionBusy(true);
    setError(null);
    const catId = deleteProfessionTarget.category_id;
    try {
      await deleteAdminProfession(deleteProfessionTarget.id);
      setDeleteProfessionTarget(null);
      if (selectedCategoryId === catId) {
        await loadProfessions(catId);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Kasbni o‘chirishda xato.');
    } finally {
      setDeleteProfessionBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
          <h1 className="mb-1">Kasblar</h1>
          <p className="max-w-xl text-sm text-text-muted">
            Kategoriyalar va har bir kategoriya ichidagi kasblar — yangilash, tahrirlash va o‘chirish.
          </p>
        </div>
        <button type="button" className={btnPrimary} onClick={openCreateCategory}>
          <FolderPlus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Yangi kategoriya
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-80">
          <div className={panelElite}>
            <div className="flex items-center justify-between gap-2 border-b border-border/80 bg-gradient-to-r from-primary/[0.06] via-muted/20 to-transparent px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-gradient-to-br from-muted to-muted/70 text-primary shadow-[var(--elite-shadow-xs)]">
                  <LayoutGrid className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <h2 className="m-0 truncate text-base font-semibold">Kategoriyalar</h2>
              </div>
              <span className="shrink-0 rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                {categories.length}
              </span>
            </div>
            <div className="divide-y divide-border/80">
              {loadingCats ? (
                <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Yuklanmoqda…
                </div>
              ) : categories.length === 0 ? (
                <div className="space-y-3 px-4 py-10 text-center">
                  <p className="text-sm text-text-muted">Hozircha kategoriya yo‘q</p>
                  <button type="button" className={`${btnPrimary} mx-auto`} onClick={openCreateCategory}>
                    Birinchi kategoriyani yaratish
                  </button>
                </div>
              ) : (
                categories.map((cat) => {
                  const active = selectedCategoryId === cat.id;
                  const inactive = cat.is_active === false;
                  return (
                    <div
                      key={cat.id}
                      className={`group flex items-stretch transition-colors ${
                        active ? 'bg-primary/[0.08]' : 'hover:bg-muted/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3 text-left transition-all active:scale-[0.995] ${
                          active ? 'border-l-[3px] border-l-primary shadow-[inset_0_0_0_1px_rgba(37,99,235,0.08)]' : ''
                        }`}
                      >
                        <ProfessionCategoryIcon name={cat.icon} />
                        <div className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-medium ${active ? 'text-primary' : 'text-text-primary'}`}
                          >
                            {cat.name_uz || cat.name_ru}
                          </span>
                          {cat.name_ru && cat.name_uz && cat.name_ru !== cat.name_uz ? (
                            <span className="block truncate text-xs text-text-muted">{cat.name_ru}</span>
                          ) : null}
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {inactive ? (
                              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                Nofaol
                              </span>
                            ) : null}
                            <span className="text-[10px] text-text-muted/80">#{cat.sort_order ?? 0}</span>
                          </div>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5 border-l border-border/60 bg-muted/15 px-1.5 py-1">
                        <button
                          type="button"
                          className={iconAction}
                          title="Tahrirlash"
                          aria-label="Tahrirlash"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCategory(cat);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className={iconActionDanger}
                          title="O‘chirish"
                          aria-label="O‘chirish"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteCategoryTarget(cat);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`${panelElite} p-6`}>
            {selectedCategory ? (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="m-0 inline-flex items-center gap-2 text-lg font-semibold">
                      <ProfessionCategoryIcon name={selectedCategory.icon} className="h-6 w-6 text-primary" />
                      {selectedCategory.name_uz || selectedCategory.name_ru}
                    </h2>
                    <span className="text-sm text-text-muted">
                      — {loadingProfs ? '…' : professions.length} ta kasb
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={btnPrimary} onClick={openCreateProfession}>
                      <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                      Yangi kasb
                    </button>
                    <button type="button" className={btnPrimary} onClick={() => openEditCategory(selectedCategory)}>
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      Kategoriya
                    </button>
                  </div>
                </div>

                {loadingProfs ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Kasblar yuklanmoqda…
                  </div>
                ) : professions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 py-10 text-center">
                    <p className="text-sm text-text-muted">Bu kategoriyada kasb yo‘q</p>
                    <button type="button" className={`${btnPrimary} mt-4`} onClick={openCreateProfession}>
                      <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                      Birinchi kasbni qo‘shish
                    </button>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {professions.map((prof) => {
                      const inactive = prof.is_active === false;
                      return (
                        <li
                          key={prof.id}
                          className="flex items-stretch gap-2 rounded-xl border border-border/80 bg-muted/40 shadow-[var(--elite-shadow-xs)] transition-colors hover:border-primary/30 hover:bg-muted/60"
                        >
                          <div className="min-w-0 flex-1 px-4 py-3">
                            <span className="block truncate text-sm font-medium text-text-primary">
                              {prof.name_uz || prof.name_ru}
                            </span>
                            {prof.name_ru && prof.name_uz && prof.name_ru !== prof.name_uz ? (
                              <span className="mt-0.5 block truncate text-xs text-text-muted">{prof.name_ru}</span>
                            ) : null}
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                              <span>#{prof.sort_order ?? 0}</span>
                              {inactive ? (
                                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                  Nofaol
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5 border-l border-border/60 bg-muted/20 px-1.5 py-1">
                            <button
                              type="button"
                              className={iconAction}
                              title="Tahrirlash"
                              aria-label="Tahrirlash"
                              onClick={() => openEditProfession(prof)}
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              className={iconActionDanger}
                              title="O‘chirish"
                              aria-label="O‘chirish"
                              onClick={() => setDeleteProfessionTarget(prof)}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : !loadingCats ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 py-16 text-center text-sm text-text-muted">
                Kategoriya tanlang yoki yangi yarating
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ProfessionCategoryFormDialog
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        mode={catFormMode}
        category={editingCategory}
        defaultSortOrder={nextCategorySortOrder}
        onSuccess={(createdId) => void handleCategoryFormSuccess(createdId)}
      />

      <ProfessionFormDialog
        open={profFormOpen}
        onOpenChange={setProfFormOpen}
        mode={profFormMode}
        profession={editingProfession}
        categories={categories}
        defaultCategoryId={selectedCategoryId ?? 0}
        defaultSortOrder={nextProfessionSortOrder}
        onSuccess={(payload) => void handleProfessionFormSuccess(payload)}
      />

      <AlertDialog
        open={!!deleteCategoryTarget}
        onOpenChange={(o) => !o && !deleteCategoryBusy && setDeleteCategoryTarget(null)}
      >
        <AlertDialogContent className="gap-0 overflow-hidden border-border/90 bg-surface p-0 text-text-primary shadow-[0_24px_48px_-16px_rgba(15,23,42,0.22)] sm:max-w-md [box-shadow:var(--elite-inset),var(--elite-shadow-lg)]">
          <div className="h-1 bg-gradient-to-r from-danger/90 via-amber-500 to-orange-500" aria-hidden />
          <div className="space-y-4 p-6 pt-5">
            <AlertDialogHeader>
              <AlertDialogTitle>Kategoriyani o‘chirish</AlertDialogTitle>
              <AlertDialogDescription>
                «{deleteCategoryTarget?.name_uz || deleteCategoryTarget?.name_ru || '…'}» o‘chiriladi. Bu amalni
                qaytarib bo‘lmaydi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="border-t border-border/60 pt-4 sm:justify-end">
              <AlertDialogCancel disabled={deleteCategoryBusy}>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteCategoryBusy}
                className="bg-danger text-white hover:bg-danger/90"
                onClick={(e) => {
                  e.preventDefault();
                  void confirmDeleteCategory();
                }}
              >
                {deleteCategoryBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                O‘chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteProfessionTarget}
        onOpenChange={(o) => !o && !deleteProfessionBusy && setDeleteProfessionTarget(null)}
      >
        <AlertDialogContent className="gap-0 overflow-hidden border-border/90 bg-surface p-0 text-text-primary shadow-[0_24px_48px_-16px_rgba(15,23,42,0.22)] sm:max-w-md [box-shadow:var(--elite-inset),var(--elite-shadow-lg)]">
          <div className="h-1 bg-gradient-to-r from-danger/90 via-rose-500 to-orange-500" aria-hidden />
          <div className="space-y-4 p-6 pt-5">
            <AlertDialogHeader>
              <AlertDialogTitle>Kasbni o‘chirish</AlertDialogTitle>
              <AlertDialogDescription>
                «{deleteProfessionTarget?.name_uz || deleteProfessionTarget?.name_ru || '…'}» o‘chiriladi. Bu amalni
                qaytarib bo‘lmaydi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="border-t border-border/60 pt-4 sm:justify-end">
              <AlertDialogCancel disabled={deleteProfessionBusy}>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteProfessionBusy}
                className="bg-danger text-white hover:bg-danger/90"
                onClick={(e) => {
                  e.preventDefault();
                  void confirmDeleteProfession();
                }}
              >
                {deleteProfessionBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                O‘chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
