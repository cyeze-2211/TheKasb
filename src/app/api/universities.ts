import { api } from './client';
import { assertApiSuccess } from './users';

/** Admin — `/api/admin/universities` */
export type AdminUniversity = {
  id: number;
  name?: string;
  region_id?: number;
  score?: number;
  type?: string;
  url?: string;
  is_active?: boolean;
};

export type FetchAdminUniversitiesQuery = {
  region_id?: number;
  type?: string;
};

export type AdminUniversityCreateBody = {
  /** Yangi yozuv — backend o‘zi ID beradi */
  id: null;
  name: string;
  region_id: number;
  score?: number;
  type?: string;
  url?: string;
};

export type AdminUniversityPatchBody = {
  name?: string;
  region_id?: number;
  score?: number;
  type?: string;
  url?: string;
  is_active?: boolean;
};

function pickStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string') return v.trim();
  }
  return '';
}

function pickNum(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) return Number(v.trim());
  }
  return undefined;
}

function pickId(row: Record<string, unknown>): number | null {
  const raw = row.id ?? row.university_id ?? row.universityId;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

function normalizeRow(row: Record<string, unknown>): AdminUniversity | null {
  const id = pickId(row);
  if (id == null) return null;
  const active = row.is_active ?? row.isActive;
  const regionId = pickNum(row, 'region_id', 'regionId');
  return {
    id,
    name: pickStr(row, 'name') || undefined,
    region_id: regionId != null ? Math.trunc(regionId) : undefined,
    score: pickNum(row, 'score'),
    type: pickStr(row, 'type') || undefined,
    url: pickStr(row, 'url') || undefined,
    is_active: typeof active === 'boolean' ? active : undefined,
  };
}

function extractListRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.content)) return o.content as Record<string, unknown>[];
  if (Array.isArray(o.data)) return o.data as Record<string, unknown>[];
  const obj = o.object;
  if (Array.isArray(obj)) return obj as Record<string, unknown>[];
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const inner = obj as Record<string, unknown>;
    if (Array.isArray(inner.content)) return inner.content as Record<string, unknown>[];
    if (Array.isArray(inner.data)) return inner.data as Record<string, unknown>[];
  }
  return [];
}

function unwrapSingle(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (typeof o.object === 'object' && o.object !== null && !Array.isArray(o.object)) {
    return o.object as Record<string, unknown>;
  }
  if (typeof o.data === 'object' && o.data !== null && !Array.isArray(o.data)) {
    return o.data as Record<string, unknown>;
  }
  return o as Record<string, unknown>;
}

export async function fetchAdminUniversities(
  query: FetchAdminUniversitiesQuery = {},
): Promise<AdminUniversity[]> {
  const params: Record<string, string | number> = {};
  if (query.region_id != null && query.region_id > 0) params.region_id = query.region_id;
  if (query.type?.trim()) params.type = query.type.trim();
  const { data } = await api.get<unknown>('/admin/universities', { params });
  assertApiSuccess(data);
  const list = extractListRows(data)
    .map(normalizeRow)
    .filter((x): x is AdminUniversity => x != null);
  list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'uz'));
  return list;
}

export async function fetchAdminUniversityById(id: number): Promise<AdminUniversity | null> {
  const { data } = await api.get<unknown>(`/admin/universities/${id}`);
  assertApiSuccess(data);
  const row = unwrapSingle(data);
  if (!row) return null;
  return normalizeRow(row);
}

export async function createAdminUniversity(body: AdminUniversityCreateBody): Promise<number | null> {
  const { data } = await api.post<unknown>('/admin/universities', body);
  assertApiSuccess(data);
  const row = unwrapSingle(data);
  if (!row) return null;
  return normalizeRow(row)?.id ?? null;
}

export async function patchAdminUniversity(id: number, body: AdminUniversityPatchBody): Promise<void> {
  const { data } = await api.patch<unknown>(`/admin/universities/${id}`, body);
  assertApiSuccess(data);
}

export async function deleteAdminUniversity(id: number): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/universities/${id}`);
  assertApiSuccess(data);
}
