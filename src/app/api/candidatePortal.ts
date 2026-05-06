import axios from 'axios';
import { authApi } from '../../services/authApi';
import {
  clearCandidateSession,
  getCandidateProfileId,
  getCandidateToken,
  KASB_CANDIDATE_PROFILE_ID_KEY,
  setCandidateSession,
} from '../candidate/candidateSession';

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
    const body = err.response?.data;
    if (body && typeof body === 'object') {
      const rec = body as Record<string, unknown>;
      const m = rec.message;
      if (typeof m === 'string' && m) {
        const stripped = m.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
        const inner = parseSpringEmbeddedErrorList(stripped);
        return humanizeProviderMessage(inner ?? stripped);
      }
    }
    if (typeof body === 'string' && body) return humanizeProviderMessage(body);
  }
  if (err instanceof Error && err.message) return humanizeProviderMessage(err.message);
  return fallback;
}

/** 1-qadam */
export async function candidateSendOtp(phoneE164: string): Promise<void> {
  await authApi.post('/auth/send-otp', {
    phone_number: phoneE164,
    purpose: 'LOGIN',
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
    const flat = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    const inner = unwrapRecord(data);
    const root = inner ?? flat;
    if (!root) return false;
    const token = pickToken(root) ?? (flat ? pickToken(flat) : null);
    if (!token) return false;
    const profileId = pickProfileId(root) ?? (flat ? pickProfileId(flat) : null);
    setCandidateSession(token, profileId ?? undefined);
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
    purpose: 'LOGIN',
  };
  if (params.firstName?.trim()) body.first_name = params.firstName.trim();
  if (params.lastName?.trim()) body.last_name = params.lastName.trim();

  const { data } = await authApi.post<unknown>('/auth/verify-otp', body);
  const flat = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const inner = unwrapRecord(data);
  const root = inner ?? flat;
  if (!root) throw new Error('Noto‘g‘ri javob');
  const token = pickToken(root) ?? (flat ? pickToken(flat) : null);
  if (!token) throw new Error('Token qaytmadi');
  const profileId = pickProfileId(root) ?? (flat ? pickProfileId(flat) : null);
  setCandidateSession(token, profileId ?? undefined);
}

export type CandidateProfileCreateBody = {
  region_id: number;
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
};

export type CandidateProfileUpdateBody = {
  region_id: number;
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

/** 2-qadam */
export async function candidateCreateProfile(body: CandidateProfileCreateBody): Promise<string | null> {
  const token = getCandidateToken();
  if (!token) throw new Error('Avval OTP bilan kiring');

  const { data } = await authApi.post<unknown>('/candidate/profile', body, {
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

  const { data } = await authApi.put<unknown>('/candidate/profile', body, {
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
  await authApi.post('/candidate/profile/languages', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
  country_code: string;
  priority: number;
}): Promise<void> {
  const token = getCandidateToken();
  if (!token) throw new Error('Token yo‘q');
  await authApi.post('/candidate/profile/target-countries', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function candidateMultipartUrl(path: string): string {
  const base = import.meta.env.DEV
    ? '/kasb-backend'
    : `${String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:7080').replace(/\/$/, '')}/api`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${p}`;
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

/** 4-qadam */
export async function candidateSubmitProfile(): Promise<void> {
  const token = getCandidateToken();
  const profileId = getCandidateProfileId();
  if (!token || !profileId) throw new Error('Profil ID yo‘q');
  await authApi.post(
    '/candidate/submit',
    { profile_id: profileId },
    { headers: { Authorization: `Bearer ${token}` } },
  );
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
