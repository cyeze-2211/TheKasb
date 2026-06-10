import { api } from './client';
import { fetchAdminDistricts } from './districts';
import { assertApiSuccess } from './users';

/** Katalog — GET `/api/admin/regions` (public `/regions` o‘rniga) */
export type PublicRegion = {
  id: number;
  code?: string;
  name_uz?: string;
  name_ru?: string;
  is_active?: boolean;
};

export type PublicDistrict = {
  id: number;
  code?: string;
  name_uz?: string;
  name_ru?: string;
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

function pickId(row: Record<string, unknown>): number | null {
  const raw = row.id ?? row.region_id ?? row.regionId ?? row.district_id ?? row.districtId;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

function normalizeRegionRow(row: Record<string, unknown>): PublicRegion | null {
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

function sortByNameUz<T extends { name_uz?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => (a.name_uz ?? '').localeCompare(b.name_uz ?? '', 'uz'));
}

export async function fetchPublicRegions(): Promise<PublicRegion[]> {
  const { data } = await api.get<unknown>('/regions');
  assertApiSuccess(data);
  return sortByNameUz(
    extractListRows(data)
      .map(normalizeRegionRow)
      .filter((x): x is PublicRegion => x != null)
      .filter((r) => r.is_active !== false),
  );
}

export async function fetchPublicRegionById(id: number): Promise<PublicRegion | null> {
  const { data } = await api.get<unknown>(`/regions/${id}`);
  assertApiSuccess(data);
  const row = unwrapSingle(data);
  if (!row) return null;
  const r = normalizeRegionRow(row);
  if (r?.is_active === false) return null;
  return r;
}

export async function fetchPublicRegionDistricts(regionId: number): Promise<PublicDistrict[]> {
  const list = await fetchAdminDistricts({ region_id: regionId });
  return list
    .filter((d) => d.is_active !== false)
    .map((d) => ({
      id: d.id,
      code: d.code,
      name_uz: d.name_uz,
      name_ru: d.name_ru,
      region_id: d.region_id,
      is_active: d.is_active,
    }));
}
