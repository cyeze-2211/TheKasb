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

export const adminLanguageUz: Record<string, string> = {
  ENGLISH: 'Ingliz tili',
  EN: 'Ingliz tili',
  GERMAN: 'Nemis tili',
  DE: 'Nemis tili',
  KOREAN: 'Koreys tili',
  KO: 'Koreys tili',
  POLISH: 'Polyak tili',
  PL: 'Polyak tili',
  RUSSIAN: 'Rus tili',
  RU: 'Rus tili',
  TURKISH: 'Turk tili',
  TR: 'Turk tili',
  FRENCH: 'Fransuz tili',
  FR: 'Fransuz tili',
  ITALIAN: 'Italyan tili',
  IT: 'Italyan tili',
  SPANISH: 'Ispan tili',
  ES: 'Ispan tili',
  PORTUGUESE: 'Portugal tili',
  PT: 'Portugal tili',
  JAPANESE: 'Yapon tili',
  JA: 'Yapon tili',
  CHINESE: 'Xitoy tili',
  ZH: 'Xitoy tili',
  ARABIC: 'Arab tili',
  AR: 'Arab tili',
  UZBEK: 'O‘zbek tili',
  UZ: 'O‘zbek tili',
  OTHER: 'Boshqa',
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

export const educationLevelUz: Record<string, string> = {
  HIGHER: 'Oliy',
  SECONDARY: 'O‘rta maxsus',
  SECONDARY_GENERAL: 'Umumiy o‘rta',
  BASIC: 'Boshlang‘ich',
  NONE: 'Ko‘rsatilmagan',
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
