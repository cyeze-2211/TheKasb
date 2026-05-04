import axios from 'axios';
import { api } from './client';

export type AccountType = 'ADMIN' | 'AGENT' | 'CANDIDATE' | 'SUPER_ADMIN';
export type GenderType = 'AYOL' | 'ERKAK';

/** Backend user DTO — qo‘shimcha maydonlar kelishi mumkin */
export type SdgUserDto = {
  id?: number;
  accountType?: AccountType | string | null;
  address?: string | null;
  addressDistrict?: string | null;
  addressMFY?: string | null;
  addressRegion?: string | null;
  courseId?: number | null;
  creatorId?: number | null;
  dateBirth?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  genderType?: GenderType | string | null;
  group?: string | null;
  password?: string | null;
  phoneNumber?: string | null;
  school?: string | null;
  isActive?: boolean | null;
  isVerified?: boolean | null;
  lastLoginAt?: string | null;
  deleted?: boolean | null;
  usernote?: string | null;
  [key: string]: unknown;
};

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  for (const key of ['object', 'data', 'content', 'items', 'result']) {
    const v = o[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object' && Array.isArray((v as Record<string, unknown>).content)) {
      return (v as { content: unknown[] }).content;
    }
  }
  return [];
}

export function extractUser(data: unknown): SdgUserDto | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const inner = o.object ?? o.data;
  if (inner && typeof inner === 'object' && typeof (inner as SdgUserDto).id === 'number') {
    return inner as SdgUserDto;
  }
  if (typeof o.id === 'number') return o as SdgUserDto;
  return null;
}

function normalizeList(data: unknown): SdgUserDto[] {
  return extractArray(data).filter(
    (x): x is SdgUserDto =>
      x !== null && typeof x === 'object' && typeof (x as SdgUserDto).id === 'number',
  );
}

export function getUserDisplayName(u: SdgUserDto): string {
  const fn = typeof u.firstName === 'string' ? u.firstName : '';
  const ln = typeof u.lastName === 'string' ? u.lastName : '';
  const full = `${fn} ${ln}`.trim();
  return full || '—';
}

/** GET /sdg/uz — server `accountType` query majburiy. `ALL` bo‘lsa har bir tur uchun alohida so‘rov. */
export type FetchUsersQuery = {
  accountType?: AccountType | 'ALL';
  page?: number;
  size?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  genderType?: string;
  group?: string;
  phoneNumber?: string;
  school?: string;
};

const ALL_ACCOUNT_TYPES: AccountType[] = ['ADMIN', 'AGENT', 'CANDIDATE', 'SUPER_ADMIN'];

function buildListParams(query: FetchUsersQuery): Record<string, string | number> {
  const page = query.page ?? 0;
  const size = query.size ?? 200;
  const p: Record<string, string | number> = { page, size };
  if (query.email?.trim()) p.email = query.email.trim();
  if (query.firstName?.trim()) p.firstName = query.firstName.trim();
  if (query.lastName?.trim()) p.lastName = query.lastName.trim();
  if (query.genderType?.trim()) p.genderType = query.genderType.trim();
  if (query.group?.trim()) p.group = query.group.trim();
  if (query.phoneNumber?.trim()) p.phoneNumber = query.phoneNumber.trim();
  if (query.school?.trim()) p.school = query.school.trim();
  return p;
}

export async function fetchUsers(query: FetchUsersQuery = {}): Promise<SdgUserDto[]> {
  const base = buildListParams(query);
  const types: AccountType[] =
    query.accountType && query.accountType !== 'ALL'
      ? [query.accountType as AccountType]
      : ALL_ACCOUNT_TYPES;

  const results = await Promise.all(
    types.map((accountType) =>
      api.get<unknown>('/sdg/uz', { params: { ...base, accountType } }),
    ),
  );

  const merged = new Map<number, SdgUserDto>();
  for (const res of results) {
    for (const u of normalizeList(res.data)) {
      if (typeof u.id === 'number') merged.set(u.id, u);
    }
  }
  return Array.from(merged.values());
}

export async function fetchUserById(id: number): Promise<SdgUserDto | null> {
  const { data } = await api.get<unknown>(`/sdg/uz/${id}`);
  return extractUser(data);
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/sdg/uz/${id}`);
}

/** Yangi foydalanuvchi */
export async function createUser(dto: SdgUserDto): Promise<unknown> {
  const { data } = await api.post<unknown>('/sdg/uz/admin', dto);
  return data;
}

export function assertApiSuccess(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const o = data as Record<string, unknown>;
  if (o.success === false) {
    const raw = typeof o.message === 'string' ? o.message : 'So‘rov rad etildi.';
    const msg = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
    throw Object.assign(new Error(msg), { response: { data } });
  }
}

/**
 * Mavjud foydalanuvchini yangilash.
 * Ko‘p Spring controllerlar: alohida `id` + `dto` (Swagger: dto body) yoki `?id=` + flat body.
 */
export async function editUser(dto: SdgUserDto & { id: number }): Promise<unknown> {
  const id = dto.id;
  const { data } = await api.put<unknown>(
    '/sdg/uz/edit',
    { id, dto },
    { params: { id } },
  );

  assertApiSuccess(data);
  return data;
}

export function axiosErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const body = err.response?.data;
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    const m = o.message ?? o.error ?? o.detail ?? o.msg;
    if (typeof m === 'string' && m) return m;
  }
  if (typeof body === 'string' && body) return body;
  return fallback;
}
