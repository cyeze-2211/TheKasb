import { useCallback, useEffect, useState } from 'react';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { fetchProfessionCategories, fetchProfessionsByCategory, type ProfessionDto } from '../api/professions';
import { ProfessionCategoryIcon } from '../components/ProfessionCategoryIcon';
import { pageKicker, panelElite } from '../components/pageChrome';

export function Professions() {
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof fetchProfessionCategories>>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [professions, setProfessions] = useState<ProfessionDto[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProfs, setLoadingProfs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setLoadingCats(true);
      try {
        const list = await fetchProfessionCategories();
        if (cancelled) return;
        setCategories(list);
        if (list.length > 0) {
          setSelectedCategoryId(list[0].id);
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
  }, []);

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

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">Kasblar</h1>
     
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-72">
          <div className={panelElite}>
            <div className="flex items-center gap-2.5 border-b border-border/80 bg-gradient-to-r from-muted/25 to-transparent px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-gradient-to-br from-muted to-muted/70 text-text-muted shadow-[var(--elite-shadow-xs)]">
                <LayoutGrid className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <h2 className="m-0 text-base font-semibold">Kategoriyalar</h2>
            </div>
            <div className="divide-y divide-border">
              {loadingCats ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Yuklanmoqda…
                </div>
              ) : categories.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-text-muted">Kategoriyalar topilmadi</div>
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-all duration-200 ease-out hover:bg-muted/50 active:scale-[0.99] ${
                      selectedCategoryId === cat.id ? 'border-l-3 border-primary bg-primary/10 shadow-sm' : ''
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ProfessionCategoryIcon name={cat.icon} />
                      <div className="min-w-0">
                        <span
                          className={`block truncate text-sm font-medium ${
                            selectedCategoryId === cat.id ? 'text-primary' : 'text-text-primary'
                          }`}
                        >
                          {cat.name_uz || cat.name_ru}
                        </span>
                        {cat.name_ru && cat.name_uz && cat.name_ru !== cat.name_uz ? (
                          <span className="block truncate text-xs text-text-muted">{cat.name_ru}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`${panelElite} p-6`}>
            {selectedCategory ? (
              <>
                <div className="mb-6 flex flex-wrap items-baseline gap-2">
                  <h2 className="m-0 inline-block">{selectedCategory.name_uz || selectedCategory.name_ru}</h2>
                  <span className="text-sm text-text-muted">
                    — {loadingProfs ? '…' : professions.length} ta kasb
                  </span>
                </div>

                {loadingProfs ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Kasblar yuklanmoqda…
                  </div>
                ) : professions.length === 0 ? (
                  <div className="py-12 text-center text-text-muted">Bu kategoriyada kasblar mavjud emas</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {professions.map((prof) => (
                      <span
                        key={prof.id}
                        className="inline-flex max-w-full flex-col rounded-xl border border-border/80 bg-muted/80 px-4 py-2 text-sm font-medium shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/10 hover:text-primary hover:shadow-[var(--elite-shadow-sm)]"
                      >
                        <span className="truncate">{prof.name_uz || prof.name_ru}</span>
                        {prof.name_ru && prof.name_uz && prof.name_ru !== prof.name_uz ? (
                          <span className="truncate text-xs font-normal text-text-muted">{prof.name_ru}</span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : !loadingCats ? (
              <div className="py-12 text-center text-text-muted">Kategoriya tanlang</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
