import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  type AccountType,
  type GenderType,
  type SdgUserDto,
  axiosErrorMessage,
  createUser,
  editUser,
} from '../../api/users';
import { readLoginSessionRaw } from '../../auth/loginSession';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { btnPrimaryLg, btnSecondaryLg, ctlInputLg, ctlSelectLg } from '../pageChrome';
import { Loader2 } from 'lucide-react';

const ACCOUNT_TYPES: AccountType[] = ['ADMIN', 'AGENT', 'CANDIDATE', 'SUPER_ADMIN'];
const GENDERS: GenderType[] = ['ERKAK', 'AYOL'];

function creatorIdFromSession(): number | null {
  try {
    const raw = readLoginSessionRaw();
    if (!raw || typeof raw !== 'object') return null;
    const obj = (raw as Record<string, unknown>).object;
    if (obj && typeof obj === 'object' && typeof (obj as { id?: unknown }).id === 'number') {
      return (obj as { id: number }).id;
    }
  } catch {
    /* ignore */
  }
  return null;
}

type FormState = {
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  genderType: GenderType;
  dateBirth: string;
  password: string;
  address: string;
  addressRegion: string;
  addressDistrict: string;
  addressMFY: string;
  school: string;
  group: string;
  courseId: string;
  creatorId: string;
};

function emptyForm(): FormState {
  return {
    accountType: 'CANDIDATE',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    genderType: 'ERKAK',
    dateBirth: '',
    password: '',
    address: '',
    addressRegion: '',
    addressDistrict: '',
    addressMFY: '',
    school: '',
    group: '',
    courseId: '',
    creatorId: '',
  };
}

function fromUser(u: SdgUserDto): FormState {
  return {
    accountType: (u.accountType as AccountType) || 'CANDIDATE',
    firstName: (u.firstName as string) ?? '',
    lastName: (u.lastName as string) ?? '',
    email: (u.email as string) ?? '',
    phoneNumber: (u.phoneNumber as string) ?? '',
    genderType: (u.genderType as GenderType) || 'ERKAK',
    dateBirth: (u.dateBirth as string) ?? '',
    password: '',
    address: (u.address as string) ?? '',
    addressRegion: (u.addressRegion as string) ?? '',
    addressDistrict: (u.addressDistrict as string) ?? '',
    addressMFY: (u.addressMFY as string) ?? '',
    school: (u.school as string) ?? '',
    group: (u.group as string) ?? '',
    courseId: u.courseId != null ? String(u.courseId) : '',
    creatorId: u.creatorId != null ? String(u.creatorId) : '',
  };
}

function numOrNull(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function buildDto(form: FormState, mode: 'create' | 'edit', editId?: number): SdgUserDto {
  const dto: SdgUserDto = {
    accountType: form.accountType,
    firstName: form.firstName.trim() || null,
    lastName: form.lastName.trim() || null,
    email: form.email.trim() || null,
    phoneNumber: form.phoneNumber.trim() || null,
    genderType: form.genderType,
    dateBirth: form.dateBirth.trim() || null,
    address: form.address.trim() || null,
    addressRegion: form.addressRegion.trim() || null,
    addressDistrict: form.addressDistrict.trim() || null,
    addressMFY: form.addressMFY.trim() || null,
    school: form.school.trim() || null,
    group: form.group.trim() || null,
    courseId: numOrNull(form.courseId),
    creatorId: numOrNull(form.creatorId) ?? (mode === 'create' ? creatorIdFromSession() : null),
  };

  if (mode === 'edit' && editId != null) {
    dto.id = editId;
    if (form.password.trim()) dto.password = form.password.trim();
  } else {
    dto.password = form.password.trim() || null;
  }

  return dto;
}

const dialogSurface =
  'sm:max-w-2xl gap-0 overflow-hidden border-border/80 p-0 shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[98%] data-[state=open]:zoom-in-[98%]';

const fieldGrid = 'grid max-h-[min(72vh,640px)] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  /** edit uchun */
  userId?: number;
  initialUser?: SdgUserDto | null;
  onSuccess: () => void;
};

