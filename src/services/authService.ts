import axios from 'axios';
import { authApi } from './authApi';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
};

function unwrapData(root: unknown): Record<string, unknown> | null {
  if (!root || typeof root !== 'object') return null;
  const o = root as Record<string, unknown>;
  if (o.data && typeof o.data === 'object') return o.data as Record<string, unknown>;
  return o;
}

function mapAuthResponse(raw: unknown): AuthResponse {
  const d = unwrapData(raw);
  if (!d) throw new Error('Noto‘g‘ri javob formati');
  const accessToken = d.accessToken;
  const refreshToken = d.refreshToken;
  const accessExpiresAt = d.accessExpiresAt;
  if (typeof accessToken !== 'string' || !accessToken) throw new Error('Token yo‘q');
  if (typeof refreshToken !== 'string' || !refreshToken) throw new Error('Refresh token yo‘q');
  return {
    accessToken,
    refreshToken,
    accessExpiresAt: typeof accessExpiresAt === 'string' ? accessExpiresAt : '',
  };
}

export async function sendOtp(phoneNumber: string): Promise<void> {
  await authApi.post('/auth/send-otp', { phoneNumber, purpose: 'LOGIN' });
}

export async function verifyOtp(phoneNumber: string, code: string): Promise<AuthResponse> {
  const { data } = await authApi.post<unknown>('/auth/verify-otp', {
    phoneNumber,
    code,
    purpose: 'LOGIN',
  });
  return mapAuthResponse(data);
}

function sharedMessages(err: unknown): string | null {
  if (!axios.isAxiosError(err)) return null;
  const status = err.response?.status;
  if (status === 429) return "Juda ko'p urinish. 10 daqiqadan so'ng urinib ko'ring.";
  if (status === 403) return "Akkaunt o'chirilgan";
  if (!err.response) return "Server bilan aloqa yo'q";
  const body = err.response?.data;
  if (body && typeof body === 'object') {
    const m = (body as Record<string, unknown>).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  return null;
}

export function toastMessageForSendOtpError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.status === 400) {
    return "Telefon raqam formati noto'g'ri";
  }
  return sharedMessages(err) ?? "Server bilan aloqa yo'q";
}

export function toastMessageForVerifyOtpError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.status === 400) {
    const body = err.response.data;
    if (body && typeof body === 'object') {
      const m = (body as Record<string, unknown>).message;
      if (typeof m === 'string' && m.trim()) return m;
    }
    return 'Kod noto‘g‘ri yoki muddati o‘tgan.';
  }
  return sharedMessages(err) ?? "Server bilan aloqa yo'q";
}
