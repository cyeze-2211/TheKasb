import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRight, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import {
  axiosErrorMessage,
  fetchDeletedUsersWithMeta,
  getUserDisplayName,
  restoreUser,
  type AdminUsersPageMeta,
  type SdgUserDto,
} from '../api/users';
import { RoleBadge } from '../components/StatusBadge';
import { AdminPaginationBar } from '../components/AdminPaginationBar';
import type { UserRole } from '../data/mockData';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { btnSecondary, pageKicker, panelElite, rowElite, theadElite } from '../components/pageChrome';
import { SettingsSectionChrome } from './settings/SettingsSectionChrome';

function roleForBadge(u: SdgUserDto): UserRole {
  const r = String(u.accountType ?? 'CANDIDATE');
  if (r === 'ADMIN' || r === 'AGENT' || r === 'CANDIDATE' || r === 'SUPER_ADMIN') return r;
  return 'CANDIDATE';
}

export function DeletedUsers() {
  const location = useLocation();
  const inSettings = location.pathname.includes('/admin/settings/');
  const [rows, setRows] = useState<SdgUserDto[]>([]);
  const [pageMeta, setPageMeta] = useState<AdminUsersPageMeta | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<SdgUserDto | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreErr, setRestoreErr] = useState<string | null>(null);
  const fetchSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++fetchSeq.current;
    setLoading(true);
    setError(null);
    try {
      const { users, meta } = await fetchDeletedUsersWithMeta({ page, size: pageSize });
      if (seq !== fetchSeq.current) return;
      setRows(users);
      setPageMeta(meta);
      if (meta != null) setPage(meta.pageNumber);
    } catch (e) {
      if (seq !== fetchSeq.current) return;
      setError(axiosErrorMessage(e, 'Ro‘yxatni yuklashda xato.'));
      setRows([]);
      setPageMeta(null);
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmRestore() {
    if (restoreTarget?.id == null) return;
    setRestoring(true);
    setRestoreErr(null);
    try {
      await restoreUser(restoreTarget.id);
      setRestoreTarget(null);
      await load();
    } catch (e) {
      setRestoreErr(axiosErrorMessage(e, 'Tiklashda xato.'));
    } finally {
      setRestoring(false);
    }
  }

  const totalElements = pageMeta?.totalElements ?? rows.length;
  const totalPages = Math.max(1, pageMeta?.totalPages ?? 1);

  const refreshBtn = (
    <button type="button" className={btnSecondary} onClick={() => void load()} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <RefreshCw className="h-4 w-4" aria-hidden />
      )}
      Yangilash
    </button>
  );

  const body = (
    <>
      {error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className={panelElite}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-gradient-to-r from-muted/30 to-transparent px-6 py-5">
          <h2 className="m-0 text-base font-semibold">Ro‘yxat</h2>
          <span className="rounded-full border border-border/60 bg-surface px-2.5 py-0.5 text-xs font-semibold tabular-nums text-text-muted">
            {loading ? '…' : totalElements.toLocaleString('ru-RU')} ta
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theadElite}>
              <tr>
                <th className="w-16 px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Ism</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-text-muted">Rol</th>
                <th className="w-48 px-6 py-3 text-right text-xs font-semibold uppercase text-text-muted">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-text-muted">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" aria-hidden />
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-muted">
                    Ma’lumot yo‘q
                  </td>
                </tr>
              ) : (
                rows.map((user, index) => (
                  <tr key={user.id} className={rowElite}>
                    <td className="px-6 py-3 text-sm text-text-muted">{page * pageSize + index + 1}</td>
                    <td className="mono px-6 py-3 text-sm text-text-muted">{user.id}</td>
                    <td className="mono px-6 py-3 text-sm">{user.phoneNumber ?? '—'}</td>
                    <td className="px-6 py-3 text-sm">{getUserDisplayName(user)}</td>
                    <td className="px-6 py-3">
                      <RoleBadge role={roleForBadge(user)} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className={`${btnSecondary} h-8 px-3 text-xs`}
                          onClick={() => {
                            setRestoreErr(null);
                            setRestoreTarget(user);
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          Tiklash
                        </button>
                        <Link
                          to={`/admin/users/${user.id}`}
                          className={`${btnSecondary} h-8 px-3 text-xs`}
                        >
                          Batafsil
                          <ChevronRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPaginationBar
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          rowsOnPage={rows.length}
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(0);
          }}
        />
      </div>

      <AlertDialog
        open={restoreTarget != null}
        onOpenChange={(open) => {
          if (!open && !restoring) {
            setRestoreTarget(null);
            setRestoreErr(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini tiklash</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                {restoreTarget ? getUserDisplayName(restoreTarget) : '—'}
              </span>{' '}
              (ID {restoreTarget?.id}) qayta faol ro‘yxatga qo‘shiladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {restoreErr ? <p className="text-sm text-danger">{restoreErr}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Bekor qilish</AlertDialogCancel>
            <Button disabled={restoring} onClick={() => void confirmRestore()}>
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Tiklanmoqda…
                </>
              ) : (
                'Ha, tiklash'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (inSettings) {
    return (
      <SettingsSectionChrome
        title="O‘chirilgan foydalanuvchilar"
        description="Soft-delete qilingan hisoblar — xato bo‘lsa tiklash mumkin"
        actions={refreshBtn}
      >
        {body}
      </SettingsSectionChrome>
    );
  }

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Foydalanuvchilar</h1>
          <p className="text-sm text-text-muted">Soft-delete qilingan hisoblar — xato bo‘lsa tiklash mumkin</p>
        </div>
        {refreshBtn}
      </div>
      {body}
    </div>
  );
}
