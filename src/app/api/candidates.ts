import axios from 'axios';
import type { AdminLanguageName } from '../lib/adminUiUz';
import { api } from './client';
import { assertApiSuccess } from './users';

export type AvailabilityStatus = 'READY_NOW' | 'WITHIN_1_MONTH' | 'WITHIN_3_MONTHS';
export type ExperienceRange = 'YEAR_1_3' | 'YEAR_3_5' | 'YEAR_5_PLUS';
/** Backend `LanguageName` — `ADMIN_LANGUAGE_SELECT_ORDER` bilan sinxron */
export type AdminLanguage = AdminLanguageName;
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'NONE';
export type AdminProfileStatus = 'ACTIVE' | 'DRAFT' | 'PENDING' | 'PLACED' | 'SUSPENDED';

export type CandidatesListQuery = {
  // ── Sahifa ──────────────────────────────────────────────
  page?: number;
  size?: number;
  sort?: string;

  // ── Qidiruv ─────────────────────────────────────────────
  search?: string;

  // ── Profil holati va agent ───────────────────────────────
  profileStatus?: AdminProfileStatus | '';
  agentId?: number;

  // ── Hudud (nomzod) ───────────────────────────────────────
  regionId?: number;
  regionName?: string;
  regionCode?: string;
  districtId?: number;
  districtCode?: string;

  // ── Kasb ────────────────────────────────────────────────
  categoryId?: number;
  professionId?: number;

  // ── Ta'lim ──────────────────────────────────────────────
  educationLevel?: string;
  educationCountry?: string;
  institutionName?: string;
  universityId?: number;
  graduationYearMin?: number;
  graduationYearMax?: number;

  // ── Tajriba ─────────────────────────────────────────────
  experienceRange?: ExperienceRange | '';
  experienceYearsMin?: number;
  experienceYearsMax?: number;

  // ── Xalqaro tajriba ─────────────────────────────────────
  hasInternationalExperience?: boolean | '';
  internationalCountry?: string;
  internationalYearsMin?: number;

  // ── Tayyor bo'lish ───────────────────────────────────────
  availabilityStatus?: AvailabilityStatus | '';

  // ── Maqsad mamlakat ──────────────────────────────────────
  countryCode?: string;

  // ── Til ─────────────────────────────────────────────────
  language?: AdminLanguage | '';
  languageLevel?: LanguageLevel | '';

  // ── Maosh ───────────────────────────────────────────────
  salaryMin?: number;
  salaryMax?: number;

  // ── Yosh ────────────────────────────────────────────────
  ageMin?: number;
  ageMax?: number;

  // ── UI uchun qo'shimcha (kandidat hududi / OTM hududi) ───
  candidateRegionId?: number;
  candidateRegionName?: string;
  universityRegionId?: number;
  universityRegionName?: string;
};

export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

