import axios, { type InternalAxiosRequestConfig } from 'axios';
import { handleAxios401 } from '../auth/handleUnauthorized';
import { getAccessTokenFromLoginSession } from '../auth/loginSession';

const DEFAULT_API_PUBLIC = 'http://localhost:7080';

function trimApiBase(raw: string | undefined): string {
  if (!raw || !String(raw).trim()) return '';
  return String(raw).replace(/\/+$/, '');
}

const envApiBase = trimApiBase(import.meta.env.VITE_API_BASE_URL);

/**
 * Dev: doim `/api` — Vite proxy server orqali backendga (CORS yo‘q).
 * Proxy maqsadi: `.env.local` dagi `VITE_API_BASE_URL` (masalan ngrok).
 * Prod: `VITE_API_BASE_URL` yoki `DEFAULT_API_PUBLIC`.
 */
export const API_BASE_URL = import.meta.env.DEV ? '/api' : envApiBase || DEFAULT_API_PUBLIC;

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
