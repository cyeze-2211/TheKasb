/** O‘zbekiston: +998, milliy qism 9 raqam. Ko‘rinish: +998 xx xxx xx xx; API: bo‘shliqsiz +998XXXXXXXXX */

export const UZ_PHONE_PREFIX = '+998';

/**
 * Faqat milliy 9 raqam.
 * Agar foydalanuvchi maydonga `998…` bilan boshlangan to‘g‘ri milliy raqam kiritgan bo‘lsa — saqlanadi.
 * Agar `998` qo‘shimcha bo‘lsa (masalan `998901234567` yoki 9 tadan ortiq raqam) — bitta `998` prefiksi kesiladi.
 */
export function sanitizeNationalDigits(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.length > 9 && d.startsWith('998')) {
    d = d.slice(3);
  }
  return d.slice(0, 9);
}

/** Milliy qismni `xx xxx xx xx` ko‘rinishida */
export function formatNationalDisplay(nineDigits: string): string {
  const d = sanitizeNationalDigits(nineDigits);
  if (d.length === 0) return '';
  let s = d.slice(0, 2);
  if (d.length > 2) s += ' ' + d.slice(2, 5);
  if (d.length > 5) s += ' ' + d.slice(5, 7);
  if (d.length > 7) s += ' ' + d.slice(7, 9);
  return s;
}

/** API uchun: to‘liq 9 raqam bo‘lsa `+998...`, aks holda `null` */
export function toApiPhone(nationalDigits: string): string | null {
  const d = sanitizeNationalDigits(nationalDigits);
  if (d.length !== 9) return null;
  return `${UZ_PHONE_PREFIX}${d}`;
}
