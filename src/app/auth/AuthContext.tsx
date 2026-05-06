import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LoginResult } from '../api/auth';
import { authUserFromSdgUser, loginWithApi, parseLoginResponse } from '../api/auth';
import { fetchCurrentUserMe } from '../api/users';
import { getAccessTokenFromLoginSession, readLoginSessionRaw } from './loginSession';
import type { AuthResponse } from '../../services/authService';
import {
  logout as clearKasbAuth,
  readStoredProfile,
  saveAuthProfile,
  saveAuthTokens,
} from '../../hooks/useAuth';

export type AuthUser = {
  phone: string;
  displayName: string;
  roleLabel: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** `phone` — API formatida, masalan `+998901234567` */
  login: (phone: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  establishOtpSession: (auth: AuthResponse, phone: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const token = getAccessTokenFromLoginSession();
  if (!token) return null;

  const profile = readStoredProfile();
  if (profile?.phone) {
    return {
      phone: profile.phone,
      displayName: profile.displayName,
      roleLabel: profile.roleLabel,
    };
  }

  const raw = readLoginSessionRaw();
  if (raw) {
    const { user } = parseLoginResponse(raw, '');
    if (user.phone) return user;
  }

  return {
    phone: '',
    displayName: 'Administrator',
    roleLabel: 'ADMIN',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  useEffect(() => {
    if (!getAccessTokenFromLoginSession()) return;
    let cancelled = false;
    void (async () => {
      try {
        const me = await fetchCurrentUserMe();
        if (cancelled || !me) return;
        const stored = readStoredProfile();
        let fallback = stored?.phone ?? '';
        if (!fallback) {
          const raw = readLoginSessionRaw();
          if (raw) {
            const { user: u0 } = parseLoginResponse(raw, '');
            fallback = u0.phone;
          }
        }
        const u = authUserFromSdgUser(me, fallback);
        saveAuthProfile(u);
        setUser(u);
      } catch {
        /* saqlangan profil / login javobi saqlanadi */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (phone: string, password: string): Promise<LoginResult> => {
    const result = await loginWithApi(phone, password);
    if (result.success) {
      setUser(result.user);
    } else {
      setUser(null);
    }
    return result;
  }, []);

  const establishOtpSession = useCallback((auth: AuthResponse, phone: string) => {
    saveAuthTokens(auth.accessToken, auth.refreshToken);
    const profile: AuthUser = {
      phone,
      displayName: 'Administrator',
      roleLabel: 'ADMIN',
    };
    saveAuthProfile(profile);
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    clearKasbAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(getAccessTokenFromLoginSession()),
      login,
      logout,
      establishOtpSession,
    }),
    [user, login, logout, establishOtpSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
