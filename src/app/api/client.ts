import axios, { type InternalAxiosRequestConfig } from 'axios';
import { handleAxios401 } from '../auth/handleUnauthorized';
import { getAccessTokenFromLoginSession } from '../auth/loginSession';

/**
 * Netlify’da `VITE_API_BASE_URL` berilmasa ishlatiladi.
 * Faqat host (path yo‘q): `https://api.the-kasb.uz`
 */
const DEFAULT_API_ORIGIN = 'https://api.the-kasb.uz';

function trimApiBase(raw: string | undefined): string {
  if (!raw || !String(raw).trim()) return '';
  return String(raw).replace(/\/+$/, '');
}

const envApiRaw = trimApiBase(import.meta.env.VITE_API_BASE_URL);

/**
 * Backend ildizi — oxirida `/api` bo‘lmasin (keyin qo‘shamiz).
 * Env `https://.../api` ko‘rinishida bo‘lsa, oxiridagi `/api` olib tashlanadi.
 */
function apiPublicOrigin(): string {
  let o = envApiRaw || DEFAULT_API_ORIGIN;
  o = o.replace(/\/api\/?$/, '');
  return o || DEFAULT_API_ORIGIN;
}

/**
 * Dev: Vite proxy — `http://localhost:5173/api/...`.
 * Prod (Netlify): doim mutlaq URL `https://…/api` — keyin `/admin/...`, `/v1/...` Swagger bilan mos.
 *
 * Eslatma: prod’da faqat `https://domen` ( `/api` siz ) berilsa ham, kod avtomatik `/api` qo‘shadi.
 */
export const API_BASE_URL = import.meta.env.DEV ? '/api' : `${apiPublicOrigin()}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function stripContentTypeForMultipart(config: InternalAxiosRequestConfig) {
  if (!(config.data instanceof FormData)) return;
  const h = config.headers;
  if (!h) return;
  if (typeof h.delete === 'function') {
    h.delete('Content-Type');
    h.delete('content-type');
  } else {
    delete (h as Record<string, unknown>)['Content-Type'];
    delete (h as Record<string, unknown>)['content-type'];
  }
}

api.interceptors.request.use((config) => {
  stripContentTypeForMultipart(config);
  const token = getAccessTokenFromLoginSession();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      handleAxios401(error);
    }
    return Promise.reject(error);
  },
);
