import axios from 'axios';
import { authApi } from '../../services/authApi';
import {
  clearCandidateSession,
  getCandidateProfileId,
  getCandidateRefreshToken,
  getCandidateToken,
  getCandidateUserId,
  KASB_CANDIDATE_PROFILE_ID_KEY,
  setCandidateSession,
  setCandidateUserId,
} from '../candidate/candidateSession';
import type { ProfessionCategoryDto, ProfessionDto } from './professions';
import { API_BASE_URL } from './client';
import { normalizeEducationLevelForApi } from '../lib/adminUiUz';
import { assertApiSuccess } from './users';

function extractObjectArray<T>(data: unknown): T[] {
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  const obj = o.object;
  if (Array.isArray(obj)) return obj as T[];
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const inner = obj as Record<string, unknown>;
    if (Array.isArray(inner.content)) return inner.content as T[];
    if (Array.isArray(inner.items)) return inner.items as T[];
  }
  if (Array.isArray(o.data)) return o.data as T[];
  return [];
}

/** Swagger: maqsad mamlakatlar katalogi — GET /api/admin/destination-countries */
export type DestinationCountryDto = {
  /** Backend UUID yoki raqamli id (string) */
  id: string;
  country_code: string;
  flag_emoji?: string;
  language_req?: string;
  name_ru?: string;
  name_uz?: string;
  note?: string;
  salary_currency?: string;
  salary_currency_symbol?: string;
  salary_max?: number;
  salary_min?: number;
  sort_order?: number;
  is_active?: boolean;
};

