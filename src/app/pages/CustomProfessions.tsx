import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import {
  convertCustomProfession,
  fetchCustomProfessionsList,
  type SpringPage,
} from '../api/customProfessions';
import { fetchProfessionCategories, fetchProfessionsByCategory, type ProfessionDto } from '../api/professions';
import { FilterPanel } from '../components/FilterPanel';
import { AdminPaginationBar } from '../components/AdminPaginationBar';
import {
  btnPrimary,
  btnPrimaryLg,
  btnSecondary,
  ctlSelect,
  ctlSelectLg,
  pageKicker,
  panelElite,
  rowElite,
  theadElite,
} from '../components/pageChrome';

function rowId(row: Record<string, unknown>): string {
  const id = row.id;
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  return '';
}

function rowName(row: Record<string, unknown>): string {
  for (const k of ['name', 'title', 'customName', 'nameUz', 'name_uz', 'label']) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '—';
}

function rowReviewed(row: Record<string, unknown>): boolean {
  if (typeof row.isReviewed === 'boolean') return row.isReviewed;
  if (typeof row.reviewed === 'boolean') return row.reviewed;
  if (typeof row.is_reviewed === 'boolean') return row.is_reviewed;
  return false;
}

function rowUsage(row: Record<string, unknown>): number {
  for (const k of ['usageCount', 'usage', 'usages', 'usage_count', 'timesUsed']) {
    const v = row[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
  }
  return 0;
}

type ReviewFilter = '' | 'true' | 'false';

export function CustomProfessions() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [list, setList] = useState<SpringPage<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof fetchProfessionCategories>>>([]);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [professionsByCat, setProfessionsByCat] = useState<Record<number, ProfessionDto[]>>({});
  const [professionId, setProfessionId] = useState<number>(0);
  const [modalCatsLoading, setModalCatsLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setListError(null);
    setLoading(true);
    try {
      const q: Parameters<typeof fetchCustomProfessionsList>[0] = { page, size: pageSize };
      if (reviewFilter === 'true') q.isReviewed = true;
      if (reviewFilter === 'false') q.isReviewed = false;
      const data = await fetchCustomProfessionsList(q);
      setList(data);
    } catch (e: unknown) {
      setList(null);
      setListError(e instanceof Error ? e.message : 'Ro‘yxatni yuklashda xato.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, reviewFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    setPage(0);
  }, [reviewFilter]);

  const openApproveModal = (row: Record<string, unknown>) => {
    setSelectedRow(row);
    setCategoryId(0);
    setProfessionId(0);
    setProfessionsByCat({});
    setModalError(null);
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal) return;
    let cancelled = false;
    (async () => {
      setModalCatsLoading(true);
      try {
        const cats = await fetchProfessionCategories();
        if (!cancelled) setCategories(cats);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setModalCatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showModal]);

  const prefetchProfessions = (catId: number) => {
    if (catId <= 0) return;
    void fetchProfessionsByCategory(catId).then((profs) => {
      setProfessionsByCat((prev) => ({ ...prev, [catId]: profs }));
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRow(null);
    setModalError(null);
  };

  async function handleConvert() {
    if (!selectedRow) return;
    const id = rowId(selectedRow);
    if (!id) {
      setModalError('Yozuv identifikatori topilmadi.');
      return;
    }
    if (!professionId || professionId <= 0) {
      setModalError('Rasmiy kasbni tanlang.');
      return;
    }
    setModalError(null);
    setConverting(true);
    try {
      await convertCustomProfession(id, { profession_id: professionId });
      closeModal();
      await loadList();
    } catch (e: unknown) {
      setModalError(e instanceof Error ? e.message : 'Konvertatsiyada xato.');
    } finally {
      setConverting(false);
    }
  }

  const totalPages = list?.totalPages ?? 0;

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">Maxsus kasblar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Nomzodlar tomonidan yaratilgan kasblarni ko‘rib chiqish va rasmiy kasbga bog‘lash
        </p>
      </div>

      <FilterPanel
        id="custom-professions-filters"
        title="Filtr"
        collapsible
        expanded={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="max-w-md">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Ko‘rib chiqilgan (isReviewed)</label>
            <select
              className={ctlSelect}
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value as ReviewFilter)}
            >
              <option value="">Barchasi</option>
              <option value="false">Yo‘q (tasdiqlanmagan)</option>
              <option value="true">Ha (tasdiqlangan)</option>
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
      </FilterPanel>

      {listError ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{listError}</div>
      ) : null}

      <div className={panelElite}>
        <div className="overflow-x-auto">
          {loading && !list ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Yuklanmoqda…
            </div>
          ) : (
            <table className="w-full">
              <thead className={theadElite}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kasb nomi</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Ishlatilish</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Ko‘rib chiqilgan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(list?.content ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-text-muted">
                      Yozuvlar yo‘q
                    </td>
                  </tr>
                ) : (
                  (list?.content ?? []).map((prof, idx) => {
                    const id = rowId(prof);
                    const key = id || `row-${idx}`;
                    const reviewed = rowReviewed(prof);
                    return (
                      <tr key={key} className={rowElite}>
                        <td className="px-6 py-3 text-sm font-medium text-text-primary">
                          &quot;{rowName(prof)}&quot;
                        </td>
                        <td className="px-6 py-3 text-sm text-text-muted">{rowUsage(prof)} marta</td>
                        <td className="px-6 py-3 text-sm">
                          {reviewed ? (
                            <span className="inline-flex items-center gap-1.5 text-success">
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                              Ha
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-text-muted">
                              <XCircle className="h-4 w-4 flex-shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                              Yo‘q
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {!reviewed ? (
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
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <AdminPaginationBar
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          rowsOnPage={list?.content?.length ?? 0}
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(0);
          }}
        />
      </div>

      {showModal && selectedRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] transition-opacity duration-300">
          <div className="max-h-[90vh] w-full max-w-md animate-in fade-in zoom-in overflow-y-auto rounded-xl border border-border/90 bg-surface p-6 shadow-2xl ring-1 ring-black/[0.06] duration-200">
            <h2 className="m-0 text-lg">&quot;{rowName(selectedRow)}&quot; — rasmiy kasbga bog‘lash</h2>
            <p className="mt-1 text-xs text-text-muted">
              <code className="rounded bg-muted px-1">POST …/convert</code> — tanlangan rasmiy kasb{' '}
              <code className="rounded bg-muted px-1">profession_id</code> yuboriladi.
            </p>

            <div className="mt-4 space-y-4 border-t border-border pt-4">
              {modalCatsLoading ? (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Kategoriyalar…
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Kategoriya</label>
                <select
                  className={ctlSelectLg}
                  value={categoryId || ''}
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    setCategoryId(cid);
                    setProfessionId(0);
                    prefetchProfessions(cid);
                  }}
                >
                  <option value="">Tanlang</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_uz || c.name_ru}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Rasmiy kasb</label>
                <select
                  className={ctlSelectLg}
                  disabled={!categoryId}
                  value={professionId || ''}
                  onChange={(e) => setProfessionId(Number(e.target.value))}
                >
                  <option value="">{categoryId ? 'Tanlang' : 'Avval kategoriya'}</option>
                  {(professionsByCat[categoryId] ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_uz || p.name_ru}
                    </option>
                  ))}
                </select>
              </div>

              {modalError ? <p className="text-sm text-danger">{modalError}</p> : null}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-4">
              <button type="button" onClick={closeModal} disabled={converting} className={btnSecondary}>
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={converting || !professionId}
                onClick={() => void handleConvert()}
                className={btnPrimaryLg}
              >
                {converting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Tasdiqlash (convert)
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
