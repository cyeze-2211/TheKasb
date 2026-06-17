import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Calendar,
  FileWarning,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import {
  axiosErrorMessage,
  fetchUserById,
  deleteUser,
  fetchUserDeletePreview,
  getUserDisplayName,
  hardDeleteUser,
  type SdgUserDto,
  type UserDeletePreviewDto,
} from '../api/users';
import { fetchUserFileBlob, fetchProfilePhotoBlob } from '../api/userFiles'; // <-- импортируем готовую функцию
import { UserDeletePreviewPanel } from '../components/users/UserDeletePreviewPanel';
import { UserFormDialog } from '../components/users/UserFormDialog';
import { RoleBadge } from '../components/StatusBadge';
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
import { btnSecondary, pageKicker, panelElite, panelEliteRaised } from '../components/pageChrome';
import { resolveTumanLabelUz, resolveViloyatLabelUz } from '../lib/uzRegionsCodeSystem';

// ─── Вспомогательные функции ─────────────────────────────────────

function roleForBadge(u: SdgUserDto): UserRole {
  const r = String(u.accountType ?? 'CANDIDATE');
  if (r === 'ADMIN' || r === 'AGENT' || r === 'CANDIDATE' || r === 'SUPER_ADMIN') return r;
  return 'CANDIDATE';
}

function fmtIso(s: string | null | undefined): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(s);
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-sm text-text-primary">{value || '—'}</span>
    </div>
  );
}