function pickStrRow(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/** UUID (32 hex + tire) yoki faqat raqamlardan iborat id */
const DEST_ID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseDestinationCountryId(idRaw: unknown): string | null {
  if (typeof idRaw === 'number' && Number.isFinite(idRaw)) return String(Math.trunc(idRaw));
  if (typeof idRaw === 'string') {
    const s = idRaw.trim();
    if (!s) return null;
    if (DEST_ID_UUID.test(s)) return s;
    if (/^\d+$/.test(s)) return s;
  }
  return null;
}

function normalizeDestinationCountry(row: Record<string, unknown>): DestinationCountryDto | null {
  const active = row.is_active ?? row.isActive;
  if (active === false) return null;

  const id = parseDestinationCountryId(row.id ?? row.destination_country_id ?? row.destinationCountryId);
  if (!id) return null;

  const country_code = pickStrRow(row, 'country_code', 'countryCode').toUpperCase();
  if (!country_code) return null;
  const sortRaw = row.sort_order ?? row.sortOrder;
  const sort_order =
    typeof sortRaw === 'number' && Number.isFinite(sortRaw)
      ? sortRaw
      : typeof sortRaw === 'string' && /^\d+$/.test(sortRaw.trim())
        ? Number(sortRaw.trim())
        : 0;
  const smin = row.salary_min ?? row.salaryMin;
  const smax = row.salary_max ?? row.salaryMax;
  return {
    id,
    country_code,
    flag_emoji: pickStrRow(row, 'flag_emoji', 'flagEmoji') || undefined,
    language_req: pickStrRow(row, 'language_req', 'languageReq') || undefined,
    name_ru: pickStrRow(row, 'name_ru', 'nameRu') || undefined,
    name_uz: pickStrRow(row, 'name_uz', 'nameUz') || undefined,
    note: pickStrRow(row, 'note') || undefined,
    salary_currency: pickStrRow(row, 'salary_currency', 'salaryCurrency') || undefined,
    salary_currency_symbol: pickStrRow(row, 'salary_currency_symbol', 'salaryCurrencySymbol') || undefined,
    salary_min: typeof smin === 'number' && Number.isFinite(smin) ? smin : undefined,
    salary_max: typeof smax === 'number' && Number.isFinite(smax) ? smax : undefined,
    sort_order,
    is_active: active === true ? true : active === false ? false : undefined,
  };
}

/** Nomzod JWT — katalogni olish (backend ruxsat bergan bo‘lsa). */
export async function candidateFetchDestinationCountries(): Promise<DestinationCountryDto[]> {
  const token = getCandidateToken();
  if (!token) throw new Error('Token yo‘q');
  const { data } = await authApi.get<unknown>('/admin/destination-countries', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assertApiSuccess(data);
  const rows = extractObjectArray<Record<string, unknown>>(data);
  const list = rows.map(normalizeDestinationCountry).filter((x): x is DestinationCountryDto => x != null);
  list.sort((a, b) => {
    const ao = a.sort_order ?? 0;
    const bo = b.sort_order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id.localeCompare(b.id);
  });
  return list;
}

function sortProfList<T extends { sort_order?: number; id: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ao = a.sort_order ?? 0;
    const bo = b.sort_order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
}

/** Nomzod JWT bilan — `/api/professions/categories` */
export async function candidateFetchProfessionCategories(): Promise<ProfessionCategoryDto[]> {
  const token = getCandidateToken();
  const { data } = await authApi.get<unknown>('/professions/categories', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  assertApiSuccess(data);
  return sortProfList(extractObjectArray<ProfessionCategoryDto>(data));
}

export async function candidateFetchProfessionsByCategory(categoryId: number): Promise<ProfessionDto[]> {
  const token = getCandidateToken();
  const { data } = await authApi.get<unknown>(`/professions/categories/${categoryId}/professions`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  assertApiSuccess(data);
  return sortProfList(extractObjectArray<ProfessionDto>(data));
}

function unwrapRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.success === false) {
    const msg = typeof o.message === 'string' ? o.message : 'So‘rov rad etildi.';
    throw new Error(msg);
  }
  if (typeof o.object === 'object' && o.object !== null && !Array.isArray(o.object)) {
    return o.object as Record<string, unknown>;
  }
  if (typeof o.data === 'object' && o.data !== null && !Array.isArray(o.data)) {
    return o.data as Record<string, unknown>;
  }
  return o;
}

function pickToken(root: Record<string, unknown>): string | null {
  const t =
    root.accessToken ?? root.access_token ?? root.token ?? root.jwt ?? root.access;
  if (typeof t === 'string' && t) return t;
  const inner = root.object ?? root.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return pickToken(inner as Record<string, unknown>);
  }
  return null;
}

function pickUserIdFromRoot(root: Record<string, unknown>): number | null {
  const u = root.user;
  if (u && typeof u === 'object' && !Array.isArray(u)) {
    const ur = u as Record<string, unknown>;
    const nid = ur.id ?? ur.userId;
    if (typeof nid === 'number' && Number.isFinite(nid)) return nid;
    if (typeof nid === 'string' && /^\d+$/.test(nid.trim())) return Number(nid.trim());
  }
  const uid = root.userId ?? root.user_id;
  if (typeof uid === 'number' && Number.isFinite(uid)) return uid;
  if (typeof uid === 'string' && /^\d+$/.test(uid.trim())) return Number(uid.trim());
  const idRaw = root.id;
  if (typeof idRaw === 'number' && Number.isFinite(idRaw)) return idRaw;
  if (typeof idRaw === 'string' && /^\d+$/.test(idRaw.trim())) return Number(idRaw.trim());
  return null;
}

function pickProfileId(root: Record<string, unknown>): string | null {
  const id =
    root.profileId ??
    root.profile_id ??
    root.candidateProfileId ??
    root.candidate_profile_id ??
    root.candidateProfile?.id;
  if (typeof id === 'string' && id) return id;
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  const cp = root.candidate_profile ?? root.candidateProfile;
  if (cp && typeof cp === 'object' && !Array.isArray(cp)) {
    const nested = pickProfileId(cp as Record<string, unknown>);
    if (nested) return nested;
  }
  const uid = root.id;
  if (typeof uid === 'string' && uid) return uid;
  if (typeof uid === 'number' && Number.isFinite(uid)) return String(uid);
  const inner = root.object ?? root.data ?? root.candidate_profile;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return pickProfileId(inner as Record<string, unknown>);
  }
  return null;
}

function pickRefreshToken(root: Record<string, unknown>): string | null {
  const t = root.refreshToken ?? root.refresh_token;
  if (typeof t === 'string' && t.trim()) return t.trim();
  const inner = root.object ?? root.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return pickRefreshToken(inner as Record<string, unknown>);
  }
  return null;
}

function pickAccessExpiresAt(root: Record<string, unknown>): string | null {
  const t = root.accessExpiresAt ?? root.access_expires_at ?? root.expiresAt;
  if (typeof t === 'string' && t.trim()) return t.trim();
  const inner = root.object ?? root.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return pickAccessExpiresAt(inner as Record<string, unknown>);
  }
  return null;
}

