import { api } from './client';
import { assertApiSuccess } from './users';

export type CustomProfessionsListQuery = {
  isReviewed?: boolean;
  page?: number;
  size?: number;
};

export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

function cleanQuery(q: CustomProfessionsListQuery): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {
    page: q.page ?? 0,
    size: q.size ?? 20,
  };
  if (typeof q.isReviewed === 'boolean') out.isReviewed = q.isReviewed;
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
  if (!root || !Array.isArray(root.content)) {
    if (Array.isArray(d.object)) {
      const arr = d.object as T[];
      return {
        content: arr,
        totalElements: arr.length,
        totalPages: 1,
        number: 0,
        size: arr.length || 20,
      };
    }
    return empty;
  }
  return {
    content: root.content as T[],
    totalElements: typeof root.totalElements === 'number' ? root.totalElements : root.content.length,
    totalPages: typeof root.totalPages === 'number' ? root.totalPages : 0,
    number: typeof root.number === 'number' ? root.number : 0,
    size: typeof root.size === 'number' ? root.size : 20,
  };
}

/** GET /api/admin/custom-professions */
export async function fetchCustomProfessionsList(
  query: CustomProfessionsListQuery,
): Promise<SpringPage<Record<string, unknown>>> {
  const { data } = await api.get<unknown>('/admin/custom-professions', { params: cleanQuery(query) });
  assertApiSuccess(data);
  return unwrapSpringPage<Record<string, unknown>>(data);
}

export type ConvertCustomProfessionBody = {
  profession_id: number;
};

/** POST /api/admin/custom-professions/{id}/convert */
export async function convertCustomProfession(
  id: string,
  body: ConvertCustomProfessionBody,
): Promise<unknown> {
  const { data } = await api.post<unknown>(`/admin/custom-professions/${id}/convert`, body);
  assertApiSuccess(data);
  return data;
}
