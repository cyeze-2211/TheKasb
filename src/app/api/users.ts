import axios from 'axios';
import { userFileCategoryLabel } from '../lib/userFileCategories';
import { api, API_BASE_URL } from './client';

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
  /** Telegram chat id (backend: `chatId` / `chat_id`) */
  chatId?: number | null;
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

/** Spring Security `/users/me` javobi: `principal`, `authorities`, … */
function unwrapMeEnvelope(root: Record<string, unknown>): Record<string, unknown> {
  let o = root;
  if (o.data && typeof o.data === 'object') o = o.data as Record<string, unknown>;
  else if (o.object && typeof o.object === 'object') o = o.object as Record<string, unknown>;
  return o;
}

function authorityFromAuthorities(authorities: unknown): string | undefined {
  if (!Array.isArray(authorities) || !authorities[0]) return undefined;
  const a0 = authorities[0];
  if (typeof a0 === 'object' && a0 && 'authority' in a0) {
    const a = (a0 as Record<string, unknown>).authority;
    if (typeof a === 'string') return a.replace(/^ROLE_/i, '');
  }
  if (typeof a0 === 'string') return a0.replace(/^ROLE_/i, '');
  return undefined;
}

function normalizeMeUserRow(raw: Record<string, unknown>): SdgUserDto | null {
  const idRaw = raw.id ?? raw.userId ?? raw.user_id;
  const idNum =
    typeof idRaw === 'number'
      ? idRaw
      : idRaw != null && String(idRaw).trim() !== ''
        ? Number(idRaw)
        : undefined;
  const role = raw.role ?? raw.accountType ?? raw.account_type;
  let accountType = typeof role === 'string' ? role : undefined;
  if (!accountType) accountType = authorityFromAuthorities(raw.authorities);

  const firstName = (raw.firstName ?? raw.first_name) as string | null | undefined;
  const lastName = (raw.lastName ?? raw.last_name) as string | null | undefined;
  const phoneNumber = (raw.phoneNumber ??
    raw.phone_number ??
    raw.phone ??
    raw.mobile ??
    raw.username) as string | null | undefined;
  const email = raw.email as string | null | undefined;

  if (
    phoneNumber == null &&
    email == null &&
    !String(firstName ?? '').trim() &&
    !String(lastName ?? '').trim() &&
    idNum == null
  ) {
    return null;
  }

  const out: SdgUserDto = {
    ...raw,
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    phoneNumber: phoneNumber ?? null,
    email: email ?? null,
    accountType: accountType ?? (raw.accountType as string | null | undefined) ?? null,
  };
  if (idNum != null && Number.isFinite(idNum)) out.id = idNum;
  return out;
}

/** GET /api/users/me (client `baseURL` `/api` → `/users/me`) */
export function extractMeUserFromResponse(data: unknown): SdgUserDto | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  if (root.success === false) return null;

  const envelope = unwrapMeEnvelope(root);
  const authorities = envelope.authorities ?? root.authorities;
  const principal = envelope.principal;

  let userObj: Record<string, unknown>;
  if (principal != null && typeof principal === 'object') {
    userObj = { ...(principal as Record<string, unknown>) };
  } else if (typeof principal === 'string' && principal.trim()) {
    userObj = { phoneNumber: principal, username: principal };
  } else {
    userObj = { ...envelope };
    delete userObj.authenticated;
    delete userObj.credentials;
    delete userObj.details;
    delete userObj.principal;
    delete userObj.authorities;
  }

  if (authorities && userObj.authorities == null) {
    userObj.authorities = authorities as unknown;
  }

  return normalizeMeUserRow(userObj);
}

/**
 * Joriy admin sessiyasi profili — Swagger: `GET /api/users/me`.
 * Dev: `baseURL` `/api` + `/users/me` → proxy `/api/users/me`.
 * Prod: `VITE_API_BASE_URL` oxirida `/api` bo‘lmasa, `/api/users/me` to‘liq path ishlatiladi.
 */
