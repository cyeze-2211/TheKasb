import { api } from './client';
import { assertApiSuccess } from './users';

/** Public — GET `/api/universities` */
export type PublicUniversity = {
  id: number;
  name?: string;
  region_id?: number;
  score?: number;
  type?: string;
  url?: string;
  is_active?: boolean;
};

export type FetchPublicUniversitiesQuery = {
  region_id?: number;
  type?: string;
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

function normalizeRow(row: Record<string, unknown>): PublicUniversity | null {
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

export async function fetchPublicUniversities(
  query: FetchPublicUniversitiesQuery = {},
): Promise<PublicUniversity[]> {
  const params: Record<string, string | number> = {};
  if (query.region_id != null && query.region_id > 0) params.region_id = query.region_id;
  if (query.type?.trim()) params.type = query.type.trim();
  const { data } = await api.get<unknown>('/universities', { params });
  assertApiSuccess(data);
  const list = extractListRows(data)
    .map(normalizeRow)
    .filter((x): x is PublicUniversity => x != null)
    .filter((u) => u.is_active !== false);
  list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'uz'));
  return list;
}

export function filterPublicUniversities(list: PublicUniversity[], query: string): PublicUniversity[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((u) => (u.name ?? '').toLowerCase().includes(q));
}
