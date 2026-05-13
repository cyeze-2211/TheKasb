/**
 * Admin UI matnlari — API qiymatlari (value) o‘zgarmaydi, faqat foydalanuvchiga ko‘rinadigan yorliqlar.
 */

export const vacancyStatusUz: Record<string, string> = {
  DRAFT: 'Qoralama',
  ACTIVE: 'Faol',
  CLOSED: 'Yopilgan',
  FILLED: 'Joylangan',
  PAUSED: 'Pauza',
};

export const candidateProfileStatusUz: Record<string, string> = {
  ACTIVE: 'Faol',
  DRAFT: 'Qoralama',
  PENDING: 'Kutilmoqda',
  PLACED: 'Joylangan',
  SUSPENDED: 'To‘xtatilgan',
};

export const accountTypeUz: Record<string, string> = {
  CANDIDATE: 'Nomzod',
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Super administrator',
  AGENT: 'Agent',
};

export const workScheduleUz: Record<string, string> = {
  FULL_TIME: 'To‘liq kun',
  PART_TIME: 'Yarim kun',
  SHIFT: 'Smena',
};

export const genderRequirementUz: Record<string, string> = {
  ANY: 'Farq qilmaydi',
  MALE: 'Erkak',
  FEMALE: 'Ayol',
};

export const experienceRangeUz: Record<string, string> = {
  YEAR_1_3: '1–3 yil',
  YEAR_3_5: '3–5 yil',
  YEAR_5_PLUS: '5+ yil',
};

/**
 * Backend `LanguageName` — selectda **bitta** qator; tartib Java enum bilan mos.
 * Qisqa kodlar (`EN`, `RU`, …) faqat `adminLanguageUz` lookup uchun, ro‘yxatga kiritilmaydi.
 */
export const ADMIN_LANGUAGE_SELECT_ORDER = [
  'RUSSIAN',
  'ENGLISH',
  'GERMAN',
  'KOREAN',
  'TURKISH',
  'POLISH',
  'JAPANESE',
  'CHINESE',
  'ARABIC',
  'HINDI',
  'FRENCH',
  'SPANISH',
  'ITALIAN',
  'PORTUGUESE',
  'UKRAINIAN',
  'UZBEK',
  'KAZAKH',
  'TAJIK',
  'KYRGYZ',
  'OTHER',
] as const;

export type AdminLanguageName = (typeof ADMIN_LANGUAGE_SELECT_ORDER)[number];

const ADMIN_LANGUAGE_NAME_LABELS: Record<AdminLanguageName, string> = {
  RUSSIAN: 'Rus tili',
  ENGLISH: 'Ingliz tili',
  GERMAN: 'Nemis tili',
  KOREAN: 'Koreys tili',
  TURKISH: 'Turk tili',
  POLISH: 'Polyak tili',
  JAPANESE: 'Yapon tili',
  CHINESE: 'Xitoy tili',
  ARABIC: 'Arab tili',
  HINDI: 'Hind tili',
  FRENCH: 'Fransuz tili',
  SPANISH: 'Ispan tili',
  ITALIAN: 'Italyan tili',
  PORTUGUESE: 'Portugal tili',
  UKRAINIAN: 'Ukrain tili',
  UZBEK: 'O‘zbek tili',
  KAZAKH: 'Qozoq tili',
  TAJIK: 'Tojik tili',
  KYRGYZ: 'Qirg‘iz tili',
  OTHER: 'Boshqa',
};

/** ISO 639-1 / qisqa kodlar — eski ma’lumot va API uchun yorliq (selectda ko‘rinmaydi) */
const ADMIN_LANGUAGE_ALIASES: Record<string, string> = {
  EN: ADMIN_LANGUAGE_NAME_LABELS.ENGLISH,
  RU: ADMIN_LANGUAGE_NAME_LABELS.RUSSIAN,
  DE: ADMIN_LANGUAGE_NAME_LABELS.GERMAN,
  KO: ADMIN_LANGUAGE_NAME_LABELS.KOREAN,
  PL: ADMIN_LANGUAGE_NAME_LABELS.POLISH,
  TR: ADMIN_LANGUAGE_NAME_LABELS.TURKISH,
  FR: ADMIN_LANGUAGE_NAME_LABELS.FRENCH,
  IT: ADMIN_LANGUAGE_NAME_LABELS.ITALIAN,
  ES: ADMIN_LANGUAGE_NAME_LABELS.SPANISH,
  PT: ADMIN_LANGUAGE_NAME_LABELS.PORTUGUESE,
  JA: ADMIN_LANGUAGE_NAME_LABELS.JAPANESE,
  ZH: ADMIN_LANGUAGE_NAME_LABELS.CHINESE,
  AR: ADMIN_LANGUAGE_NAME_LABELS.ARABIC,
  UZ: ADMIN_LANGUAGE_NAME_LABELS.UZBEK,
};

