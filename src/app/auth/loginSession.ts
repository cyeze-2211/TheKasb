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

/** Bearer uchun access token (login javobidagi `token`) */
export function getAccessTokenFromLoginSession(): string | null {
  const data = readLoginSessionRaw();
  if (!data || typeof data !== 'object') return null;
  const t = (data as Record<string, unknown>).token;
  return typeof t === 'string' && t.length > 0 ? t : null;
}

/** Chiqish va xatolikdan keyin: barcha auth kalitlari */
export function clearKasbAuthStorage(): void {
  sessionStorage.removeItem(KASB_LOGIN_SESSION_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_USER_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
}