/** verify-otp / refresh / by-tg javobidan nomzod sessiyasi */
function applyCandidateAuthFromVerifyLikePayload(data: unknown): void {
  const flat = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const inner = unwrapRecord(data);
  const root = inner ?? flat;
  if (!root) throw new Error('Noto‘g‘ri javob');
  const token = pickToken(root) ?? (flat ? pickToken(flat) : null);
  if (!token) throw new Error('Token qaytmadi');
  const profileId = pickProfileId(root) ?? (flat ? pickProfileId(flat) : null);
  const userId = pickUserIdFromRoot(root) ?? (flat ? pickUserIdFromRoot(flat) : null);
  const refresh = pickRefreshToken(root) ?? (flat ? pickRefreshToken(flat) : null);
  const accessExpiresAt = pickAccessExpiresAt(root) ?? (flat ? pickAccessExpiresAt(flat) : null);
  setCandidateSession(token, profileId ?? undefined, {
    refreshToken: refresh ?? undefined,
    accessExpiresAt: accessExpiresAt ?? undefined,
  });
  if (userId != null) setCandidateUserId(userId);
}

/** `POST …/auth/refresh` — axios to‘g‘ridan (401 interceptor zanjiri bilan aralashmasin). */
export async function candidateRefreshWithStoredRefresh(): Promise<boolean> {
  const rt = getCandidateRefreshToken();
  if (!rt?.trim()) return false;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const url = `${base}/auth/refresh`;
  for (const body of [{ refreshToken: rt.trim() }, { refresh_token: rt.trim() }]) {
    try {
      const { data } = await axios.post<unknown>(url, body, {
        timeout: 30_000,
        headers: { 'Content-Type': 'application/json' },
      });
      applyCandidateAuthFromVerifyLikePayload(data);
      return true;
    } catch {
      /* keyingi body shakli */
    }
  }
  return false;
}

/**
 * Saqlangan access yoki refresh bilan `/users/me`.
 * Access 401 bo‘lsa refresh, keyin qayta `/users/me`.
 */
export async function candidateTryResumeSession(): Promise<boolean> {
  const access = getCandidateToken();
  const refresh = getCandidateRefreshToken();
  if (!access?.trim() && !refresh?.trim()) return false;

  const authHeader = (tok: string) => ({ Authorization: `Bearer ${tok.trim()}` });

  if (access?.trim()) {
    try {
      const { data } = await authApi.get<unknown>('/users/me', { headers: authHeader(access) });
      assertApiSuccess(data);
      return true;
    } catch (e) {
      if (!axios.isAxiosError(e) || e.response?.status !== 401) return false;
    }
  }

  if (!refresh?.trim()) {
    clearCandidateSession();
    return false;
  }

  const refreshed = await candidateRefreshWithStoredRefresh();
  if (!refreshed) {
    clearCandidateSession();
    return false;
  }

  const next = getCandidateToken();
  if (!next?.trim()) {
    clearCandidateSession();
    return false;
  }
  try {
    const { data } = await authApi.get<unknown>('/users/me', { headers: authHeader(next) });
    assertApiSuccess(data);
    return true;
  } catch {
    clearCandidateSession();
    return false;
  }
}

/** Spring: `400 Bad Request: [{"message":"SMSC not found",...}]` kabi ichki JSON */
function parseSpringEmbeddedErrorList(message: string): string | null {
  const idx = message.indexOf('[');
  if (idx === -1) return null;
  try {
    const arr = JSON.parse(message.slice(idx)) as unknown;
    if (!Array.isArray(arr)) return null;
    const parts: string[] = [];
    for (const item of arr) {
      if (item && typeof item === 'object' && 'message' in item) {
        const m = (item as { message?: unknown }).message;
        if (typeof m === 'string' && m.trim()) parts.push(m.trim());
      }
    }
    return parts.length ? parts.join('. ') : null;
  } catch {
    return null;
  }
}

