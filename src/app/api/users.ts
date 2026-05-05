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

/** GET /admin/users — Spring Page yoki `{ object: Page }` */
function unwrapAdminUsersPage(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const fromRoot = (x: Record<string, unknown>): unknown[] | null => {
    const c = x.content;
    return Array.isArray(c) ? c : null;
  };
  let rows = fromRoot(d);
  if (rows) return rows;
  const inner = d.object ?? d.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    rows = fromRoot(inner as Record<string, unknown>);
    if (rows) return rows;
  }
  return [];
}

function normalizeAdminUserRow(raw: unknown): SdgUserDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const idRaw = o.id ?? o.userId ?? o.user_id;
  const id = typeof idRaw === 'number' ? idRaw : Number(idRaw);
  if (!Number.isFinite(id)) return null;
  const role = o.role ?? o.accountType ?? o.account_type;
  const accountType = typeof role === 'string' ? role : undefined;
  return {
    ...o,
    id,
    accountType: accountType ?? (o.accountType as string | undefined),
    firstName: (o.firstName ?? o.first_name) as string | null | undefined,
    lastName: (o.lastName ?? o.last_name) as string | null | undefined,
    phoneNumber: (o.phoneNumber ?? o.phone_number) as string | null | undefined,
    email: o.email as string | null | undefined,
    isActive: (o.isActive ?? o.is_active) as boolean | null | undefined,
    isVerified: (o.isVerified ?? o.is_verified) as boolean | null | undefined,
    lastLoginAt: (o.lastLoginAt ?? o.last_login_at) as string | null | undefined,
  };
}

export function getUserDisplayName(u: SdgUserDto): string {
  const fn = typeof u.firstName === 'string' ? u.firstName : '';
  const ln = typeof u.lastName === 'string' ? u.lastName : '';
  const full = `${fn} ${ln}`.trim();
  return full || '—';
}

/**
 * GET /admin/users — query: page, size, sort, role (ADMIN | …), is_active, is_verified.
 * `accountType` UI nomi — `role` sifatida yuboriladi; `ALL` bo‘lsa `role` yuborilmaydi.
 */
export type FetchUsersQuery = {
  accountType?: AccountType | 'ALL';
  page?: number;
  size?: number;
  sort?: string;
  is_active?: boolean;
  is_verified?: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  genderType?: string;
  group?: string;
  phoneNumber?: string;
  school?: string;
};

function buildAdminUsersParams(query: FetchUsersQuery): Record<string, string | number | boolean> {
  const p: Record<string, string | number | boolean> = {
    page: query.page ?? 0,
    size: query.size ?? 200,
  };
  if (query.sort?.trim()) p.sort = query.sort.trim();
  if (query.accountType && query.accountType !== 'ALL') {
    p.role = query.accountType;
  }
  if (query.is_active === true || query.is_active === false) p.is_active = query.is_active;
  if (query.is_verified === true || query.is_verified === false) p.is_verified = query.is_verified;
  return p;
}

export async function fetchUsers(query: FetchUsersQuery = {}): Promise<SdgUserDto[]> {
  const { data } = await api.get<unknown>('/admin/users', { params: buildAdminUsersParams(query) });
  assertApiSuccess(data);
  const merged = new Map<number, SdgUserDto>();
  for (const raw of unwrapAdminUsersPage(data)) {
    const u = normalizeAdminUserRow(raw);
    if (u && typeof u.id === 'number') merged.set(u.id, u);
  }
  return Array.from(merged.values());
}

export async function fetchUserById(id: number): Promise<SdgUserDto | null> {
  const { data } = await api.get<unknown>(`/admin/users/${id}`);
  assertApiSuccess(data);
  const fromExtract = extractUser(data);
  if (fromExtract) return fromExtract;
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  return normalizeAdminUserRow(o.object ?? o.data ?? o);
}

export async function deleteUser(id: number): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/users/${id}`);
  assertApiSuccess(data);
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
 * PUT /sdg/uz/edit — Swagger: body `dto` = ushbu model (tekis JSON, ichma-ich `{ id, dto }` emas).
 */
function buildUserEditBody(dto: SdgUserDto & { id: number }): Record<string, unknown> {
  const body: Record<string, unknown> = {
    id: dto.id,
    accountType: dto.accountType ?? null,
    address: dto.address ?? null,
    addressDistrict: dto.addressDistrict ?? null,
    addressMFY: dto.addressMFY ?? null,
    addressRegion: dto.addressRegion ?? null,
    courseId: dto.courseId ?? null,
    creatorId: dto.creatorId ?? null,
    dateBirth: dto.dateBirth ?? null,
    email: dto.email ?? null,
    firstName: dto.firstName ?? null,
    genderType: dto.genderType ?? null,
    group: dto.group ?? null,
    lastName: dto.lastName ?? null,
    phoneNumber: dto.phoneNumber ?? null,
    school: dto.school ?? null,
  };
  const pw = typeof dto.password === 'string' ? dto.password.trim() : '';
  if (pw) body.password = pw;
  return body;
}

export async function editUser(dto: SdgUserDto & { id: number }): Promise<unknown> {
  const { data } = await api.put<unknown>('/sdg/uz/edit', buildUserEditBody(dto));
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
