import { clearKasbAuthStorage } from '../app/auth/loginSession';
import {
  KASB_ACCESS_TOKEN_KEY,
  KASB_AUTH_PROFILE_KEY,
  KASB_REFRESH_TOKEN_KEY,
} from '../constants/kasbAuth';

export { KASB_ACCESS_TOKEN_KEY, KASB_REFRESH_TOKEN_KEY, KASB_AUTH_PROFILE_KEY };

export type KasbStoredProfile = {
  phone: string;
  displayName: string;
  roleLabel: string;
};

export function saveAuthTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(KASB_ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(KASB_REFRESH_TOKEN_KEY, refreshToken);
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(KASB_ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(KASB_REFRESH_TOKEN_KEY);
}

export function readStoredProfile(): KasbStoredProfile | null {
  try {
    const raw = localStorage.getItem(KASB_AUTH_PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as KasbStoredProfile;
    if (typeof p.phone !== 'string') return null;
    return p;
  } catch {
    return null;
  }
}

export function saveAuthProfile(profile: KasbStoredProfile): void {
  localStorage.setItem(KASB_AUTH_PROFILE_KEY, JSON.stringify(profile));
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredAccessToken());
}

/** Tokenlar va OTP profilini tozalaydi; legacy session ham */
export function logout(): void {
  localStorage.removeItem(KASB_ACCESS_TOKEN_KEY);
  localStorage.removeItem(KASB_REFRESH_TOKEN_KEY);
  localStorage.removeItem(KASB_AUTH_PROFILE_KEY);
  clearKasbAuthStorage();
}