function cleanQuery(q: CandidatesListQuery): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {
    page: q.page ?? 0,
    size: q.size ?? 20,
  };
  if (q.sort?.trim()) out.sort = q.sort.trim();
  if (q.search?.trim()) out.search = q.search.trim();

  // Profil holati va agent
  if (q.profileStatus) out.profileStatus = q.profileStatus;
  if (q.agentId != null && q.agentId > 0) out.agentId = q.agentId;

  // Hudud — candidateRegionId ustunlik qiladi, keyin regionId
  const regionId = q.candidateRegionId ?? q.regionId;
  if (regionId != null && regionId > 0) out.regionId = regionId;
  const regionCode = q.regionCode?.trim();
  if (regionCode) out.regionCode = regionCode;
  const districtId = q.districtId;
  if (districtId != null && districtId > 0) out.districtId = districtId;
  const districtCode = q.districtCode?.trim();
  if (districtCode) out.districtCode = districtCode;
  const regionName = (q.candidateRegionName ?? q.regionName)?.trim();
  if (regionName) {
    out.regionName = regionName;
    out.region_name_uz = regionName;
  }

  // Kasb
  if (q.categoryId != null && q.categoryId > 0) out.categoryId = q.categoryId;
  if (q.professionId != null && q.professionId > 0) out.professionId = q.professionId;

  // Ta'lim
  const educationLevel = q.educationLevel?.trim();
  if (educationLevel) { out.educationLevel = educationLevel; out.education_level = educationLevel; }
  const educationCountry = q.educationCountry?.trim();
  if (educationCountry) out.educationCountry = educationCountry;
  const institutionName = q.institutionName?.trim();
  if (institutionName) { out.institutionName = institutionName; out.institution_name = institutionName; }
  if (q.universityId != null && q.universityId > 0) out.universityId = q.universityId;
  if (q.graduationYearMin != null && q.graduationYearMin > 0) out.graduationYearMin = q.graduationYearMin;
  if (q.graduationYearMax != null && q.graduationYearMax > 0) out.graduationYearMax = q.graduationYearMax;

  // Tajriba
  if (q.experienceRange) out.experienceRange = q.experienceRange;
  if (q.experienceYearsMin != null && q.experienceYearsMin >= 0) out.experienceYearsMin = q.experienceYearsMin;
  if (q.experienceYearsMax != null && q.experienceYearsMax > 0) out.experienceYearsMax = q.experienceYearsMax;

  // Xalqaro tajriba
  if (q.hasInternationalExperience === true || q.hasInternationalExperience === false) {
    out.hasInternationalExperience = q.hasInternationalExperience;
  }
  const intlCountry = q.internationalCountry?.trim();
  if (intlCountry) out.internationalCountry = intlCountry;
  if (q.internationalYearsMin != null && q.internationalYearsMin > 0) out.internationalYearsMin = q.internationalYearsMin;

  // Tayyor bo'lish
  if (q.availabilityStatus) out.availabilityStatus = q.availabilityStatus;

  // Maqsad mamlakat
  if (q.countryCode?.trim()) out.countryCode = q.countryCode.trim();

  // Til
  if (q.language) out.language = q.language;
  if (q.languageLevel) out.languageLevel = q.languageLevel;

  // Maosh
  if (q.salaryMin != null && q.salaryMin > 0) out.salaryMin = q.salaryMin;
  if (q.salaryMax != null && q.salaryMax > 0) out.salaryMax = q.salaryMax;

  // Yosh
  if (q.ageMin != null && q.ageMin > 0) out.ageMin = q.ageMin;
  if (q.ageMax != null && q.ageMax > 0) out.ageMax = q.ageMax;

  return out;
}

function unwrapSpringPage<T>(data: unknown): SpringPage<T> {
  const empty: SpringPage<T> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 20,
  };
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
  if (!root || !Array.isArray(root.content)) return empty;
  return {
    content: root.content as T[],
    totalElements: typeof root.totalElements === 'number' ? root.totalElements : root.content.length,
    totalPages: typeof root.totalPages === 'number' ? root.totalPages : 0,
    number: typeof root.number === 'number' ? root.number : 0,
    size: typeof root.size === 'number' ? root.size : 20,
  };
}

export async function fetchCandidatesList(
  query: CandidatesListQuery,
): Promise<SpringPage<Record<string, unknown>>> {
  /** Swagger: GET /api/admin/candidates — `baseURL` `/api` → `/admin/candidates` */
  const { data } = await api.get<unknown>('/admin/candidates', { params: cleanQuery(query) });
  assertApiSuccess(data);
  return unwrapSpringPage<Record<string, unknown>>(data);
}

/** Batafsil — GET /api/admin/candidates/{id} (`candidate_id` / `profile_id`, `user_id` emas) */
export async function fetchCandidateById(id: string | number): Promise<Record<string, unknown> | null> {
  const { data } = await api.get<unknown>(`/admin/candidates/${encodeURIComponent(String(id))}`);
  assertApiSuccess(data);
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (typeof o.object === 'object' && o.object !== null && !Array.isArray(o.object)) {
    return o.object as Record<string, unknown>;
  }
  if (typeof o.data === 'object' && o.data !== null && !Array.isArray(o.data)) {
    return o.data as Record<string, unknown>;
  }
  return o as Record<string, unknown>;
}

