/** Backend `category` — Sozlamalar / fayl yuklash va delete-preview */
export const USER_FILE_CATEGORIES = [
  { value: 'admin_category', label: 'Admin kategoriya' },
  { value: 'user_avatar', label: 'Foydalanuvchi avatari' },
  { value: 'user_document', label: 'Foydalanuvchi hujjati' },
] as const;

export type UserFileCategory = (typeof USER_FILE_CATEGORIES)[number]['value'];

const USER_FILE_CATEGORY_SET = new Set<string>(USER_FILE_CATEGORIES.map((c) => c.value));

/** POST /api/file/upload — faqat shu qiymatlar qabul qilinadi */
export function normalizeUserFileCategory(raw: string | null | undefined): UserFileCategory {
  const key = (raw ?? '').trim();
  if (USER_FILE_CATEGORY_SET.has(key)) return key as UserFileCategory;
  return 'user_document';
}

/** Nomzod hujjat turi → admin fayl kategoriyasi */
export function candidateDocumentTypeToFileCategory(documentType: string): UserFileCategory {
  const t = documentType.trim().toUpperCase();
  if (t === 'PHOTO') return 'user_avatar';
  return 'user_document';
}

const LABEL_BY_VALUE = Object.fromEntries(
  USER_FILE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<string, string>;

export function userFileCategoryLabel(category: string): string {
  const key = category.trim();
  return LABEL_BY_VALUE[key] ?? key.replace(/_/g, ' ');
}
