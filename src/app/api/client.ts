import axios from 'axios';
import { getAccessTokenFromLoginSession } from '../auth/loginSession';

const DEFAULT_API_PUBLIC = 'http://localhost:7080';

/**
 * Dev: Vite `/api` proxy orqali so‘rov (CORS yo‘q).
 * Prod: `VITE_API_BASE_URL` yoki default — serverda CORS ochilgan bo‘lishi kerak.
 */
export const API_BASE_URL =
  import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_PUBLIC);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessTokenFromLoginSession();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
