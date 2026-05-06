import axios from 'axios';
import { api } from './client';
import { assertApiSuccess } from './users';

export type VacancyStatus = 'ACTIVE' | 'CLOSED' | 'DRAFT' | 'FILLED' | 'PAUSED';
export type SalaryCurrency = 'EUR' | 'USD' | 'UZS' | string;
export type WorkSchedule = 'FULL_TIME' | 'PART_TIME' | 'SHIFT' | string;

export type VacanciesListQuery = {
  categoryId?: number;
  countryCode?: string;
  createdBy?: number;
  isUrgent?: boolean | '';
  page?: number;
  professionId?: number;
  size?: number;
  sort?: string;
  status?: VacancyStatus | '';
};

export type VacancyPatchRequest = {
  accommodation?: boolean;
  city?: string;
  contract_duration_months?: number;
  country_code?: string;
  description?: string;
  employer_name?: string;
  expires_at?: string;
  flight_ticket?: boolean;
  is_urgent?: boolean;
  language_requirements?: Array<{
    is_mandatory: boolean;
    language: string;
    min_level: string;
  }>;
  meals_provided?: boolean;
  medical_insurance?: boolean;
  places_total?: number;
  professions?: Array<{
    age_max: number;
    age_min: number;
    custom_profession_id: string | null;
    experience_range: string;
    gender_requirement: string;
    places_count: number;
    profession_category_id: number;
    profession_id: number;
  }>;
  salary_currency?: SalaryCurrency;
  salary_is_negotiable?: boolean;
  salary_max?: number;
  salary_min?: number;
  title?: string;
  work_schedule?: WorkSchedule;
  [key: string]: unknown;
};

export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

function cleanQuery(q: VacanciesListQuery): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {
    page: q.page ?? 0,
    size: q.size ?? 20,
  };
  if (q.sort?.trim()) out.sort = q.sort.trim();
  if (q.categoryId != null && q.categoryId > 0) out.categoryId = q.categoryId;
  if (q.professionId != null && q.professionId > 0) out.professionId = q.professionId;
  if (q.createdBy != null && q.createdBy > 0) out.createdBy = q.createdBy;
  if (q.countryCode?.trim()) out.countryCode = q.countryCode.trim();
  if (q.status) out.status = q.status;
  if (q.isUrgent !== '' && typeof q.isUrgent === 'boolean') out.isUrgent = q.isUrgent;
  return out;
}

function unwrapSpringPage<T>(data: unknown): SpringPage<T> {
  const empty: SpringPage<T> = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
  if (!data || typeof data !== 'object') return empty;
  const d = data as Record<string, unknown>;
  let root: Record<string, unknown> | null = null;
  if (Array.isArray(d.content)) root = d;
  else if (d.object && typeof d.object === 'object') {
    const o = d.object as Record<string, unknown>;
    if (Array.isArray(o.content)) root = o;
  } else if (d.data && typeof d.data === 'object') {
    const o = d.data as Record<string, unknown>;
    if (Array.isArray(o.content)) root = o;
  }
  if (!root || !Array.isArray(root.content)) return empty;
  return {
    content: root.content as T[],
    totalElements: typeof root.totalElements === 'number' ? root.totalElements : root.content.length,
    totalPages: typeof root.totalPages === 'number' ? root.totalPages : 0,
    number: typeof root.number === 'number' ? root.number : 0,
    size: typeof root.size === 'number' ? root.size : 20,
  };
}

export async function fetchVacanciesList(
  query: VacanciesListQuery,
): Promise<SpringPage<Record<string, unknown>>> {
  const { data } = await api.get<unknown>('/admin/vacancies', { params: cleanQuery(query) });
  assertApiSuccess(data);
  return unwrapSpringPage<Record<string, unknown>>(data);
}

export async function fetchVacancyById(id: string): Promise<Record<string, unknown> | null> {
  const { data } = await api.get<unknown>(`/admin/vacancies/${id}`);
  assertApiSuccess(data);
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (typeof o.object === 'object' && o.object !== null && !Array.isArray(o.object)) return o.object as Record<string, unknown>;
  if (typeof o.data === 'object' && o.data !== null && !Array.isArray(o.data)) return o.data as Record<string, unknown>;
  return o as Record<string, unknown>;
}

export async function createVacancy(request: VacancyPatchRequest & Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post<unknown>('/admin/vacancies', request);
  assertApiSuccess(data);
  return data;
}

export async function patchVacancy(id: string, request: VacancyPatchRequest): Promise<void> {
  const { data } = await api.patch<unknown>(`/admin/vacancies/${id}`, request);
  assertApiSuccess(data);
}

export async function deleteVacancy(id: string): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/vacancies/${id}`);
  assertApiSuccess(data);
}

export function pickField(obj: unknown, ...keys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

export function pickStr(obj: unknown, ...keys: string[]): string {
  const v = pickField(obj, ...keys);
  if (v === undefined || v === null) return '';
  return String(v);
}

export function pickBool(obj: unknown, ...keys: string[]): boolean | undefined {
  const v = pickField(obj, ...keys);
  if (typeof v === 'boolean') return v;
  return undefined;
}

export function pickNum(obj: unknown, ...keys: string[]): number | undefined {
  const v = pickField(obj, ...keys);
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function axiosErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message && !axios.isAxiosError(err)) return err.message;
  if (!axios.isAxiosError(err)) return fallback;
  const body = err.response?.data;
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    const m = o.message ?? o.error ?? o.detail ?? o.msg;
    if (typeof m === 'string' && m) {
      // esbuild ba'zan regex literal ichidagi `<...>` ni JSX deb o'qib yuboradi.
      // Shuning uchun RegExp constructor ishlatamiz.
      return m
        .replace(new RegExp('<br\\\\s*\\\\/?>', 'gi'), '\n')
        .replace(new RegExp('<[^>]+>', 'g'), '');
    }
  }
  if (typeof body === 'string' && body) return body;
  return fallback;
}