export async function fetchCurrentUserMe(): Promise<SdgUserDto | null> {
  const base = String(API_BASE_URL).replace(/\/+$/, '');
  const paths =
    base.endsWith('/api') || import.meta.env.DEV
      ? ['/users/me', '/v1/users/me']
      : ['/api/users/me', '/users/me', '/v1/users/me'];
  for (const path of paths) {
    try {
      const { data } = await api.get<unknown>(path);
      assertApiSuccess(data);
      const u = extractMeUserFromResponse(data);
      if (u) return u;
    } catch {
      /* keyingi path */
    }
  }
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

/** Spring `Page` ildizi — `content` massivli obyekt (meta uchun) */
function adminUsersPageRoot(data: unknown): Record<string, unknown> | null {
  if (Array.isArray(data)) return null;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const pick = (x: Record<string, unknown>): Record<string, unknown> | null =>
    Array.isArray(x.content) ? x : null;
  const a = pick(d);
  if (a) return a;
  const inner = d.object ?? d.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const b = pick(inner as Record<string, unknown>);
    if (b) return b;
  }
  return null;
}

function numField(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Spring Data `Page` — `pageable.pageNumber`, `pageable.pageSize`, `totalElements`, … */
export type AdminUsersPageMeta = {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
};

function extractAdminUsersPageMeta(root: Record<string, unknown>, contentLen: number): AdminUsersPageMeta | null {
  if (!Array.isArray(root.content)) return null;
  const pageable =
    root.pageable && typeof root.pageable === 'object' && !Array.isArray(root.pageable)
      ? (root.pageable as Record<string, unknown>)
      : null;
  const pageSize = numField(
    root.size ?? root.pageSize ?? pageable?.pageSize ?? pageable?.page_size,
    contentLen > 0 ? contentLen : 20,
  );
  const pageNumber = numField(
    root.number ?? root.pageNumber ?? pageable?.pageNumber ?? pageable?.page_number,
    0,
  );
  let totalElements = numField(root.totalElements ?? root.total_elements, NaN);
  if (!Number.isFinite(totalElements)) totalElements = contentLen;
  let totalPages = numField(root.totalPages ?? root.total_pages, NaN);
  if (!Number.isFinite(totalPages) && pageSize > 0) {
    totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  } else if (!Number.isFinite(totalPages)) {
    totalPages = 1;
  }
  return { pageNumber, pageSize, totalElements, totalPages };
}

function parseAdminUsersListResponse(data: unknown): { users: SdgUserDto[]; meta: AdminUsersPageMeta | null } {
  const merged = new Map<number, SdgUserDto>();
  for (const raw of unwrapAdminUsersPage(data)) {
    const u = normalizeAdminUserRow(raw);
    if (u && typeof u.id === 'number') merged.set(u.id, u);
  }
  const users = Array.from(merged.values());
  const root = adminUsersPageRoot(data);
  const meta = root ? extractAdminUsersPageMeta(root, users.length) : null;
  return { users, meta };
}

function normalizeAdminUserRow(raw: unknown): SdgUserDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const idRaw = o.id ?? o.userId ?? o.user_id;
  const id = typeof idRaw === 'number' ? idRaw : Number(idRaw);
  if (!Number.isFinite(id)) return null;
  const role = o.role ?? o.accountType ?? o.account_type;
  const accountType = typeof role === 'string' ? role : undefined;
  const chatRaw = o.chatId ?? o.chat_id;
  let chatId: number | undefined;
  if (typeof chatRaw === 'number' && Number.isFinite(chatRaw)) chatId = chatRaw;
  else if (typeof chatRaw === 'string' && chatRaw.trim() && Number.isFinite(Number(chatRaw))) {
    chatId = Number(chatRaw);
  }

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
    ...(chatId !== undefined ? { chatId } : {}),
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
  never_logged_in?: boolean;
  registered_from?: string;
  registered_to?: string;
  last_login_from?: string;
  last_login_to?: string;
  search?: string;
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
  if (query.never_logged_in === true || query.never_logged_in === false) {
    p.never_logged_in = query.never_logged_in;
  }
  if (query.registered_from?.trim()) p.registered_from = query.registered_from.trim();
  if (query.registered_to?.trim()) p.registered_to = query.registered_to.trim();
  if (query.last_login_from?.trim()) p.last_login_from = query.last_login_from.trim();
  if (query.last_login_to?.trim()) p.last_login_to = query.last_login_to.trim();
  if (query.search?.trim()) p.search = query.search.trim();
  return p;
}

