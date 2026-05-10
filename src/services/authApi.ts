import axios from 'axios';
import { API_BASE_URL } from '../app/api/client';
import { handleAxios401 } from '../app/auth/handleUnauthorized';

/**
 * Nomzod / auth so‘rovlari — asosiy `API_BASE_URL` bilan bir xil (`/api` prefiksi).
 */
function authApiBase(): string {
  return API_BASE_URL;
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
