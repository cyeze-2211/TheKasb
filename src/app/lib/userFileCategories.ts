/** Backend `category` — Sozlamalar / fayl yuklash va delete-preview */
export const USER_FILE_CATEGORIES = [
  { value: 'admin_category', label: 'Admin kategoriya' },
  { value: 'user_avatar', label: 'Foydalanuvchi avatari' },
  { value: 'user_document', label: 'Foydalanuvchi hujjati' },
] as const;

const LABEL_BY_VALUE = Object.fromEntries(
  USER_FILE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<string, string>;

export function userFileCategoryLabel(category: string): string {
  const key = category.trim();
  return LABEL_BY_VALUE[key] ?? key.replace(/_/g, ' ');
}