function humanizeProviderMessage(raw: string): string {
  const t = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  if (/SMSC not found/i.test(t)) {
    return 'SMS yuborish xizmati serverda yo‘q yoki sozlanmagan (SMSC). Administrator SMS provayderini ulaguncha kod kelmaydi.';
  }
  if (/rate limit|too many requests/i.test(t)) {
    return 'Juda ko‘p so‘rov yuborildi. Bir necha daqiqadan keyin qayta urinib ko‘ring.';
  }
  const tl = t.toLowerCase();
  if (
    (/\botp\b/.test(tl) && /noto|invalid|wrong|incorrect|xato/.test(tl)) ||
    /\bkod\b.*noto|noto.*\bkod\b/.test(tl) ||
    (/\bkod\b/.test(tl) && /xato|wrong|invalid/.test(tl) && /sms|verify|tasdiq/.test(tl)) ||
    /invalid\s*(otp|code)/i.test(t) ||
    /wrong\s*(otp|code)/i.test(t) ||
    /incorrect\s*(otp|code)/i.test(t)
  ) {
    return 'Kod xato';
  }
  return t;
}

export function candidatePortalError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const body = err.response?.data;
    if (body && typeof body === 'object') {
      const rec = body as Record<string, unknown>;
      const m = rec.message;
      if (typeof m === 'string' && m) {
        const stripped = m.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
        const inner = parseSpringEmbeddedErrorList(stripped);
        return humanizeProviderMessage(inner ?? stripped);
      }
      if (status === 403) {
        const detail = rec.detail ?? rec.error;
        if (typeof detail === 'string' && detail.trim()) return humanizeProviderMessage(detail.trim());
      }
    }
    if (typeof body === 'string' && body) return humanizeProviderMessage(body);
    if (status === 403) {
      return 'Ruxsat yo‘q (403). OTP dan keyingi nomzod JWT yuborilayotganini va backendda CANDIDATE huquqini tekshiring (admin token yoki o‘chirilgan akkaunt bo‘lishi mumkin).';
    }
    if (status === 401) {
      return 'Sessiya yaroqsiz (401). Qayta OTP bilan kiring.';
    }
  }
  if (err instanceof Error && err.message) return humanizeProviderMessage(err.message);
  return fallback;
}

/** 1-qadam */
export async function candidateSendOtp(phoneE164: string): Promise<void> {
  await authApi.post('/auth/send-otp', {
    phone_number: phoneE164,
    purpose: 'REGISTER',
  });
}

/** 1-qadam — JWT va ixtiyoriy profile id */
/**
 * Telegram deep link: `GET /api/admin/users/by-tg/{chatId}`.
 * Hisob bo‘lsa javobda JWT (verify-otp kabi) bo‘lishi kerak — sessiya saqlanadi.
 */
export async function candidateTrySessionFromTelegramChatId(chatId: string | number): Promise<boolean> {
  const id = String(chatId).trim();
  if (!id || !/^-?\d+$/.test(id)) return false;
  try {
    const { data } = await authApi.get<unknown>(`/admin/users/by-tg/${encodeURIComponent(id)}`);
    applyCandidateAuthFromVerifyLikePayload(data);
    return true;
  } catch {
    return false;
  }
}

export async function candidateVerifyOtp(params: {
  phoneE164: string;
  code: string;
  firstName?: string;
  lastName?: string;
}): Promise<void> {
  const body: Record<string, unknown> = {
    phone_number: params.phoneE164,
    code: params.code.trim(),
    purpose: 'REGISTER',
  };
  if (params.firstName?.trim()) body.first_name = params.firstName.trim();
  if (params.lastName?.trim()) body.last_name = params.lastName.trim();

  const { data } = await authApi.post<unknown>('/auth/verify-otp', body);
  applyCandidateAuthFromVerifyLikePayload(data);
}

async function fetchMeUserId(headers: { Authorization: string }): Promise<number | null> {
  try {
    const { data } = await authApi.get<unknown>('/users/me', { headers });
    const flat = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    const inner = unwrapRecord(data);
    const r = inner ?? flat;
    if (!r) return null;
    return pickUserIdFromRoot(r) ?? (flat ? pickUserIdFromRoot(flat) : null);
  } catch {
    return null;
  }
}

/** JWT + `PATCH /admin/users/edit` — bodyda to‘g‘ridan-to‘g‘ri user obyekti (`{ dto }` emas). */
export type CandidateMyUserUpdateBody = {
  firstName: string;
  lastName: string;
  genderType: 'ERKAK' | 'AYOL';
  dateBirth: string;
  /** OTP qadami bilan bir xil E.164, masalan `+998901234567` */
  phoneNumber: string;
  telegramChatId?: number | null;
};

