import axios from 'axios';
import { api } from './client';
import type { AuthUser } from '../auth/AuthContext';
import { saveLoginSession } from '../auth/loginSession';

function pickToken(payload: Record<string, unknown>): string | null {
  const t =
    payload.token ?? payload.access_token ?? payload.accessToken ?? payload.jwt;
  return typeof t === 'string' && t.length > 0 ? t : null;
}

function mapUserFromPayload(
  payload: Record<string, unknown>,
  fallbackPhone: string,
): AuthUser {
  const rawUser = payload.user ?? payload.profile ?? payload.data ?? payload.object;
  let phone = fallbackPhone;
  let displayName = 'Administrator';
  let roleLabel = 'ADMIN';

  if (rawUser && typeof rawUser === 'object') {
    const u = rawUser as Record<string, unknown>;
    const p = u.phone ?? u.mobile ?? u.phoneNumber ?? u.tel;
    if (typeof p === 'string' && p.length > 0) phone = p;
    if (typeof u.email === 'string' && !phone) phone = u.email;
    const fn = typeof u.firstName === 'string' ? u.firstName : '';
    const ln = typeof u.lastName === 'string' ? u.lastName : '';
    const full = `${fn} ${ln}`.trim();
    if (full) displayName = full;
    else if (typeof u.name === 'string') displayName = u.name;
    else if (typeof u.fullName === 'string') displayName = u.fullName;
    else if (typeof u.displayName === 'string') displayName = u.displayName;
    if (typeof u.accountType === 'string') roleLabel = u.accountType;
    else if (typeof u.role === 'string') roleLabel = u.role;
    else if (typeof u.roleLabel === 'string') roleLabel = u.roleLabel;
  }

  const topPhone = payload.phone ?? payload.mobile ?? payload.phoneNumber;
  if (typeof topPhone === 'string' && topPhone.length > 0) phone = topPhone;
  if (typeof payload.name === 'string') displayName = payload.name;
  if (typeof payload.role === 'string') roleLabel = payload.role;

  return { phone, displayName, roleLabel };
}

/** Server javobidan token va foydalanuvchini ajratish */
export function parseLoginResponse(data: unknown, fallbackPhone: string): {
  token: string | null;
  user: AuthUser;
} {
  if (!data || typeof data !== 'object') {
    return {
      token: null,
      user: {
        phone: fallbackPhone,
        displayName: 'Administrator',
        roleLabel: 'ADMIN',
      },
    };
  }

  let root = data as Record<string, unknown>;
  if (root.data && typeof root.data === 'object') {
    root = root.data as Record<string, unknown>;
  }

  const token = pickToken(root);
  const user = mapUserFromPayload(root, fallbackPhone);

  return { token, user };
}

export type LoginResult =
  | { success: true; user: AuthUser }
  | { success: false; message: string };

/**
 * `POST /sdg/uz/login` — server `login` va `password` ni **query** param sifatida kutadi.
 * `login` qiymati — telefon (bo‘shliqsiz), masalan `+998901234567`.
 */
export async function loginWithApi(phone: string, password: string): Promise<LoginResult> {
  const trimmed = phone.trim();
  if (!trimmed || !password) {
    return { success: false, message: 'Telefon va parol kiriting.' };
  }

  try {
    const { data } = await api.post<unknown>('/sdg/uz/login', null, {
      params: { login: trimmed, password },
    });

    saveLoginSession(data);
    const { user } = parseLoginResponse(data, trimmed);

    return { success: true, user };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as Record<string, unknown> | string | undefined;
      let message = 'Kirish amalga oshmadi.';
      if (body && typeof body === 'object') {
        const m =
          body.message ?? body.error ?? body.detail ?? body.msg;
        if (typeof m === 'string') message = m;
        else if (Array.isArray(m) && typeof m[0] === 'string') message = m[0];
      } else if (typeof body === 'string' && body) message = body;
      if (err.response?.status === 401) message = message || 'Telefon yoki parol noto‘g‘ri.';
      return { success: false, message };
    }
    return { success: false, message: 'Tarmoq xatosi. Qayta urinib ko‘ring.' };
  }
}