/** Sahifalangan ro‘yxat + Spring `Page` metasi (mavjud bo‘lsa). */
export async function fetchUsersWithMeta(
  query: FetchUsersQuery = {},
): Promise<{ users: SdgUserDto[]; meta: AdminUsersPageMeta | null }> {
  const { data } = await api.get<unknown>('/admin/users', { params: buildAdminUsersParams(query) });
  assertApiSuccess(data);
  return parseAdminUsersListResponse(data);
}

export async function fetchUsers(query: FetchUsersQuery = {}): Promise<SdgUserDto[]> {
  const { users } = await fetchUsersWithMeta(query);
  return users;
}

/** Nomzodga biriktirish / agent filtri — faqat AGENT. */
export async function fetchAgentsForSelect(): Promise<SdgUserDto[]> {
  return fetchUsers({ accountType: 'AGENT', size: 500, sort: 'id,asc' });
}

/** Vakansiya createdBy va boshqa filtrlarda — admin xodimlar (CANDIDATEsiz). */
export async function fetchStaffUsersForSelect(): Promise<SdgUserDto[]> {
  const [admins, agents, supers] = await Promise.all([
    fetchUsers({ accountType: 'ADMIN', size: 300, sort: 'id,asc' }),
    fetchUsers({ accountType: 'AGENT', size: 300, sort: 'id,asc' }),
    fetchUsers({ accountType: 'SUPER_ADMIN', size: 100, sort: 'id,asc' }),
  ]);
  const m = new Map<number, SdgUserDto>();
  for (const u of [...admins, ...agents, ...supers]) {
    if (typeof u.id === 'number') m.set(u.id, u);
  }
  return Array.from(m.values()).sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
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

/** DELETE /api/admin/users/{id} — soft-delete */
export async function deleteUser(id: number): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/users/${id}`);
  assertApiSuccess(data);
}

/** DELETE /api/admin/users/{id}/hard-delete — butunlay o‘chirish */
export async function hardDeleteUser(id: number): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/users/${id}/hard-delete`);
  assertApiSuccess(data);
}

export type UserDeletePreviewFile = {
  displayName: string;
  sizeBytes: number | null;
  fileHashId: string | null;
  id: number | string | null;
};

export type UserDeletePreviewFileSection = {
  id: string;
  label: string;
  files: UserDeletePreviewFile[];
};

export type UserDeletePreviewDto = {
  userId: number | null;
  fullName: string;
  phoneNumber: string;
  hasCandidateProfile: boolean;
  sections: UserDeletePreviewFileSection[];
  totalFileCount: number;
  totalSizeBytes: number;
};

const PREVIEW_FILE_SECTION_KEYS = [
  { key: 'document_files', id: 'document', label: 'Hujjatlar' },
  { key: 'certificate_files', id: 'certificate', label: 'Sertifikatlar' },
  { key: 'other_files', id: 'other', label: 'Boshqa fayllar' },
] as const;

