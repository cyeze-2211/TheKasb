import { api } from './client';
import { assertApiSuccess } from './users';

/** Admin — `/api/admin/regions` */
export type AdminRegion = {
  id: number;
  code?: string;
  name_uz?: string;
  name_ru?: string;
  is_active?: boolean;
};

export type AdminRegionCreateBody = {
  code: string;
  name_ru: string;
  name_uz: string;
};

export type AdminRegionPatchBody = {
  code?: string;
  name_ru?: string;
  name_uz?: string;
  is_active?: boolean;
};

function pickStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string') return v.trim();
  }
  return '';
}

function pickId(row: Record<string, unknown>): number | null {
  const raw = row.id ?? row.region_id ?? row.regionId;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

function normalizeRow(row: Record<string, unknown>): AdminRegion | null {
  const id = pickId(row);
  if (id == null) return null;
  const active = row.is_active ?? row.isActive;
  return {
    id,
    code: pickStr(row, 'code') || undefined,
    name_uz: pickStr(row, 'name_uz', 'nameUz') || undefined,
    name_ru: pickStr(row, 'name_ru', 'nameRu') || undefined,
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

export async function fetchAdminRegions(): Promise<AdminRegion[]> {
  const { data } = await api.get<unknown>('/admin/regions');
  assertApiSuccess(data);
  const list = extractListRows(data)
    .map(normalizeRow)
    .filter((x): x is AdminRegion => x != null);
  list.sort((a, b) => (a.name_uz ?? '').localeCompare(b.name_uz ?? '', 'uz'));
  return list;
}

export async function fetchAdminRegionById(id: number): Promise<AdminRegion | null> {
  const { data } = await api.get<unknown>(`/admin/regions/${id}`);
  assertApiSuccess(data);
  const row = unwrapSingle(data);
  if (!row) return null;
  return normalizeRow(row);
}

export async function createAdminRegion(body: AdminRegionCreateBody): Promise<number | null> {
  const { data } = await api.post<unknown>('/admin/regions', body);
  assertApiSuccess(data);
  const row = unwrapSingle(data);
  if (!row) return null;
  return normalizeRow(row)?.id ?? null;
}

export async function patchAdminRegion(id: number, body: AdminRegionPatchBody): Promise<void> {
  const { data } = await api.patch<unknown>(`/admin/regions/${id}`, body);
  assertApiSuccess(data);
}

export async function deleteAdminRegion(id: number): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/regions/${id}`);
  assertApiSuccess(data);
}
