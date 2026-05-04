import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LoginResult } from '../api/auth';
import { loginWithApi, parseLoginResponse } from '../api/auth';
import { clearKasbAuthStorage, readLoginSessionRaw } from './loginSession';

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
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const raw = readLoginSessionRaw();
  if (!raw) return null;
  const { user } = parseLoginResponse(raw, '');
  if (!user.phone) return null;
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const login = useCallback(async (phone: string, password: string): Promise<LoginResult> => {
    const result = await loginWithApi(phone, password);
    if (result.success) {
      setUser(result.user);
    } else {
      setUser(null);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    clearKasbAuthStorage();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
