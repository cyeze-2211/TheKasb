import { api } from './client';
import { assertApiSuccess } from './users';

export type ProfessionCategoryDto = {
  icon: string;
  id: number;
  name_ru: string;
  name_uz: string;
  sort_order: number;
  /** Backend bo‘lsa — admin ro‘yxatda ko‘rsatiladi */
  is_active?: boolean;
};

export type ProfessionDto = {
  category_id: number;
  id: number;
  name_ru: string;
  name_uz: string;
  sort_order: number;
};

function extractObjectArray<T>(data: unknown): T[] {
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  const obj = o.object;
  if (Array.isArray(obj)) return obj as T[];
  if (Array.isArray(o.data)) return o.data as T[];
  return [];
}

function sortByOrder<T extends { sort_order?: number; id: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ao = a.sort_order ?? 0;
    const bo = b.sort_order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
}

/** GET /api/professions/categories */
export async function fetchProfessionCategories(): Promise<ProfessionCategoryDto[]> {
  const { data } = await api.get<unknown>('/professions/categories');
  assertApiSuccess(data);
  return sortByOrder(extractObjectArray<ProfessionCategoryDto>(data));
}

/** GET /api/professions/categories/{categoryId}/professions */
export async function fetchProfessionsByCategory(categoryId: number): Promise<ProfessionDto[]> {
  const { data } = await api.get<unknown>(`/professions/categories/${categoryId}/professions`);
  assertApiSuccess(data);
  return sortByOrder(extractObjectArray<ProfessionDto>(data));
}

export type ProfessionFilterOption = {
  id: number;
  categoryId: number;
  label: string;
};

/** POST/PATCH `/api/admin/professions/categories` */
export type AdminProfessionCategoryBody = {
  icon: string;
  is_active: boolean;
  name_ru: string;
  name_uz: string;
  sort_order: number;
};

function pickCreatedEntityId(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (typeof o.object === 'number' && Number.isFinite(o.object) && o.object > 0) return o.object;
  const obj = o.object;
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const id = (obj as Record<string, unknown>).id;
    if (typeof id === 'number' && Number.isFinite(id) && id > 0) return id;
  }
  return null;
}

/** POST `/api/admin/professions/categories` — yangi `id` bo‘lsa qaytaradi */
export async function createAdminProfessionCategory(body: AdminProfessionCategoryBody): Promise<number | null> {
  const { data } = await api.post<unknown>('/admin/professions/categories', body);
  assertApiSuccess(data);
  return pickCreatedEntityId(data);
}

/** PATCH `/api/admin/professions/categories/{id}` */
export async function patchAdminProfessionCategory(
  id: number,
  body: AdminProfessionCategoryBody,
): Promise<void> {
  const { data } = await api.patch<unknown>(`/admin/professions/categories/${id}`, body);
  assertApiSuccess(data);
}

/** DELETE `/api/admin/professions/categories/{id}` */
export async function deleteAdminProfessionCategory(id: number): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/professions/categories/${id}`);
  assertApiSuccess(data);
}

/** Filtr/select uchun: barcha kategoriyalar bo‘yicha kasblar (GET orqali). */
export async function fetchProfessionsFilterOptions(): Promise<ProfessionFilterOption[]> {
  const cats = await fetchProfessionCategories();
  const nested = await Promise.all(
    cats.map(async (c) => {
      const profs = await fetchProfessionsByCategory(c.id);
      const catLabel = c.name_uz || c.name_ru || String(c.id);
      return profs.map((p) => ({
        id: p.id,
        categoryId: c.id,
        label: `${p.name_uz || p.name_ru} (${catLabel})`,
      }));
    }),
  );
  return nested.flat().sort((a, b) => a.label.localeCompare(b.label, 'uz'));
}