export const adminLanguageUz: Record<string, string> = {
  ...ADMIN_LANGUAGE_NAME_LABELS,
  ...ADMIN_LANGUAGE_ALIASES,
};

export const cefrLevelUz: Record<string, string> = {
  NONE: 'Yo‘q',
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
  C2: 'C2',
};

/** Backend `EducationLevel` (Java) */
const EDUCATION_LEVEL_VALID = new Set([
  'PRIMARY',
  'SECONDARY',
  'VOCATIONAL',
  'COLLEGE',
  'TECHNICAL_SCHOOL',
  'INCOMPLETE_HIGHER',
  'BACHELOR',
  'MASTER',
  'PHD',
  'DSC',
  'SELF_TAUGHT',
  'OTHER',
]);

const EDUCATION_LEVEL_LEGACY: Record<string, string> = {
  HIGHER: 'BACHELOR',
  SECONDARY_GENERAL: 'SECONDARY',
  BASIC: 'PRIMARY',
  NONE: 'OTHER',
};

/** POST/PUT — noto‘g‘ri enum xatosi oldini olish */
export function normalizeEducationLevelForApi(raw: string | undefined | null): string {
  const u = (raw || '').trim().toUpperCase();
  if (!u) return 'BACHELOR';
  if (EDUCATION_LEVEL_VALID.has(u)) return u;
  return EDUCATION_LEVEL_LEGACY[u] ?? 'BACHELOR';
}

/** Select uchun — profilda eski qiymat bo‘lsa */
export function educationLevelToFormValue(raw: string | undefined | null): string {
  return normalizeEducationLevelForApi(raw);
}

export const EDUCATION_LEVEL_SELECT_ORDER: readonly string[] = [
  'PRIMARY',
  'SECONDARY',
  'VOCATIONAL',
  'COLLEGE',
  'TECHNICAL_SCHOOL',
  'INCOMPLETE_HIGHER',
  'BACHELOR',
  'MASTER',
  'PHD',
  'DSC',
  'SELF_TAUGHT',
  'OTHER',
];

export const educationLevelUz: Record<string, string> = {
  PRIMARY: 'Boshlang‘ich maktab',
  SECONDARY: 'O‘rta maktab',
  VOCATIONAL: 'Kasb-hunar / professional',
  COLLEGE: 'Kollej',
  TECHNICAL_SCHOOL: 'Texnikum',
  INCOMPLETE_HIGHER: 'Tugallanmagan oliy',
  BACHELOR: 'Bakalavr',
  MASTER: 'Magistr',
  PHD: 'PhD',
  DSC: 'Fan doktori (DSc)',
  SELF_TAUGHT: 'Mustaqil o‘rgangan',
  OTHER: 'Boshqa',
  HIGHER: 'Oliy (eskicha)',
  SECONDARY_GENERAL: 'Umumiy o‘rta (eskicha)',
  BASIC: 'Boshlang‘ich (eskicha)',
  NONE: 'Ko‘rsatilmagan (eskicha)',
};

export const maritalStatusUz: Record<string, string> = {
  SINGLE: 'Bo‘ydoq',
  MARRIED: 'Uylangan',
  DIVORCED: 'Ajrashgan',
  WIDOWED: 'Beva',
};

export const documentTypeUz: Record<string, string> = {
  WORK_PERMIT: 'Ish ruxsatnomasi',
  PASSPORT: 'Pasport',
  VISA: 'Viza',
  DIPLOMA: 'Diplom',
  CERTIFICATE: 'Sertifikat',
  MEDICAL: 'Tibbiy hujjat',
  OTHER: 'Boshqa',
};

export function uzOrCode(map: Record<string, string>, code: string): string {
  const c = (code || '').trim();
  return map[c] ?? c;
}