/**
 * Nomzod CV ni HTML matn sifatida qaytaradi.
 *
 * Asosiy:  GET /api/candidate/cv/html/{candidateId}
 * Fallback: GET /api/candidate/cv/html/user/{userId}  (ixtiyoriy)
 *
 * `api` baseURL `/api` bo'lsa, path `/candidate/cv/html/...` to'g'ri bo'ladi.
 * Agar backend `/api/admin/...` prefixi talab qilsa, pastdagi yo'lni moslashtiring.
 */
export async function fetchCandidateCvHtml(
  candidateId: string | number,
  fallbackUserId?: number,
): Promise<string> {
  try {
    const { data } = await api.get<string>(
      `/candidate/cv/html/${encodeURIComponent(String(candidateId))}`,
      { responseType: 'text' },
    );
    return typeof data === 'string' ? data : String(data ?? '');
  } catch (primaryErr) {
    // userId orqali fallback
    if (fallbackUserId != null && fallbackUserId > 0) {
      try {
        const { data } = await api.get<string>(
          `/candidate/cv/html/user/${encodeURIComponent(String(fallbackUserId))}`,
          { responseType: 'text' },
        );
        return typeof data === 'string' ? data : String(data ?? '');
      } catch {
        // fallback ham ishlamasa — asl xatoni tashlaymiz
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}

/** Profil holati — PATCH body: { profile_status } */
export async function updateCandidateProfileStatus(
  id: string | number,
  profile_status: AdminProfileStatus | string,
): Promise<void> {
  const { data } = await api.patch<unknown>(
    `/admin/candidates/${encodeURIComponent(String(id))}/status`,
    { profile_status },
  );
  assertApiSuccess(data);
}

/** Agent biriktirish */
export async function assignCandidateAgent(candidateId: string | number, agent_id: number): Promise<void> {
  const { data } = await api.post<unknown>(
    `/admin/candidates/${encodeURIComponent(String(candidateId))}/assign-agent`,
    { agent_id },
  );
  assertApiSuccess(data);
}

/** Nomzod profilini o'chirish — DELETE /api/admin/candidates/{id} */
export async function deleteCandidate(id: string | number): Promise<void> {
  const { data } = await api.delete<unknown>(`/admin/candidates/${encodeURIComponent(String(id))}`);
  assertApiSuccess(data);
}

export function pickCandidateField(obj: unknown, ...keys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    if (k in o && o[k] !== undefined && o[k] !== null) return o[k];
  }
  return undefined;
}

export function pickStr(obj: unknown, ...keys: string[]): string {
  const v = pickCandidateField(obj, ...keys);
  if (v === undefined || v === null) return '';
  return String(v);
}

export function pickNum(obj: unknown, ...keys: string[]): number | undefined {
  const v = pickCandidateField(obj, ...keys);
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Admin ro'yxati (GET /admin/candidates) qatoridan GET/PATCH/DELETE uchun `{id}`.
 * Ichki `candidate_profile` / `candidateProfile` obyektlarini ham tekshiradi.
 */
export function adminCandidateIdFromListRow(row: unknown, depth = 0): string | null {
  if (depth > 4 || !row || typeof row !== 'object' || Array.isArray(row)) return null;
  const o = row as Record<string, unknown>;

  /** Ro'yxatda ko'pincha UUID qator (`candidate_id`) — `pickNum` buni o'tkazib yuborardi. */
  const candidateKey = pickStr(o, 'candidate_id', 'candidateId').trim();
  if (candidateKey) return candidateKey;

  const n = pickNum(o, 'profile_id', 'profileId', 'nomzod_id', 'nomzodId');
  if (n != null && n > 0) return String(n);

  const idStr = pickStr(
    o,
    'candidate_profile_id',
    'candidateProfileId',
    'profile_uuid',
    'profileUuid',
    'uuid',
    'public_id',
    'publicId',
  ).trim();
  if (idStr) return idStr;

  for (const k of ['candidate_profile', 'candidateProfile', 'profile'] as const) {
    const inner = o[k];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const sub = adminCandidateIdFromListRow(inner, depth + 1);
      if (sub) return sub;
    }
  }

  const fallbackN = pickNum(o, 'id');
  if (fallbackN != null && fallbackN > 0) return String(fallbackN);

  const fallbackS = pickStr(o, 'id').trim();
  if (fallbackS) return fallbackS;

  /** Ba'zi ro'yxatlarda faqat foydalanuvchi ID bo'lishi mumkin (backend `{id}` ni qabul qilsa). */
  const userN = pickNum(o, 'user_id', 'userId');
  if (userN != null && userN > 0) return String(userN);

  return null;
}

/** Admin profil — `target_countries[]` elementi (ichki `destination_country` bilan) */
export type AdminTargetCountryRow = {
  rowId: string;
  priority: number;
  countryCode: string;
  nameUz: string;
  nameRu: string;
  flagEmoji: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salarySymbol: string;
  languageReq: string;
  note: string;
  isActive?: boolean;
  sortOrder?: number;
};

function pickStrFromRow(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/** GET /admin/candidates/{id} — `target_countries` massivini normalizatsiya */
export function parseAdminTargetCountries(raw: unknown): AdminTargetCountryRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: AdminTargetCountryRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item === 'string') {
      const countryCode = item.trim().toUpperCase();
      if (!countryCode) continue;
      rows.push({
        rowId: `tc-${i}`,
        priority: rows.length + 1,
        countryCode,
        nameUz: '',
        nameRu: '',
        flagEmoji: '',
        salaryCurrency: '',
        salarySymbol: '',
        languageReq: '',
        note: '',
      });
      continue;
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const destRaw = o.destination_country ?? o.destinationCountry;
    const dest =
      destRaw && typeof destRaw === 'object' && !Array.isArray(destRaw)
        ? (destRaw as Record<string, unknown>)
        : o;
    const countryCode = pickStrFromRow(dest, 'country_code', 'countryCode').toUpperCase();
    if (!countryCode) continue;
    const pr = pickNum(o, 'priority');
    const smin = pickNum(dest, 'salary_min', 'salaryMin');
    const smax = pickNum(dest, 'salary_max', 'salaryMax');
    const sortRaw = pickNum(dest, 'sort_order', 'sortOrder');
    const active = pickCandidateField(dest, 'is_active', 'isActive');
    rows.push({
      rowId: pickStrFromRow(o, 'id') || `tc-${i}`,
      priority: pr ?? rows.length + 1,
      countryCode,
      nameUz: pickStrFromRow(dest, 'name_uz', 'nameUz'),
      nameRu: pickStrFromRow(dest, 'name_ru', 'nameRu'),
      flagEmoji: pickStrFromRow(dest, 'flag_emoji', 'flagEmoji'),
      salaryMin: smin,
      salaryMax: smax,
      salaryCurrency: pickStrFromRow(dest, 'salary_currency', 'salaryCurrency'),
      salarySymbol: pickStrFromRow(dest, 'salary_currency_symbol', 'salaryCurrencySymbol'),
      languageReq: pickStrFromRow(dest, 'language_req', 'languageReq'),
      note: pickStrFromRow(dest, 'note'),
      isActive: typeof active === 'boolean' ? active : undefined,
      sortOrder: sortRaw,
    });
  }
  return rows.sort((a, b) => a.priority - b.priority);
}

export function axiosErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message && !axios.isAxiosError(err)) return err.message;
  if (!axios.isAxiosError(err)) return fallback;
  const body = err.response?.data;
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    const m = o.message ?? o.error ?? o.detail ?? o.msg;
    if (typeof m === 'string' && m) return m.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  }
  if (typeof body === 'string' && body) return body;
  return fallback;
}