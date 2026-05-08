import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearCandidateSession } from '../candidate/candidateSession';
import { logout } from '../../hooks/useAuth';

let redirectScheduled = false;

function requestUrl(cfg: InternalAxiosRequestConfig | undefined): string {
  if (!cfg) return '';
  const base = typeof cfg.baseURL === 'string' ? cfg.baseURL.replace(/\/$/, '') : '';
  const path = typeof cfg.url === 'string' ? (cfg.url.startsWith('/') ? cfg.url : `/${cfg.url}`) : '';
  return `${base}${path}`.replace(/\\/g, '/');
}

function getAuthorizationHeader(cfg: InternalAxiosRequestConfig | undefined): string | undefined {
  if (!cfg?.headers) return undefined;
  const h = cfg.headers;
  if (typeof (h as { get?: (k: string) => unknown }).get === 'function') {
    const v = (h as { get: (k: string) => unknown }).get('Authorization');
    return typeof v === 'string' ? v : undefined;
  }
  const rec = h as Record<string, unknown>;
  const v = rec.Authorization ?? rec.authorization;
  return typeof v === 'string' ? v : undefined;
}

/** Parol / OTP qadamlari — 401 bu yerda «noto‘g‘ri kirituv», sessiya tugashi emas */
function isAuthHandshakeUrl(url: string): boolean {
  return (
    url.includes('/sdg/uz/login') ||
    url.includes('/auth/send-otp') ||
    url.includes('/auth/verify-otp')
  );
}

/**
 * 401: so‘rovda Bearer bo‘lsa (JWT yuborilgan) — sessiya yaroqsiz deb hisoblanadi.
 * Admin + nomzod saqlangan kalitlarini tozalaydi va `/login` ga o‘tkazadi.
 */
export function handleAxios401(error: AxiosError): void {
  const cfg = error.config as InternalAxiosRequestConfig | undefined;
  const url = requestUrl(cfg);
  if (isAuthHandshakeUrl(url)) return;

  const auth = getAuthorizationHeader(cfg);
  if (!auth || !/^Bearer\s+\S+/i.test(auth.trim())) return;

  if (redirectScheduled) return;
  redirectScheduled = true;

  try {
    logout();
    clearCandidateSession();
  } catch {
    /* ignore */
  }

  try {
    const path = window.location.pathname;
    if (path !== '/login') {
      window.location.replace('/login');
    } else {
      redirectScheduled = false;
    }
  } catch {
    redirectScheduled = false;
  }
}
