import axios from 'axios';
import { api } from './client';
import { assertApiSuccess } from './users';

export type AvailabilityStatus = 'READY_NOW' | 'WITHIN_1_MONTH' | 'WITHIN_3_MONTHS';
export type ExperienceRange = 'YEAR_1_3' | 'YEAR_3_5' | 'YEAR_5_PLUS';
export type AdminLanguage =
  | 'ENGLISH'
  | 'GERMAN'
  | 'KOREAN'
  | 'OTHER'
  | 'POLISH'
  | 'RUSSIAN'
  | 'TURKISH';
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'NONE';
export type AdminProfileStatus = 'ACTIVE' | 'DRAFT' | 'PENDING' | 'PLACED' | 'SUSPENDED';

export type CandidatesListQuery = {
  agentId?: number;
  availabilityStatus?: AvailabilityStatus | '';
  categoryId?: number;
  countryCode?: string;
  experienceRange?: ExperienceRange | '';
  language?: AdminLanguage | '';
  languageLevel?: LanguageLevel | '';
  page?: number;
  professionId?: number;
  profileStatus?: AdminProfileStatus | '';
  regionId?: number;
  salaryMax?: number;
  salaryMin?: number;
  size?: number;
  sort?: string;
};

export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

function cleanQuery(q: CandidatesListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: q.page ?? 0,
    size: q.size ?? 20,
  };
  if (q.sort?.trim()) out.sort = q.sort.trim();
  if (q.agentId != null && q.agentId > 0) out.agentId = q.agentId;
  if (q.categoryId != null && q.categoryId > 0) out.categoryId = q.categoryId;
  if (q.professionId != null && q.professionId > 0) out.professionId = q.professionId;
  if (q.regionId != null && q.regionId > 0) out.regionId = q.regionId;
  if (q.salaryMin != null && q.salaryMin > 0) out.salaryMin = q.salaryMin;
  if (q.salaryMax != null && q.salaryMax > 0) out.salaryMax = q.salaryMax;
  if (q.countryCode?.trim()) out.countryCode = q.countryCode.trim();
  if (q.availabilityStatus) out.availabilityStatus = q.availabilityStatus;
  if (q.experienceRange) out.experienceRange = q.experienceRange;
  if (q.language) out.language = q.language;
  if (q.languageLevel) out.languageLevel = q.languageLevel;
  if (q.profileStatus) out.profileStatus = q.profileStatus;
  return out;
}

function unwrapSpringPage<T>(data: unknown): SpringPage<T> {
  const empty: SpringPage<T> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 20,
  };
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

export async function fetchCandidatesList(
  query: CandidatesListQuery,
): Promise<SpringPage<Record<string, unknown>>> {
  const { data } = await api.get<unknown>('/admin/candidates', { params: cleanQuery(query) });
  assertApiSuccess(data);
  return unwrapSpringPage<Record<string, unknown>>(data);
}

/** Batafsil — GET /admin/candidates/{id} */
export async function fetchCandidateById(id: number): Promise<Record<string, unknown> | null> {
  const { data } = await api.get<unknown>(`/admin/candidates/${id}`);
  assertApiSuccess(data);
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

/** Profil holati — PATCH body: { profile_status } */
export async function updateCandidateProfileStatus(
  id: number,
  profile_status: AdminProfileStatus | string,
): Promise<void> {
  const { data } = await api.patch<unknown>(`/admin/candidates/${id}/status`, { profile_status });
  assertApiSuccess(data);
}

/** Agent biriktirish */
export async function assignCandidateAgent(candidateId: number, agent_id: number): Promise<void> {
  const { data } = await api.post<unknown>(`/admin/candidates/${candidateId}/assign-agent`, {
    agent_id,
  });
  assertApiSuccess(data);
}

export function pickCandidateField(obj: unknown, ...keys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    if (k in o && o[k] !== undefined && o[k] !== null) return o[k];
  }
  return undefined;
}

export function pickStr(obj: unknown, ...keys: string[]): string {
  const v = pickCandidateField(obj, ...keys);
  if (v === undefined || v === null) return '';
  return String(v);
}

export function pickNum(obj: unknown, ...keys: string[]): number | undefined {
  const v = pickCandidateField(obj, ...keys);
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
    if (typeof m === 'string' && m) return m.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  }
  if (typeof body === 'string' && body) return body;
  return fallback;
}
