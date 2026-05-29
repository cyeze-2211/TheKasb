import { api } from './client';
import { assertApiSuccess } from './users';

/** Admin — `/api/admin/districts` */
export type AdminDistrict = {
  id: number;
  code?: string;
  name_uz?: string;
  name_ru?: string;
  region_id?: number;
  is_active?: boolean;
};

export type FetchAdminDistrictsQuery = {
  region_id?: number;
};

export type AdminDistrictCreateBody = {
  code: string;
  name_ru: string;
  name_uz: string;
  region_id: number;
};

export type AdminDistrictPatchBody = {
  code?: string;
  name_ru?: string;
  name_uz?: string;
  region_id?: number;
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
    if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
    if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim());
  }
  return undefined;
}

function pickDistrictId(row: Record<string, unknown>): number | null {
  const raw = row.id ?? row.district_id ?? row.districtId;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

function normalizeRow(row: Record<string, unknown>): AdminDistrict | null {
  const id = pickDistrictId(row);
  if (id == null) return null;
  const active = row.is_active ?? row.isActive;
  const regionId = pickNum(row, 'region_id', 'regionId');
  return {
    id,
    code: pickStr(row, 'code') || undefined,
    name_uz: pickStr(row, 'name_uz', 'nameUz') || undefined,
    name_ru: pickStr(row, 'name_ru', 'nameRu') || undefined,
    region_id: regionId,
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

export async function fetchAdminDistricts(
  query: FetchAdminDistrictsQuery = {},
): Promise<AdminDistrict[]> {
  const params: Record<string, number> = {};
  if (query.region_id != null && query.region_id > 0) params.region_id = query.region_id;
  const { data } = await api.get<unknown>('/admin/districts', { params });
  assertApiSuccess(data);
  const list = extractListRows(data)
    .map(normalizeRow)
    .filter((x): x is AdminDistrict => x != null);
  list.sort((a, b) => (a.name_uz ?? '').localeCompare(b.name_uz ?? '', 'uz'));
  return list;
}

export async function fetchAdminDistrictById(id: number): Promise<AdminDistrict | null> {
  const { data } = await api.get<unknown>(`/admin/districts/${id}`);
  assertApiSuccess(data);
  const row = unwrapSingle(data);
  if (!row) return null;
  return normalizeRow(row);
}

export async function createAdminDistrict(body: AdminDistrictCreateBody): Promise<number | null> {
  const { data } = await api.post<unknown>('/admin/districts', body);
  assertApiSuccess(data);
  const row = unwrapSingle(data);
  if (!row) return null;
  return normalizeRow(row)?.id ?? null;
}

export async function patchAdminDistrict(id: number, body: AdminDistrictPatchBody): Promise<void> {
  const { data } = await api.patch<unknown>(`/admin/districts/${id}`, body);
  assertApiSuccess(data);
}

export async function deleteAdminDistrict(id: number): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/districts/${id}`);
  assertApiSuccess(data);
}
