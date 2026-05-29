import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  deleteUserFile,
  fetchUserFileBlob,
  fetchUserFilesList,
  pickFileHashFromFileRow,
  uploadUserFile,
  type SpringPage,
} from '../../api/userFiles';
import { getLoggedInSdgUserId } from '../../auth/loginSession';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog';
import { cn } from '../../components/ui/utils';
import {
  btnPrimary,
  btnPrimaryLg,
  btnSecondary,
  btnSecondaryLg,
  ctlSelectLg,
  panelElite,
  rowElite,
  theadElite,
} from '../../components/pageChrome';
import { AdminPaginationBar } from '../../components/AdminPaginationBar';
import { USER_FILE_CATEGORIES } from '../../lib/userFileCategories';
import { SettingsSectionChrome } from './SettingsSectionChrome';

type FileUploadCategory = (typeof USER_FILE_CATEGORIES)[number]['value'];

function rowNumericId(row: Record<string, unknown>): number | null {
  for (const k of ['id', 'fileId']) {
    const v = row[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  }
  return null;
}

function rowDisplayName(row: Record<string, unknown>): string {
  for (const k of ['fileName', 'originalFileName', 'name', 'title']) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '—';
}

function rowCategory(row: Record<string, unknown>): string {
  const v = row.category ?? row.fileCategory;
  return typeof v === 'string' && v.trim() ? v.trim() : '—';
}

export function SettingsFiles() {
  const sessionUserId = useMemo(() => getLoggedInSdgUserId(), []);
  const [userIdInput, setUserIdInput] = useState(() => (sessionUserId != null ? String(sessionUserId) : ''));
  const effectiveUserId = useMemo(() => {
    const t = userIdInput.trim();
    if (!t) return sessionUserId;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }, [userIdInput, sessionUserId]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [list, setList] = useState<SpringPage<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<FileUploadCategory>('user_document');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [downloadBusyId, setDownloadBusyId] = useState<number | null>(null);

  const loadList = useCallback(async () => {
    setListError(null);
    setLoading(true);
    try {
      const data = await fetchUserFilesList({ page, size: pageSize });
      setList(data);
    } catch (e: unknown) {
      setList(null);
      setListError(e instanceof Error ? e.message : 'Fayllarni yuklashda xato.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function handleDownload(row: Record<string, unknown>) {
    const id = rowNumericId(row);
    if (id == null) return;
    setDownloadBusyId(id);
    try {
      const { blob, fileName } = await fetchUserFileBlob(id);
      const name = fileName || rowDisplayName(row) || `file-${id}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Yuklab olishda xato.');
    } finally {
      setDownloadBusyId(null);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    if (effectiveUserId == null) {
      setUploadError('userId kiriting yoki tizimga kiring.');
      return;
    }
    if (!uploadCategory) {
      setUploadError('Kategoriyani tanlang.');
      return;
    }
    if (!uploadFile || uploadFile.size === 0) {
      setUploadError('Haqiqiy fayl tanlang (0 bayt emas).');
      return;
    }
    setUploading(true);
    try {
      await uploadUserFile({
        category: uploadCategory,
        userId: effectiveUserId,
        file: uploadFile,
      });
      setUploadFile(null);
      const input = document.getElementById('settings-upload-file-input') as HTMLInputElement | null;
      if (input) input.value = '';
      setUploadOpen(false);
      await loadList();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Yuklashda xato.');
    } finally {
      setUploading(false);
    }
  }

  function onUploadOpenChange(open: boolean) {
    setUploadOpen(open);
    if (!open) {
      setUploadError(null);
      setUploadFile(null);
      setUploadCategory('user_document');
      const input = document.getElementById('settings-upload-file-input') as HTMLInputElement | null;
      if (input) input.value = '';
    }
  }

  async function confirmDelete() {
    if (!deleteRow || effectiveUserId == null) return;
    const hash = pickFileHashFromFileRow(deleteRow);
    if (!hash) {
      setDeleteError('fileHashId topilmadi.');
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteUserFile({ fileHashId: hash, userId: effectiveUserId });
      setDeleteOpen(false);
      setDeleteRow(null);
      await loadList();
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'O‘chirishda xato.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SettingsSectionChrome
      title="Fayllar"
      description="Foydalanuvchi fayllarini ko‘rish, yuklash va o‘chirish"
    >
      <div className={panelElite}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h3 className="m-0 text-base font-semibold">Fayllar ro‘yxati</h3>
            <p className="mt-1 text-xs text-text-muted">GET /api/file/get/all — sahifalangan ro‘yxat</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setUploadOpen(true);
              }}
              disabled={effectiveUserId == null}
              className={`${btnPrimary} inline-flex items-center gap-2`}
              title={effectiveUserId == null ? 'Avval userId kiriting' : undefined}
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Fayl yuklash
            </button>
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
        </div>

        {listError ? (
          <div className="border-b border-danger/20 bg-danger/5 px-6 py-3 text-sm text-danger">{listError}</div>
        ) : null}

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
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Fayl</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Kategoriya</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">fileHashId</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">id</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(list?.content ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">
                      Fayllar yo‘q
                    </td>
                  </tr>
                ) : (
                  (list?.content ?? []).map((row, idx) => {
                    const id = rowNumericId(row);
                    const hash = pickFileHashFromFileRow(row);
                    const key = hash || (id != null ? String(id) : `r-${idx}`);
                    return (
                      <tr key={key} className={rowElite}>
                        <td className="max-w-[200px] truncate px-6 py-3 text-sm font-medium text-text-primary">
                          {rowDisplayName(row)}
                        </td>
                        <td className="px-6 py-3 text-sm text-text-muted">{rowCategory(row)}</td>
                        <td
                          className="max-w-[140px] truncate px-6 py-3 font-mono text-xs text-text-muted"
                          title={hash ?? ''}
                        >
                          {hash ?? '—'}
                        </td>
                        <td className="px-6 py-3 text-sm tabular-nums text-text-muted">{id ?? '—'}</td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={id == null || downloadBusyId === id}
                              onClick={() => void handleDownload(row)}
                              className={`${btnSecondary} inline-flex h-8 items-center gap-1 px-3 text-xs`}
                            >
                              {downloadBusyId === id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                <Download className="h-3.5 w-3.5" aria-hidden />
                              )}
                              Yuklab olish
                            </button>
                            <button
                              type="button"
                              disabled={!hash || effectiveUserId == null}
                              onClick={() => {
                                setDeleteRow(row);
                                setDeleteError(null);
                                setDeleteOpen(true);
                              }}
                              className="inline-flex h-8 items-center gap-1 rounded-md border border-danger/40 bg-danger/5 px-3 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              O‘chirish
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {list != null ? (
          <AdminPaginationBar
            page={page}
            totalPages={list.totalPages}
            pageSize={pageSize}
            rowsOnPage={list.content.length}
            loading={loading}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(0);
            }}
          />
        ) : null}
      </div>

      <Dialog open={uploadOpen} onOpenChange={onUploadOpenChange}>
        <DialogContent
          hideClose
          className={cn(
            'gap-0 overflow-hidden rounded-2xl border-border/80 p-0 sm:max-w-[440px]',
            'shadow-[var(--elite-shadow-lg)] ring-1 ring-[var(--elite-ring)]',
            '[box-shadow:var(--elite-inset),var(--elite-shadow-lg)]',
          )}
        >
          <div className="relative border-b border-border/80 bg-gradient-to-br from-primary/[0.12] via-muted/30 to-transparent px-6 pb-5 pt-6">
            <button
              type="button"
              onClick={() => onUploadOpenChange(false)}
              disabled={uploading}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-muted hover:text-text-primary disabled:opacity-50"
              aria-label="Yopish"
            >
              <span className="text-lg leading-none">×</span>
            </button>
            <div className="flex items-start gap-4 pr-10">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[var(--elite-shadow-sm)]">
                <Upload className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <DialogTitle className="text-left text-lg font-semibold tracking-tight text-text-primary">
                  Yangi fayl yuklash
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-left text-xs leading-relaxed text-text-muted">
                  Multipart <code className="rounded bg-background/80 px-1 py-0.5 font-mono text-[11px]">file</code> ·
                  query:{' '}
                  <code className="rounded bg-background/80 px-1 py-0.5 font-mono text-[11px]">category</code>,{' '}
                  <code className="rounded bg-background/80 px-1 py-0.5 font-mono text-[11px]">userId</code>
                  {effectiveUserId != null ? (
                    <span className="mt-1 block font-medium text-primary/90">userId: {effectiveUserId}</span>
                  ) : (
                    <span className="mt-1 block text-warning">userId yo‘q — tizimga kiring.</span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>

          <form className="space-y-5 p-6" onSubmit={(e) => void handleUpload(e)}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Kategoriya
              </label>
              <select
                className={ctlSelectLg}
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as FileUploadCategory)}
              >
                {USER_FILE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} ({c.value})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-muted">Fayl</label>
              <div
                className={cn(
                  'rounded-2xl border-2 border-dashed border-border/90 bg-muted/15 px-4 py-5 transition-colors',
                  'hover:border-primary/35 hover:bg-primary/[0.04]',
                )}
              >
                <input
                  id="settings-upload-file-input"
                  type="file"
                  className="block w-full cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/25"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
                {uploadFile ? (
                  <p className="mt-3 border-t border-border/60 pt-3 text-xs text-text-muted">
                    <span className="font-medium text-text-primary">{uploadFile.name}</span>
                    <span className="ml-2 tabular-nums">{(uploadFile.size / 1024).toFixed(1)} KB</span>
                  </p>
                ) : (
                  <p className="mt-2 text-center text-xs text-text-muted">Faylni tanlang</p>
                )}
              </div>
            </div>

            {uploadError ? (
              <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {uploadError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-border/80 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onUploadOpenChange(false)}
                disabled={uploading}
                className={btnSecondaryLg}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={uploading || effectiveUserId == null}
                className={`${btnPrimaryLg} inline-flex items-center justify-center gap-2`}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden />
                )}
                Yuklash
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Faylni o‘chirish?</AlertDialogTitle>
            <AlertDialogDescription>
              DELETE /api/file/delete — fileHashId va userId yuboriladi. Bu amalni qaytarib bo‘lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteRow ? (
            <p className="text-sm text-text-primary">
              <span className="text-text-muted">Fayl:</span> {rowDisplayName(deleteRow)}
              <br />
              <span className="text-text-muted">Hash:</span>{' '}
              <span className="font-mono text-xs">{pickFileHashFromFileRow(deleteRow) ?? '—'}</span>
            </p>
          ) : null}
          {deleteError ? <p className="text-sm text-danger">{deleteError}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting || effectiveUserId == null}
              onClick={() => void confirmDelete()}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              O‘chirish
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSectionChrome>
  );
}
