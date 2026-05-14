import { api } from './client';
import { assertApiSuccess } from './users';

/** Admin CRUD — GET/POST/PATCH/DELETE `/api/admin/destination-countries` */
export type AdminDestinationCountry = {
  id: string;
  country_code?: string;
  flag_emoji?: string;
  is_active?: boolean;
  language_req?: string;
  name_ru?: string;
  name_uz?: string;
  note?: string;
  salary_currency?: string;
  salary_max?: number;
  salary_min?: number;
  sort_order?: number;
};

export type DestinationCountryWriteBody = {
  flag_emoji?: string;
  is_active?: boolean;
  language_req?: string;
  name_ru?: string;
  name_uz?: string;
  note?: string;
  salary_currency?: string;
  salary_max?: number;
  salary_min?: number;
  sort_order?: number;
  /** Ba’zi backendlar POST uchun talab qiladi */
  country_code?: string;
};

function pickStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string') return v.trim();
  }
  return '';
}

function pickId(row: Record<string, unknown>): string {
  const raw = row.id ?? row.destination_country_id ?? row.destinationCountryId;
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(Math.trunc(raw));
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return '';
}

function normalizeRow(row: Record<string, unknown>): AdminDestinationCountry | null {
  const id = pickId(row);
  if (!id) return null;
  const smin = row.salary_min ?? row.salaryMin;
  const smax = row.salary_max ?? row.salaryMax;
  const sortRaw = row.sort_order ?? row.sortOrder;
  const active = row.is_active ?? row.isActive;
  return {
    id,
    country_code: pickStr(row, 'country_code', 'countryCode').toUpperCase() || undefined,
    flag_emoji: pickStr(row, 'flag_emoji', 'flagEmoji') || undefined,
    is_active: typeof active === 'boolean' ? active : undefined,
    language_req: pickStr(row, 'language_req', 'languageReq') || undefined,
    name_ru: pickStr(row, 'name_ru', 'nameRu') || undefined,
    name_uz: pickStr(row, 'name_uz', 'nameUz') || undefined,
    note: pickStr(row, 'note') || undefined,
    salary_currency: pickStr(row, 'salary_currency', 'salaryCurrency') || undefined,
    salary_min: typeof smin === 'number' && Number.isFinite(smin) ? smin : undefined,
    salary_max: typeof smax === 'number' && Number.isFinite(smax) ? smax : undefined,
    sort_order:
      typeof sortRaw === 'number' && Number.isFinite(sortRaw)
        ? Math.trunc(sortRaw)
        : typeof sortRaw === 'string' && /^\d+$/.test(sortRaw.trim())
          ? Number(sortRaw.trim())
          : undefined,
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

export async function fetchAdminDestinationCountries(): Promise<AdminDestinationCountry[]> {
  const { data } = await api.get<unknown>('/admin/destination-countries');
  assertApiSuccess(data);
  const rows = extractListRows(data);
  const list = rows.map(normalizeRow).filter((x): x is AdminDestinationCountry => x != null);
  list.sort((a, b) => {
    const ao = a.sort_order ?? 0;
    const bo = b.sort_order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id.localeCompare(b.id);
  });
  return list;
}

export async function fetchAdminDestinationCountryById(id: string): Promise<AdminDestinationCountry | null> {
  const { data } = await api.get<unknown>(`/admin/destination-countries/${encodeURIComponent(id)}`);
  assertApiSuccess(data);
  const row = unwrapSingle(data);
  if (!row) return null;
  return normalizeRow(row);
}

export async function createAdminDestinationCountry(body: DestinationCountryWriteBody): Promise<string | null> {
  const { data } = await api.post<unknown>('/admin/destination-countries', body);
  assertApiSuccess(data);
  const row = unwrapSingle(data);
  if (!row) return null;
  const created = normalizeRow(row);
  return created?.id ?? null;
}

export async function patchAdminDestinationCountry(
  id: string,
  body: DestinationCountryWriteBody,
): Promise<void> {
  const { data } = await api.patch<unknown>(`/admin/destination-countries/${encodeURIComponent(id)}`, body);
  assertApiSuccess(data);
}

export async function deleteAdminDestinationCountry(id: string): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/destination-countries/${encodeURIComponent(id)}`);
  assertApiSuccess(data);
}
