import { COUNTRIES } from '../data/mockData';

/** ISO 3166-1 alpha-2 → bayroq (Unicode regional indicator). */
export function emojiFlagFromAlpha2(alpha2: string): string {
  const c = alpha2.toUpperCase().replace(/[^A-Z]/g, '');
  if (c.length !== 2) return '🌐';
  const base = 0x1f1e6;
  return String.fromCodePoint(base + c.charCodeAt(0) - 65, base + c.charCodeAt(1) - 65);
}

/** Keng tarqalgan alpha-3 → alpha-2 (jadvalda yo‘q bo‘lsa ham bayroq chiqishi uchun). */
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  DEU: 'DE',
  USA: 'US',
  GBR: 'GB',
  KOR: 'KR',
  RUS: 'RU',
  POL: 'PL',
  TUR: 'TR',
  UZB: 'UZ',
  KAZ: 'KZ',
  CZE: 'CZ',
  LTU: 'LT',
  ARE: 'AE',
  UKR: 'UA',
  FRA: 'FR',
  ITA: 'IT',
  ESP: 'ES',
  PRT: 'PT',
  NLD: 'NL',
  BEL: 'BE',
  CHE: 'CH',
  AUT: 'AT',
  SWE: 'SE',
  NOR: 'NO',
  DNK: 'DK',
  FIN: 'FI',
  IRL: 'IE',
  GRC: 'GR',
  ROU: 'RO',
  BGR: 'BG',
  HRV: 'HR',
  SVK: 'SK',
  SVN: 'SI',
  HUN: 'HU',
  EST: 'EE',
  LVA: 'LV',
  BLR: 'BY',
  MDA: 'MD',
  GEO: 'GE',
  AZE: 'AZ',
  ARM: 'AM',
  CHN: 'CN',
  JPN: 'JP',
  IND: 'IN',
  BGD: 'BD',
  IDN: 'ID',
  MYS: 'MY',
  PHL: 'PH',
  THA: 'TH',
  VNM: 'VN',
  KHM: 'KH',
  LAO: 'LA',
  MMR: 'MM',
  SGP: 'SG',
  TWN: 'TW',
  HKG: 'HK',
  SAU: 'SA',
  QAT: 'QA',
  KWT: 'KW',
  BHR: 'BH',
  OMN: 'OM',
  YEM: 'YE',
  JOR: 'JO',
  LBN: 'LB',
  SYR: 'SY',
  IRQ: 'IQ',
  IRN: 'IR',
  ISR: 'IL',
  CAN: 'CA',
  MEX: 'MX',
  BRA: 'BR',
  ARG: 'AR',
  CHL: 'CL',
  COL: 'CO',
  PER: 'PE',
  AUS: 'AU',
  NZL: 'NZ',
  ZAF: 'ZA',
  EGY: 'EG',
  NGA: 'NG',
  MAR: 'MA',
  TUN: 'TN',
  DZA: 'DZ',
  PAK: 'PK',
};

/**
 * Mamlakat kodi: alpha-3 (`DEU`), alpha-2 (`DE`) yoki `mockData` dagi kod.
 */
export function countryFlagEmoji(code: string): string {
  const raw = (code || '').trim().toUpperCase();
  if (!raw) return '🌐';
  /** Ba’zi API lar Buyuk Britaniya uchun `UK` yuboradi (rasmiy alpha-2: `GB`). */
  if (raw === 'UK') return emojiFlagFromAlpha2('GB');
  const row = COUNTRIES.find((x) => x.code === raw);
  if (row) return row.flag;
  if (raw.length === 2 && /^[A-Z]{2}$/.test(raw)) return emojiFlagFromAlpha2(raw);
  const a2 = ALPHA3_TO_ALPHA2[raw];
  if (a2) return emojiFlagFromAlpha2(a2);
  return '🌐';
}

export function countryNameUz(code: string): string | null {
  const raw = (code || '').trim().toUpperCase();
  if (!raw) return null;
  const row3 = COUNTRIES.find((x) => x.code === raw);
  if (row3) return row3.name;
  if (raw.length === 2 && /^[A-Z]{2}$/.test(raw)) {
    const alpha3 = (Object.entries(ALPHA3_TO_ALPHA2) as [string, string][]).find(([, v]) => v === raw)?.[0];
    if (alpha3) {
      const r = COUNTRIES.find((c) => c.code === alpha3);
      if (r) return r.name;
    }
    return null;
  }
  return null;
}
