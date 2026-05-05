import axios from 'axios';
import { api } from './client';
import { assertApiSuccess } from './users';

const FILE_HASH_KEYS = [
  'fileHashId',
  'file_hash_id',
  'fileHash',
  'hash',
  'hashId',
  'file_hash',
  'storageHash',
  'contentHash',
  'fileUid',
  'uid',
] as const;

function pickHashFromObject(o: Record<string, unknown>): string | null {
  for (const k of FILE_HASH_KEYS) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return null;
}

/** GET/all javobidagi qator — `fileHashId` query uchun */
export function pickFileHashFromFileRow(row: Record<string, unknown>): string | null {
  let h = pickHashFromObject(row);
  if (h) return h;
  for (const v of Object.values(row)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      h = pickHashFromObject(v as Record<string, unknown>);
      if (h) return h;
    }
  }
  return null;
}

export type UserFilesListQuery = {
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

function cleanQuery(q: UserFilesListQuery): Record<string, number> {
  return {
    page: q.page ?? 0,
    size: q.size ?? 30,
  };
}

function unwrapSpringPage<T>(data: unknown): SpringPage<T> {
  const empty: SpringPage<T> = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 30 };
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
        size: arr.length || 30,
      };
    }
    return empty;
  }
  return {
    content: root.content as T[],
    totalElements: typeof root.totalElements === 'number' ? root.totalElements : root.content.length,
    totalPages: typeof root.totalPages === 'number' ? root.totalPages : 0,
    number: typeof root.number === 'number' ? root.number : 0,
    size: typeof root.size === 'number' ? root.size : 30,
  };
}

/** GET /sdg/uz/get/all */
export async function fetchUserFilesList(
  query: UserFilesListQuery,
): Promise<SpringPage<Record<string, unknown>>> {
  const { data } = await api.get<unknown>('/sdg/uz/get/all', { params: cleanQuery(query) });
  assertApiSuccess(data);
  return unwrapSpringPage<Record<string, unknown>>(data);
}

/**
 * GET /sdg/uz/get/one — query `id` (Swagger: int64).
 * Agar backend yo‘l `/sdg/uz/get/one/{fileName}` bo‘lsa, `userFiles.ts` ni moslang.
 */
export async function fetchUserFileBlob(id: number): Promise<{ blob: Blob; fileName?: string }> {
  const res = await api.get<Blob>(`/sdg/uz/get/one`, {
    params: { id },
    responseType: 'blob',
  });
  const blob = res.data;
  const cd = res.headers['content-disposition'];
  let fileName: string | undefined;
  if (typeof cd === 'string') {
    const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(cd);
    if (m?.[1]) fileName = decodeURIComponent(m[1].replace(/"/g, '').trim());
  }
  if (blob.type && blob.type.includes('application/json')) {
    const text = await blob.text();
    try {
      const j = JSON.parse(text) as Record<string, unknown>;
      assertApiSuccess(j);
    } catch {
      throw new Error(text.slice(0, 200) || 'Fayl olishda xato.');
    }
    throw new Error('Kutilmagan javob.');
  }
  return { blob, fileName };
}

/** POST /sdg/uz/upload — multipart/form-data */
export async function uploadUserFile(params: {
  category: string;
  userId: number;
  file: File;
}): Promise<unknown> {
  const body = new FormData();
  body.append('file', params.file);
  const { data } = await api.post<unknown>('/sdg/uz/upload', body, {
    params: {
      category: params.category.trim(),
      userId: params.userId,
    },
  });
  assertApiSuccess(data);
  return data;
}

/**
 * `/sdg/uz/delete?fileHashId=&userId=`
 * Avval DELETE (Swagger); 405 bo‘lsa POST (ba’zi serverlar).
 */
export async function deleteUserFile(params: { fileHashId: string; userId: number }): Promise<void> {
  const query = {
    fileHashId: params.fileHashId.trim(),
    userId: params.userId,
  };

  try {
    const { data } = await api.delete<unknown>('/sdg/uz/delete', { params: query });
    assertApiSuccess(data);
  } catch (e) {
    if (!axios.isAxiosError(e) || e.response?.status !== 405) throw e;
    const { data } = await api.post<unknown>('/sdg/uz/delete', null, { params: query });
    assertApiSuccess(data);
  }
}