export function UserFormDialog({ open, onOpenChange, mode, userId, initialUser, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === 'edit' && initialUser) setForm(fromUser(initialUser));
    else setForm(emptyForm());
  }, [open, mode, initialUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === 'create' && !form.password.trim()) {
      setError('Yangi foydalanuvchi uchun parol kiriting.');
      return;
    }
    setSaving(true);
    try {
      const dto = buildDto(form, mode, userId);
      if (mode === 'create') await createUser(dto);
      else {
        if (userId == null) throw new Error('ID yo‘q');
        await editUser({ ...dto, id: userId });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? axiosErrorMessage(err, 'Saqlashda xato.')
          : err instanceof Error
            ? err.message
            : 'Saqlashda xato.',
      );
    } finally {
      setSaving(false);
    }
  }

  const title = mode === 'create' ? 'Yangi foydalanuvchi' : 'Foydalanuvchini tahrirlash';
  const desc =
    mode === 'create'
      ? 'Barcha kerakli maydonlarni to‘ldiring. Parol majburiy.'
      : 'Ma’lumotlarni yangilang. Parolni bo‘sh qoldirsangiz, o‘zgarmaydi.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogSurface}>
        <DialogHeader className="border-b border-border/70 bg-gradient-to-r from-muted/40 to-transparent px-6 py-4 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{desc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className={fieldGrid}>
            <div className="sm:col-span-2">
              <Label htmlFor="uf-accountType" className="mb-1.5 text-xs text-text-muted">
                Rol (accountType)
              </Label>
              <select
                id="uf-accountType"
                className={ctlSelectLg}
                value={form.accountType}
                onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value as AccountType }))}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="uf-fn" className="mb-1.5 text-xs text-text-muted">
                Ism
              </Label>
              <Input
                id="uf-fn"
                className={ctlInputLg}
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                autoComplete="given-name"
              />
            </div>
            <div>
              <Label htmlFor="uf-ln" className="mb-1.5 text-xs text-text-muted">
                Familiya
              </Label>
              <Input
                id="uf-ln"
                className={ctlInputLg}
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                autoComplete="family-name"
              />
            </div>
            <div>
              <Label htmlFor="uf-email" className="mb-1.5 text-xs text-text-muted">
                Email
              </Label>
              <Input
                id="uf-email"
                type="email"
                className={ctlInputLg}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="uf-phone" className="mb-1.5 text-xs text-text-muted">
                Telefon
              </Label>
              <Input
                id="uf-phone"
                className={`${ctlInputLg} mono`}
                value={form.phoneNumber}
                onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="+998901234567"
              />
            </div>
            <div>
              <Label htmlFor="uf-gender" className="mb-1.5 text-xs text-text-muted">
                Jins
              </Label>
              <select
                id="uf-gender"
                className={ctlSelectLg}
                value={form.genderType}
                onChange={(e) => setForm((f) => ({ ...f, genderType: e.target.value as GenderType }))}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="uf-birth" className="mb-1.5 text-xs text-text-muted">
                Tug‘ilgan sana
              </Label>
              <Input
                id="uf-birth"
                type="date"
                className={ctlInputLg}
                value={form.dateBirth}
                onChange={(e) => setForm((f) => ({ ...f, dateBirth: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="uf-pw" className="mb-1.5 text-xs text-text-muted">
                Parol {mode === 'create' ? '(majburiy)' : '(ixtiyoriy — yangilash uchun)'}
              </Label>
              <Input
                id="uf-pw"
                type="password"
                className={ctlInputLg}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="uf-address" className="mb-1.5 text-xs text-text-muted">
                Manzil
              </Label>
              <Input
                id="uf-address"
                className={ctlInputLg}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="uf-reg" className="mb-1.5 text-xs text-text-muted">
                Viloyat
              </Label>
              <Input
                id="uf-reg"
                className={ctlInputLg}
                value={form.addressRegion}
                onChange={(e) => setForm((f) => ({ ...f, addressRegion: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="uf-dist" className="mb-1.5 text-xs text-text-muted">
                Tuman
              </Label>
              <Input
                id="uf-dist"
                className={ctlInputLg}
                value={form.addressDistrict}
                onChange={(e) => setForm((f) => ({ ...f, addressDistrict: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="uf-mfy" className="mb-1.5 text-xs text-text-muted">
                MFY
              </Label>
              <Input
                id="uf-mfy"
                className={ctlInputLg}
                value={form.addressMFY}
                onChange={(e) => setForm((f) => ({ ...f, addressMFY: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="uf-school" className="mb-1.5 text-xs text-text-muted">
                Maktab
              </Label>
              <Input
                id="uf-school"
                className={ctlInputLg}
                value={form.school}
                onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="uf-group" className="mb-1.5 text-xs text-text-muted">
                Guruh
              </Label>
              <Input
                id="uf-group"
                className={ctlInputLg}
                value={form.group}
                onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="uf-course" className="mb-1.5 text-xs text-text-muted">
                courseId
              </Label>
              <Input
                id="uf-course"
                inputMode="numeric"
                className={ctlInputLg}
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="uf-creator" className="mb-1.5 text-xs text-text-muted">
                creatorId
              </Label>
              <Input
                id="uf-creator"
                inputMode="numeric"
                className={ctlInputLg}
                value={form.creatorId}
                onChange={(e) => setForm((f) => ({ ...f, creatorId: e.target.value }))}
                placeholder={mode === 'create' ? 'Bo‘sh — joriy admin' : ''}
              />
            </div>
          </div>

          {error ? (
            <p className="border-t border-border/60 bg-danger/5 px-6 py-3 text-sm text-danger">{error}</p>
          ) : null}

          <DialogFooter className="gap-2 border-t border-border/70 bg-muted/20 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className={btnSecondaryLg}
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving} className={`${btnPrimaryLg} min-w-[8.5rem]`}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saqlanmoqda…
                </>
              ) : mode === 'create' ? (
                'Yaratish'
              ) : (
                'Saqlash'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