export function formatPreviewBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 100 || unit === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toLocaleString('uz-UZ', { maximumFractionDigits: digits })} ${units[unit]}`;
}

function previewEnvelope(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const inner = d.object ?? d.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return d;
}

function previewFileRows(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is Record<string, unknown> => x !== null && typeof x === 'object');
}

function categoryFromFileRow(row: Record<string, unknown>): string {
  const v = row.category ?? row.fileCategory ?? row.file_category;
  return typeof v === 'string' && v.trim() ? v.trim() : 'other';
}

function mergePreviewGroups(
  map: Map<string, Record<string, unknown>[]>,
  category: string,
  files: Record<string, unknown>[],
): void {
  if (!files.length) return;
  const key = category.trim() || 'other';
  const prev = map.get(key) ?? [];
  map.set(key, [...prev, ...files]);
}

function previewBool(raw: unknown): boolean {
  return raw === true || raw === 'true' || raw === 1;
}

function previewStr(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : raw != null ? String(raw).trim() : '';
}

function previewId(raw: unknown): number | string | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

function previewFileHash(row: Record<string, unknown>): string | null {
  for (const k of ['fileHashId', 'file_hash_id', 'fileHash', 'hash']) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function parsePreviewFileRow(row: Record<string, unknown>): UserDeletePreviewFile {
  const sizeRaw = row.sizeBytes ?? row.size_bytes ?? row.fileSize ?? row.file_size ?? row.size;
  let sizeBytes: number | null = null;
  if (typeof sizeRaw === 'number' && Number.isFinite(sizeRaw)) sizeBytes = sizeRaw;
  else if (typeof sizeRaw === 'string' && sizeRaw.trim() && Number.isFinite(Number(sizeRaw))) {
    sizeBytes = Number(sizeRaw);
  }
  return {
    displayName: previewFileDisplayName(row),
    sizeBytes,
    fileHashId: previewFileHash(row),
    id: previewId(row.id ?? row.fileId ?? row.file_id),
  };
}

function emptyDeletePreview(): UserDeletePreviewDto {
  return {
    userId: null,
    fullName: '',
    phoneNumber: '',
    hasCandidateProfile: false,
    sections: PREVIEW_FILE_SECTION_KEYS.map((s) => ({ id: s.id, label: s.label, files: [] })),
    totalFileCount: 0,
    totalSizeBytes: 0,
  };
}

function buildLegacyPreviewSections(root: Record<string, unknown>): UserDeletePreviewFileSection[] {
  const map = new Map<string, Record<string, unknown>[]>();

  const byCat = root.filesByCategory ?? root.files_by_category;
  if (byCat && typeof byCat === 'object' && !Array.isArray(byCat)) {
    for (const [cat, rows] of Object.entries(byCat as Record<string, unknown>)) {
      mergePreviewGroups(map, cat, previewFileRows(rows));
    }
  }

  const categories = root.categories ?? root.fileCategories ?? root.file_categories;
  if (Array.isArray(categories)) {
    for (const item of categories) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const cat = String(o.category ?? o.name ?? o.key ?? 'other');
      const rows = previewFileRows(o.files ?? o.fileList ?? o.items ?? o.content);
      mergePreviewGroups(map, cat, rows);
    }
  }

  const flat = previewFileRows(
    root.files ?? root.fileList ?? root.file_list ?? root.userFiles ?? root.user_files,
  );
  if (flat.length) {
    const uncategorized: Record<string, unknown>[] = [];
    for (const row of flat) {
      const cat = categoryFromFileRow(row);
      if (cat === 'other' && !(row.category ?? row.fileCategory ?? row.file_category)) {
        uncategorized.push(row);
      } else {
        mergePreviewGroups(map, cat, [row]);
      }
    }
    if (uncategorized.length) mergePreviewGroups(map, 'other', uncategorized);
  }

  return Array.from(map.entries())
    .map(([category, files]) => ({
      id: category,
      label: userFileCategoryLabel(category),
      files: files.map(parsePreviewFileRow),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'uz'));
}

function parseUserDeletePreview(data: unknown): UserDeletePreviewDto {
  const root = previewEnvelope(data);
  if (!root) return emptyDeletePreview();

  const knownIds = new Set(PREVIEW_FILE_SECTION_KEYS.map((s) => s.id));
  const sections: UserDeletePreviewFileSection[] = PREVIEW_FILE_SECTION_KEYS.map((s) => ({
    id: s.id,
    label: s.label,
    files: previewFileRows(root[s.key]).map(parsePreviewFileRow),
  }));

  for (const legacy of buildLegacyPreviewSections(root)) {
    if (knownIds.has(legacy.id)) {
      const slot = sections.find((x) => x.id === legacy.id);
      if (slot && slot.files.length === 0 && legacy.files.length > 0) slot.files = legacy.files;
    } else if (legacy.files.length > 0) {
      sections.push(legacy);
    }
  }

  const countedFiles = sections.reduce((n, s) => n + s.files.length, 0);
  const summedBytes = sections.reduce(
    (n, s) => n + s.files.reduce((m, f) => m + (f.sizeBytes ?? 0), 0),
    0,
  );

  const userIdRaw = root.user_id ?? root.userId ?? root.id;
  const userId =
    typeof userIdRaw === 'number' && Number.isFinite(userIdRaw)
      ? userIdRaw
      : typeof userIdRaw === 'string' && /^\d+$/.test(userIdRaw)
        ? Number(userIdRaw)
        : null;

  const totalFileCount = numField(root.total_file_count ?? root.totalFileCount, countedFiles);
  const totalSizeBytes = numField(root.total_size_bytes ?? root.totalSizeBytes, summedBytes);

  return {
    userId,
    fullName: previewStr(root.full_name ?? root.fullName) || previewStr(root.name),
    phoneNumber: previewStr(root.phone_number ?? root.phoneNumber ?? root.phone),
    hasCandidateProfile: previewBool(root.has_candidate_profile ?? root.hasCandidateProfile),
    sections,
    totalFileCount,
    totalSizeBytes,
  };
}

/** GET /admin/users/{id}/delete-preview — o‘chirishdan oldin fayllar va bog‘liq ma’lumot */
export async function fetchUserDeletePreview(id: number): Promise<UserDeletePreviewDto> {
  const { data } = await api.get<unknown>(`/admin/users/${id}/delete-preview`);
  assertApiSuccess(data);
  return parseUserDeletePreview(data);
}

/** @deprecated — `hardDeleteUser` ishlating */
export async function purgeUser(id: number): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/users/${id}/purge`);
  assertApiSuccess(data);
}

