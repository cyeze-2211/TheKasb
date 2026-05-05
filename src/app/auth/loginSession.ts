import { KASB_ACCESS_TOKEN_KEY } from '../../constants/kasbAuth';

/** Login API dan kelgan to‘liq JSON — o‘zgartirilmasin */
export const KASB_LOGIN_SESSION_KEY = 'kasb_admin_login_session';

const LEGACY_SESSION_USER_KEY = 'kasb_admin_session';
const LEGACY_TOKEN_KEY = 'kasb_admin_token';

export function saveLoginSession(payload: unknown): void {
  sessionStorage.setItem(KASB_LOGIN_SESSION_KEY, JSON.stringify(payload));
}

export function readLoginSessionRaw(): unknown | null {
  try {
    const raw = sessionStorage.getItem(KASB_LOGIN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Bearer uchun access token (OTP `accessToken` yoki legacy `token`) */
export function getAccessTokenFromLoginSession(): string | null {
  const fromOtp = localStorage.getItem(KASB_ACCESS_TOKEN_KEY);
  if (fromOtp) return fromOtp;
  const data = readLoginSessionRaw();
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  let t: unknown = o.token ?? o.accessToken ?? o.access_token;
  if (
    (typeof t !== 'string' || !t) &&
    o.data &&
    typeof o.data === 'object'
  ) {
    const d = o.data as Record<string, unknown>;
    t = d.token ?? d.accessToken ?? d.access_token;
  }
  return typeof t === 'string' && t.length > 0 ? t : null;
}

/** Chiqish va xatolikdan keyin: barcha auth kalitlari (OTP tokenlarsiz — ular `hooks/useAuth` logout da) */
export function clearKasbAuthStorage(): void {
  sessionStorage.removeItem(KASB_LOGIN_SESSION_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_USER_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
}
