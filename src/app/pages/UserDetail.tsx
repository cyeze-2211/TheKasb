import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import {
  axiosErrorMessage,
  deleteUser,
  fetchUserById,
  getUserDisplayName,
  type SdgUserDto,
} from '../api/users';
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

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = id ? Number(id) : NaN;

  const [user, setUser] = useState<SdgUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!Number.isFinite(numericId)) return;
    setDeleting(true);
    setDeleteErr(null);
    try {
      await deleteUser(numericId);
      setDeleteOpen(false);
      navigate('/admin/users', { replace: true });
    } catch (e) {
      setDeleteErr(axiosErrorMessage(e, 'O‘chirishda xato.'));
    } finally {
      setDeleting(false);
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
            onClick={() => {
              setDeleteErr(null);
              setDeleteOpen(true);
            }}
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
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/5 text-2xl font-bold text-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                {initials || <User className="h-10 w-10 opacity-80" />}
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
            <DetailRow label="Viloyat" value={String(user.addressRegion ?? '')} />
            <DetailRow label="Tuman" value={String(user.addressDistrict ?? '')} />
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/80 shadow-2xl duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini o‘chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{getUserDisplayName(user)}</span> (ID{' '}
              {user.id}) butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteErr ? <p className="text-sm text-danger">{deleteErr}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  O‘chirilmoqda…
                </>
              ) : (
                'Ha, o‘chirish'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