// ─── Компонент ────────────────────────────────────────────────────

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = id ? Number(id) : NaN;

  const [user, setUser] = useState<SdgUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [preview, setPreview] = useState<UserDeletePreviewDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState<'soft' | 'hard' | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  // Состояния для фото
  const [photoBlobUrl, setPhotoBlobUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(numericId)) {
      setLoadError('Noto‘g‘ri ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const u = await fetchUserById(numericId);
      setUser(u);
      if (!u) setLoadError('Foydalanuvchi topilmadi.');
    } catch (e) {
      setLoadError(axiosErrorMessage(e, 'Yuklashda xato.'));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    void load();
  }, [load]);

  // ─── Загрузка фото через готовый API-метод ──────────────────────

  useEffect(() => {
    // Сброс предыдущего URL при смене пользователя
    if (photoBlobUrl) {
      URL.revokeObjectURL(photoBlobUrl);
      setPhotoBlobUrl(null);
    }
    setPhotoError(false);
    setPhotoLoading(false);

    if (!user) return;

    // Priority 1: original_photo_file_id (original, not AI generated)
    const originalFileId = (user as Record<string, unknown>)['originalPhotoFileId'] ??
      (user as Record<string, unknown>)['original_photo_file_id'];
    // Priority 2: ai_passport_photo_file_id (only when ai_photo_generated = true)
    const aiGenerated = (user as Record<string, unknown>)['aiPhotoGenerated'] ??
      (user as Record<string, unknown>)['ai_photo_generated'];
    const aiFileId = user.aiPassportPhotoFileId ??
      (user as Record<string, unknown>)['ai_passport_photo_file_id'];

    const rawFileId = originalFileId ?? (aiGenerated ? aiFileId : null);
    const photoId =
      typeof rawFileId === 'number' && Number.isFinite(rawFileId)
        ? rawFileId
        : typeof rawFileId === 'string' && rawFileId.trim() !== ''
          ? Number(rawFileId)
          : null;

    if (photoId == null || !Number.isFinite(photoId)) {
      return;
    }

    let isMounted = true;

    setPhotoLoading(true);
    setPhotoError(false);

    fetchProfilePhotoBlob(photoId)
      .then(({ blob }) => {
        if (!isMounted) return;
        const url = URL.createObjectURL(blob);
        setPhotoBlobUrl(url);
        setPhotoLoading(false);
      })
      .catch((err) => {
        console.error('[UserDetail] Failed to load photo:', err);
        if (isMounted) {
          // Fallback: try /file/get/one
          fetchUserFileBlob(photoId)
            .then(({ blob }) => {
              if (!isMounted) return;
              const url = URL.createObjectURL(blob);
              setPhotoBlobUrl(url);
              setPhotoLoading(false);
            })
            .catch(() => {
              if (isMounted) {
                setPhotoError(true);
                setPhotoLoading(false);
              }
            });
        }
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (photoBlobUrl) {
        URL.revokeObjectURL(photoBlobUrl);
      }
    };
  }, [photoBlobUrl]);

  const loadPreview = useCallback(async () => {
    if (!Number.isFinite(numericId)) return;
    setPreviewLoading(true);
    setPreviewErr(null);
    try {
      const p = await fetchUserDeletePreview(numericId);
      setPreview(p);
    } catch (e) {
      setPreview(null);
      setPreviewErr(axiosErrorMessage(e, 'Preview yuklashda xato.'));
    } finally {
      setPreviewLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    if (!deleteOpen) {
      setPreview(null);
      setPreviewErr(null);
      setDeleteErr(null);
      return;
    }
    void loadPreview();
  }, [deleteOpen, loadPreview]);

  async function handleSoftDelete() {
    if (!Number.isFinite(numericId)) return;
    setDeleteBusy('soft');
    setDeleteErr(null);
    try {
      await deleteUser(numericId);
      setDeleteOpen(false);
      navigate('/admin/users', { replace: true });
    } catch (e) {
      setDeleteErr(axiosErrorMessage(e, 'O‘chirishda xato.'));
    } finally {
      setDeleteBusy(null);
    }
  }

  async function handleHardDelete() {
    if (!Number.isFinite(numericId)) return;
    setDeleteBusy('hard');
    setDeleteErr(null);
    try {
      await hardDeleteUser(numericId);
      setDeleteOpen(false);
      navigate('/admin/users', { replace: true });
    } catch (e) {
      setDeleteErr(axiosErrorMessage(e, 'Butunlay o‘chirishda xato.'));
    } finally {
      setDeleteBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={2} aria-hidden />
        <p className="text-sm">Yuklanmoqda…</p>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="space-y-4 p-6 md:p-8">
        <p className={`${pageKicker} mb-1`}>The Kasb · Admin</p>
        <p className="text-sm text-danger">{loadError ?? 'Ma’lumot yo‘q.'}</p>
        <Link to="/admin/users" className={`${btnSecondary} inline-flex`}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Ro&apos;yxatga qaytish
        </Link>
      </div>
    );
  }

  const initials = getUserDisplayName(user)
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const showPhoto = !photoLoading && !photoError && photoBlobUrl !== null;

  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <p className={`${pageKicker} mb-1`}>The Kasb · Admin</p>
      <nav className="text-sm text-text-muted" aria-label="Breadcrumb">
        <Link to="/admin/users" className="text-primary transition-colors hover:underline">
          Foydalanuvchilar
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-primary">{getUserDisplayName(user)}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Profil</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnSecondary} onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
            Tahrirlash
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-danger/70 bg-surface px-4 text-sm font-medium text-danger shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:bg-danger hover:text-white"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            O‘chirish
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className={`${panelEliteRaised} p-6`}>
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div
                className="absolute -inset-1 rounded-full bg-primary/20 blur-lg motion-reduce:blur-none"
                aria-hidden
              />
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-primary/5 text-2xl font-bold text-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                {photoLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : showPhoto ? (
                  <img
                    src={photoBlobUrl!}
                    alt={getUserDisplayName(user)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || <User className="h-10 w-10 opacity-80" />
                )}
              </div>
            </div>
            <h2 className="text-lg font-semibold">{getUserDisplayName(user)}</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <RoleBadge role={roleForBadge(user)} />
            </div>
            <div className="mt-4 w-full space-y-2 border-t border-border/70 pt-4 text-left text-sm">
              <div className="flex items-center gap-2 text-text-muted">
                <Phone className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                <span className="mono text-text-primary">{user.phoneNumber ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <Mail className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                <span className="truncate text-text-primary">{user.email ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <Calendar className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                <span className="text-text-primary">
                  {user.dateBirth
                    ? (() => {
                        try {
                          return new Date(user.dateBirth).toLocaleDateString('uz-UZ');
                        } catch {
                          return user.dateBirth;
                        }
                      })()
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${panelElite} min-w-0`}>
          <div className="border-b border-border/80 bg-gradient-to-r from-muted/35 to-transparent px-6 py-4">
            <h3 className="m-0 flex items-center gap-2 text-base font-semibold">
              <Shield className="h-4 w-4 text-primary" strokeWidth={2} aria-hidden />
              Batafsil
            </h3>
          </div>
          <div className="px-6 py-2">
            <DetailRow label="Jins" value={String(user.genderType ?? '—')} />
            <DetailRow label="Aktiv" value={user.isActive === false ? 'Yo‘q' : user.isActive === true ? 'Ha' : '—'} />
            <DetailRow
              label="Tasdiqlangan"
              value={user.isVerified === false ? 'Yo‘q' : user.isVerified === true ? 'Ha' : '—'}
            />
            <DetailRow label="Oxirgi kirish" value={fmtIso(user.lastLoginAt ?? undefined)} />
            <DetailRow label="Manzil" value={String(user.address ?? '')} />
            <DetailRow
              label="Viloyat"
              value={resolveViloyatLabelUz(user.addressRegion) || '—'}
            />
            <DetailRow
              label="Tuman"
              value={resolveTumanLabelUz(user.addressDistrict, user.addressRegion) || '—'}
            />
            <DetailRow label="MFY" value={String(user.addressMFY ?? '')} />
            <DetailRow label="Maktab" value={String(user.school ?? '')} />
            <DetailRow label="Guruh" value={String(user.group ?? '')} />
            <DetailRow label="courseId" value={user.courseId != null ? String(user.courseId) : ''} />
            <DetailRow label="creatorId" value={user.creatorId != null ? String(user.creatorId) : ''} />
            <DetailRow
              label="Telegram chatId"
              value={user.chatId != null && Number.isFinite(Number(user.chatId)) ? String(user.chatId) : ''}
            />
            {typeof user.usernote === 'string' && user.usernote ? (
              <DetailRow label="Izoh" value={user.usernote} />
            ) : null}
          </div>
        </div>
      </div>

      <UserFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        userId={user.id}
        initialUser={user}
        onSuccess={() => void load()}
      />

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleteBusy && setDeleteOpen(open)}>
        <AlertDialogContent className="max-h-[min(92vh,800px)] max-w-xl overflow-y-auto border-border/80 p-0 shadow-2xl sm:max-w-2xl">
          <AlertDialogHeader className="space-y-0 border-b border-border/70 px-6 pb-4 pt-6">
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <FileWarning className="h-5 w-5 text-danger" aria-hidden />
              O‘chirishni tasdiqlash
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm text-text-muted">
              <strong className="font-medium text-text-primary">O‘chirish</strong> — foydalanuvchi
              «O‘chirilgan foydalanuvchilar» ro‘yxatiga o‘tadi, keyin tiklash mumkin.
              <br />
              <strong className="font-medium text-danger">Butunlay o‘chirish</strong> — barcha
              ma’lumotlar bazadan olib tashlanadi, qaytarib bo‘lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 py-4">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-muted">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <p className="text-sm">Preview yuklanmoqda…</p>
              </div>
            ) : null}
            {previewErr ? (
              <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                Preview yuklanmadi: {previewErr}. O‘chirishni baribir davom ettirishingiz mumkin.
              </p>
            ) : null}
            {!previewLoading && preview ? (
              <UserDeletePreviewPanel preview={preview} />
            ) : null}
            {!previewLoading && !preview ? (
              <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3 text-sm">
                <p className="font-medium text-text-primary">{getUserDisplayName(user)}</p>
                <p className="mt-1 text-text-muted">
                  {user.phoneNumber ?? '—'}
                  {user.email ? ` · ${user.email}` : ''}
                </p>
                <p className="mt-2 text-xs text-text-muted">ID: {user.id}</p>
              </div>
            ) : null}
          </div>
          <div className="border-t border-border/70 px-6 py-4">
            {deleteErr ? <p className="mb-3 text-sm text-danger">{deleteErr}</p> : null}
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <AlertDialogCancel disabled={!!deleteBusy} className="mt-0">
                  Bekor qilish
                </AlertDialogCancel>
                <Button
                  variant="outline"
                  className="border-danger/50 text-danger hover:bg-danger/10"
                  disabled={!!deleteBusy || previewLoading}
                  onClick={() => void handleSoftDelete()}
                >
                  {deleteBusy === 'soft' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      O‘chirilmoqda…
                    </>
                  ) : (
                    'O‘chirish'
                  )}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!!deleteBusy || previewLoading}
                  onClick={() => void handleHardDelete()}
                >
                  {deleteBusy === 'hard' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      O‘chirilmoqda…
                    </>
                  ) : (
                    'Butunlay o‘chirish'
                  )}
                </Button>
              </div>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}