export async function candidateUpdateMyUser(body: CandidateMyUserUpdateBody): Promise<void> {
  const token = getCandidateToken();
  if (!token) throw new Error('Avval OTP bilan kiring');

  const headers = { Authorization: `Bearer ${token}` };

  let id = getCandidateUserId();
  if (id == null) {
    id = await fetchMeUserId(headers);
    if (id != null) setCandidateUserId(id);
  }
  if (id == null) {
    throw new Error('Foydalanuvchi ID topilmadi. Qayta OTP bilan kiring.');
  }

  const dto: Record<string, unknown> = {
    id,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    genderType: body.genderType,
    dateBirth: body.dateBirth,
    phoneNumber: body.phoneNumber.trim(),
  };
  const tg = body.telegramChatId;
  if (tg != null && Number.isFinite(Number(tg))) {
    dto.telegramChatId = Number(tg);
  }

  try {
    const { data } = await authApi.patch<unknown>('/admin/users/edit', dto, { headers });
    assertApiSuccess(data);
    return;
  } catch (e) {
    if (!axios.isAxiosError(e) || e.response?.status !== 404) throw e;
  }
  const { data } = await authApi.patch<unknown>('/sdg/uz/edit', dto, { headers });
  assertApiSuccess(data);
}

export type CandidateProfileCreateBody = {
  /** Bo‘sh bo‘lsa JSON ga kiritilmaydi (null 500 berishi mumkin) */
  region_id?: number | null;
  marital_status: string;
  education_level: string;
  data_consent: boolean;
  profession_id?: number;
  profession_category_id?: number;
  experience_years?: number;
  availability_status?: string;
  experience_range?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  salary_currency?: string;
  custom_profession_name?: string;
};

export type CandidateProfileUpdateBody = {
  region_id?: number | null;
  marital_status: string;
  education_level: string;
  data_consent: boolean;
  profession_id?: number;
  profession_category_id?: number;
  availability_status?: string;
  experience_range?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  salary_currency?: string;
  custom_profession_name?: string;
  profile_status?: string;
};

/** POST /candidate/profile — null maydonlar va defaultlar backend bilan mos */
function buildCandidateProfileCreatePayload(body: CandidateProfileCreateBody): Record<string, unknown> {
  const {
    region_id,
    profession_id,
    profession_category_id,
    experience_years,
    education_level,
    custom_profession_name,
    ...rest
  } = body;

  const payload: Record<string, unknown> = {
    ...rest,
    education_level: normalizeEducationLevelForApi(education_level),
  };

  if (region_id != null && Number.isFinite(Number(region_id))) {
    payload.region_id = region_id;
  }
  if (experience_years != null && Number.isFinite(Number(experience_years))) {
    payload.experience_years = Math.max(0, Math.trunc(Number(experience_years)));
  }
  const cp = typeof custom_profession_name === 'string' ? custom_profession_name.trim() : '';
  if (cp) payload.custom_profession_name = cp;

  const pcid = profession_category_id;
  const pid = profession_id;
  if (pcid != null && Number.isFinite(Number(pcid)) && Number(pcid) > 0) {
    payload.profession_category_id = Math.trunc(Number(pcid));
  }
  if (pid != null && Number.isFinite(Number(pid)) && Number(pid) > 0) {
    payload.profession_id = Math.trunc(Number(pid));
  } else if (cp && pcid != null && Number.isFinite(Number(pcid)) && Number(pcid) > 0) {
    payload.profession_id = 0;
  }

  return payload;
}

/** PUT — null region_id yuborilmasin */
function stripNullRegionFromPayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (payload.region_id === null || payload.region_id === undefined) {
    const { region_id: _r, ...rest } = payload;
    return rest;
  }
  return payload;
}

