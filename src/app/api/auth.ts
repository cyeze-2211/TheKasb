import axios from 'axios';
import { KASB_ACCESS_TOKEN_KEY, KASB_REFRESH_TOKEN_KEY } from '../../constants/kasbAuth';
import { saveAuthProfile } from '../../hooks/useAuth';
import { api } from './client';
import type { AuthUser } from '../auth/AuthContext';
import { saveLoginSession } from '../auth/loginSession';
import { fetchCurrentUserMe, getUserDisplayName, type SdgUserDto } from './users';

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

/** `/users/me` DTO → sidebar / kontekst uchun qisqa profil */
export function authUserFromSdgUser(u: SdgUserDto, fallbackPhone: string): AuthUser {
  const phone =
    (typeof u.phoneNumber === 'string' && u.phoneNumber.trim()) ||
    (typeof u.email === 'string' && u.email.trim()) ||
    fallbackPhone.trim();
  const dn = getUserDisplayName(u);
  const displayName =
    dn !== '—'
      ? dn
      : typeof u.email === 'string' && u.email
        ? u.email
        : 'Administrator';
  let roleLabel = 'ADMIN';
  if (typeof u.accountType === 'string' && u.accountType) roleLabel = u.accountType;
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

  const loginAlt = trimmed.startsWith('+') ? trimmed.slice(1) : null;

  const tryOnce = async (loginValue: string): Promise<LoginResult> => {
    const { data } = await api.post<unknown>('/sdg/uz/login', null, {
      params: { login: loginValue, password },
    });

    saveLoginSession(data);
    const { token, user } = parseLoginResponse(data, trimmed);
    if (token) {
      localStorage.setItem(KASB_ACCESS_TOKEN_KEY, token);
      let root = data as Record<string, unknown>;
      if (root.data && typeof root.data === 'object') root = root.data as Record<string, unknown>;
      const refresh = root.refreshToken ?? root.refresh_token;
      if (typeof refresh === 'string' && refresh) {
        localStorage.setItem(KASB_REFRESH_TOKEN_KEY, refresh);
      }
    }

    let mergedUser = user;
    try {
      const me = await fetchCurrentUserMe();
      if (me) mergedUser = authUserFromSdgUser(me, trimmed);
    } catch {
      /* login javobidagi profil yetarli */
    }
    saveAuthProfile(mergedUser);

    return { success: true, user: mergedUser };
  };

  const formatAxiosError = (err: unknown): LoginResult => {
    if (!axios.isAxiosError(err)) {
      return { success: false, message: 'Tarmoq xatosi. Qayta urinib ko‘ring.' };
    }
    const body = err.response?.data as Record<string, unknown> | string | undefined;
    let message = 'Kirish amalga oshmadi.';
    if (body && typeof body === 'object') {
      const m = body.message ?? body.error ?? body.detail ?? body.msg;
      if (typeof m === 'string') message = m;
      else if (Array.isArray(m) && typeof m[0] === 'string') message = m[0];
    } else if (typeof body === 'string' && body) message = body;
    if (err.response?.status === 401) message = message || 'Telefon yoki parol noto‘g‘ri.';
    return { success: false, message };
  };

  try {
    return await tryOnce(trimmed);
  } catch (err) {
    // Ba'zi backendlar `login` ni raqam sifatida parse qilib, `+` bo'lsa 500 berishi mumkin.
    if (axios.isAxiosError(err) && err.response?.status === 500 && loginAlt) {
      try {
        return await tryOnce(loginAlt);
      } catch (err2) {
        return formatAxiosError(err2);
      }
    }
    return formatAxiosError(err);
  }
}