export type FetchDeletedUsersQuery = {
  page?: number;
  size?: number;
};

/** GET /admin/users/deleted — soft-delete qilingan foydalanuvchilar */
export async function fetchDeletedUsersWithMeta(
  query: FetchDeletedUsersQuery = {},
): Promise<{ users: SdgUserDto[]; meta: AdminUsersPageMeta | null }> {
  const { data } = await api.get<unknown>('/admin/users/deleted', {
    params: { page: query.page ?? 0, size: query.size ?? 50 },
  });
  assertApiSuccess(data);
  return parseAdminUsersListResponse(data);
}

/** PATCH /admin/users/{id}/restore — soft-delete bekor qilish */
export async function restoreUser(id: number): Promise<void> {
  const { data } = await api.patch<unknown>(`/admin/users/${id}/restore`);
  assertApiSuccess(data);
}

export function previewFileDisplayName(row: Record<string, unknown>): string {
  for (const k of ['fileName', 'originalFileName', 'name', 'title']) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '—';
}

function buildUserCreateBody(dto: SdgUserDto): Record<string, unknown> {
  const body: Record<string, unknown> = {
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
  const chatRaw = dto.chatId;
  if (typeof chatRaw === 'number' && Number.isFinite(chatRaw)) {
    body.chatId = chatRaw;
  } else if (typeof chatRaw === 'string' && chatRaw.trim() && Number.isFinite(Number(chatRaw))) {
    body.chatId = Number(chatRaw);
  }
  const pw = typeof dto.password === 'string' ? dto.password.trim() : '';
  if (pw) body.password = pw;
  return body;
}

/** Yangi foydalanuvchi */
export async function createUser(dto: SdgUserDto): Promise<unknown> {
  const body = buildUserCreateBody(dto);
  try {
    const { data } = await api.post<unknown>('/admin/users/create', body);
    assertApiSuccess(data);
    return data;
  } catch (e) {
    // Ba'zi backend buildlarda eski endpoint saqlanib qolgan bo'lishi mumkin.
    const { data } = await api.post<unknown>('/sdg/uz/admin', body);
    assertApiSuccess(data);
    return data;
  }
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

/** Backend o‘qish uchun — PUT bodyga kiritilmasin */
const READ_ONLY_USER_KEYS = new Set(['lastLoginAt', 'last_login_at']);

/**
 * PATCH /admin/users/edit — body to‘g‘ridan-to‘g‘ri user obyekti (`{ dto: … }` emas).
 * Forma tashqarisidagi maydonlar ham bo‘lishi mumkin (`isActive`, `usernote`, …).
 * Parol faqat yangilanganda yuboriladi.
 */
function buildUserEditBody(dto: SdgUserDto & { id: number }): Record<string, unknown> {
  const body: Record<string, unknown> = { id: dto.id };
  for (const [k, v] of Object.entries(dto)) {
    if (k === 'id' || k === 'password') continue;
    if (READ_ONLY_USER_KEYS.has(k)) continue;
    if (v !== undefined) body[k] = v;
  }
  const pw = typeof dto.password === 'string' ? dto.password.trim() : '';
  if (pw) body.password = pw;
  return body;
}

export async function editUser(dto: SdgUserDto & { id: number }): Promise<unknown> {
  const body = buildUserEditBody(dto);
  try {
    const { data } = await api.patch<unknown>('/admin/users/edit', body);
    assertApiSuccess(data);
    return data;
  } catch (e) {
    if (!axios.isAxiosError(e) || e.response?.status !== 404) throw e;
    const { data } = await api.put<unknown>('/sdg/uz/edit', body);
    assertApiSuccess(data);
    return data;
  }
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

function stripApiHtmlMessage(s: string): string {
  return s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

function extractMutationErrorText(err: unknown): string {
  if (err instanceof Error && err.message) return stripApiHtmlMessage(err.message);
  if (axios.isAxiosError(err)) {
    const body = err.response?.data;
    if (body && typeof body === 'object') {
      const o = body as Record<string, unknown>;
      for (const key of ['message', 'error', 'detail', 'msg'] as const) {
        const v = o[key];
        if (typeof v === 'string' && v.trim()) return stripApiHtmlMessage(v);
      }
    }
    if (typeof body === 'string' && body.trim()) return stripApiHtmlMessage(body);
  }
  return '';
}

/**
 * Admin user create/edit — Spring/Hibernate `ConstraintViolationException` va
 * PostgreSQL unique cheklovlari uchun qisqa, tushunarli xabar.
 */
export function formatUserMutationError(err: unknown, fallback: string): string {
  const raw = extractMutationErrorText(err);
  const lower = raw.toLowerCase();
  if (
    lower.includes('users_telegram_chat_id_key') ||
    (lower.includes('telegram_chat_id') && lower.includes('constraint')) ||
    (lower.includes('constraintviolation') && lower.includes('telegram'))
  ) {
    return 'Bu Telegram chat ID boshqa foydalanuvchida allaqachon band. Boshqa chat ID kiriting yoki maydonni bo‘sh qoldiring.';
  }
  if (raw) return raw;
  return axios.isAxiosError(err) ? axiosErrorMessage(err, fallback) : fallback;
}
