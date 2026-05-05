import axios from 'axios';

/** Dev: Vite `/kasb-backend` → `http://localhost:7080/api` */
function authApiBase(): string {
  if (import.meta.env.DEV) return '/kasb-backend';
  const root = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7080';
  return `${root.replace(/\/$/, '')}/api`;
}

export const authApi = axios.create({
  baseURL: authApiBase(),
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});