/** 2-qadam */
export async function candidateCreateProfile(body: CandidateProfileCreateBody): Promise<string | null> {
  const token = getCandidateToken();
  if (!token) throw new Error('Avval OTP bilan kiring');

  const payload = buildCandidateProfileCreatePayload(body);

  const { data } = await authApi.post<unknown>('/candidate/profile', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const rec = unwrapRecord(data);
  const id = rec ? pickProfileId(rec) : null;
  if (id) {
    try {
      localStorage.setItem(KASB_CANDIDATE_PROFILE_ID_KEY, id);
    } catch {
      /* ignore */
    }
  }
  return id;
}

/** 2-qadam (edit) — Swagger: PUT /api/candidate/profile */
export async function candidateUpdateProfile(body: CandidateProfileUpdateBody): Promise<Record<string, unknown> | null> {
  const token = getCandidateToken();
  if (!token) throw new Error('Avval OTP bilan kiring');

  const raw: Record<string, unknown> = {
    ...body,
    education_level: normalizeEducationLevelForApi(body.education_level),
  };
  const payload = stripNullRegionFromPayload(raw);

  const { data } = await authApi.put<unknown>('/candidate/profile', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrapRecord(data);
}

export async function candidateAddLanguage(body: {
  language: string;
  level: string;
  has_certificate: boolean;
}): Promise<void> {
  const token = getCandidateToken();
  if (!token) throw new Error('Token yo‘q');
  const { data } = await authApi.post<unknown>('/candidate/profile/languages', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  unwrapRecord(data);
}

/** Swagger: POST /api/candidate/profile/work-experiences — JSON massiv (har bir element `CandidateWorkExperienceBody`) */
export type CandidateWorkExperienceBody = {
  profession_id: number;
  profession_category_id: number;
  duration_years: number;
  duration_months: number;
  description?: string;
  custom_profession_name?: string;
};

/** Swagger: POST /api/candidate/profile/work-experiences — body: massiv */
export async function candidateAddWorkExperience(items: CandidateWorkExperienceBody[]): Promise<void> {
  const token = getCandidateToken();
  if (!token) throw new Error('Token yo‘q');
  if (!items.length) throw new Error('Hech bo‘lmaganda bitta ish tajribasi kerak');
  const { data } = await authApi.post<unknown>('/candidate/profile/work-experiences', items, {
    headers: { Authorization: `Bearer ${token}` },
  });
  unwrapRecord(data);
}

export async function candidateAddEducation(body: {
  level: string;
  institution_name: string;
  graduation_year: number;
  country?: string;
  specialty?: string;
}): Promise<void> {
  const token = getCandidateToken();
  if (!token) throw new Error('Token yo‘q');
  await authApi.post('/candidate/profile/educations', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function candidateAddTargetCountry(body: {
  destination_country_id: string;
  priority: number;
}): Promise<void> {
  const token = getCandidateToken();
  if (!token) throw new Error('Token yo‘q');
  const { data } = await authApi.post<unknown>('/candidate/profile/target-countries', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  unwrapRecord(data);
}

function candidateMultipartUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/** Multipart — axios default JSON Content-Type buzmasligi uchun fetch */
export async function candidateUploadDocument(file: File, documentType: string): Promise<void> {
  const token = getCandidateToken();
  if (!token) throw new Error('Token yo‘q');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('document_type', documentType);
  const res = await fetch(candidateMultipartUrl('/candidate/documents'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as Record<string, unknown>;
      if (typeof j.message === 'string') msg = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
}

/** Profilni yakuniy yuborish — `POST /api/candidate/profile/submit` */
export async function candidateSubmitProfile(): Promise<void> {
  const token = getCandidateToken();
  const profileId = getCandidateProfileId();
  if (!token || !profileId) throw new Error('Profil ID yo‘q');
  const { data } = await authApi.post<unknown>(
    '/candidate/profile/submit',
    { profile_id: profileId },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  unwrapRecord(data);
}

export async function candidateFetchProfileMe(): Promise<Record<string, unknown> | null> {
  const token = getCandidateToken();
  if (!token) return null;
  try {
    const { data } = await authApi.get<unknown>('/candidate/profile/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return unwrapRecord(data);
  } catch {
    return null;
  }
}

export type PublicVacancyRow = Record<string, unknown>;

export async function candidateFetchVacancies(params: {
  countryCode?: string;
  professionId?: number;
}): Promise<PublicVacancyRow[]> {
  const token = getCandidateToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await authApi.get<unknown>('/vacancies', {
    params: {
      status: 'ACTIVE',
      ...(params.countryCode?.trim() ? { countryCode: params.countryCode.trim() } : {}),
      ...(params.professionId != null && params.professionId > 0
        ? { professionId: params.professionId }
        : {}),
    },
    headers,
  });
  const rec = unwrapRecord(data);
  if (rec && Array.isArray(rec.content)) return rec.content as PublicVacancyRow[];
  if (Array.isArray(data)) return data as PublicVacancyRow[];
  if (rec && Array.isArray(rec.items)) return rec.items as PublicVacancyRow[];
  return [];
}

export function candidateLogout(): void {
  clearCandidateSession();
}
