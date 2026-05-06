import axios from 'axios';

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
