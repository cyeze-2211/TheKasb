import axios from 'axios';
import { handleAxios401 } from '../app/auth/handleUnauthorized';

/**
 * Nomzod / auth so‘rovlari.
 *
 * Dev: `baseURL` `/api` — brauzerda masalan `POST /api/candidate/profile` (Swagger bilan bir xil yo‘l).
 * Vite: `/api/auth`, `/api/candidate`, `/api/vacancies` alohida proxy; umumiy `/api` catch-all emas.
 */
function authApiBase(): string {
  if (import.meta.env.DEV) return '/api';
  const root = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7080';
  return `${root.replace(/\/$/, '')}/api`;
}

export const authApi = axios.create({
  baseURL: authApiBase(),
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

authApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      handleAxios401(error);
    }
    return Promise.reject(error);
  },
);
