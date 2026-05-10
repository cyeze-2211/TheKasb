import { adminLanguageUz, uzOrCode } from './adminUiUz';
import { emojiFlagFromAlpha2 } from './regionFlags';

/** To‘liq nom (ENGLISH) yoki qisqa ISO 639-1 — bayroq. */
export const LANGUAGE_FLAG_EMOJI: Record<string, string> = {
  RUSSIAN: '🇷🇺',
  ENGLISH: '🇬🇧',
  GERMAN: '🇩🇪',
  KOREAN: '🇰🇷',
  TURKISH: '🇹🇷',
  POLISH: '🇵🇱',
  OTHER: '🌐',
};

/**
 * ISO 639-1 ikki harf til kodi → mamlakat alpha-2 (til–mamlakat mosligi).
 * Aks holda `emojiFlagFromAlpha2` (masalan DE → 🇩🇪).
 */
const ISO639_1_TO_ALPHA2: Record<string, string> = {
  EN: 'GB',
  JA: 'JP',
  ZH: 'CN',
  KO: 'KR',
  AR: 'SA',
  FA: 'IR',
  HE: 'IL',
  HI: 'IN',
  VI: 'VN',
  MS: 'MY',
  TL: 'PH',
  UK: 'UA',
  SQ: 'AL',
  BS: 'BA',
  HR: 'HR',
  SR: 'RS',
  SL: 'SI',
  ET: 'EE',
  LV: 'LV',
  LT: 'LT',
  IS: 'IS',
  GA: 'IE',
  CY: 'GB',
  EU: 'ES',
  CA: 'ES',
  GL: 'ES',
};

export function languageFlagEmoji(code: string): string {
  const k = (code || '').trim().toUpperCase();
  if (!k) return '🌐';
  if (LANGUAGE_FLAG_EMOJI[k]) return LANGUAGE_FLAG_EMOJI[k];
  if (k.length === 2 && /^[A-Z]{2}$/.test(k)) {
    const a2 = ISO639_1_TO_ALPHA2[k] ?? k;
    return emojiFlagFromAlpha2(a2);
  }
  return '🌐';
}

export function languageLabelUz(code: string): string {
  return uzOrCode(adminLanguageUz, (code || '').trim().toUpperCase());
}

/** "RUSSIAN, ENGLISH" yoki bitta kod */
export function parseLanguageCodesFromCell(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];
  const s = raw.trim();
  if (!s) return [];
  if (s.includes(',')) {
    return s
      .split(',')
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean);
  }
  return [s.toUpperCase()];
}
