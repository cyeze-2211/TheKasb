import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { btnPrimaryLg, ctlInputLg, pageKicker, panelEliteRaised } from '../components/pageChrome';
import {
  formatNationalDisplay,
  sanitizeNationalDigits,
  toApiPhone,
  UZ_PHONE_PREFIX,
} from '../lib/uzPhone';

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin/dashboard';

  /** Faqat milliy 9 raqam (998siz) */
  const [nationalDigits, setNationalDigits] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Kirish | The Kasb';
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const onNationalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNationalDigits(sanitizeNationalDigits(e.target.value));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const apiPhone = toApiPhone(nationalDigits);
    if (!apiPhone) {
      setError('Telefon raqamini to‘liq kiriting (9 raqam, +998 dan keyin).');
      return;
    }
    setLoading(true);
    try {
      const result = await login(apiPhone, password);
      if (!result.success) {
        setError(result.message);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const nationalDisplay = formatNationalDisplay(nationalDigits);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-slate-50/80 to-primary/[0.07] p-4">
      <div className={`w-full max-w-[420px] p-8 backdrop-blur-md ${panelEliteRaised}`}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-dark text-lg font-bold text-white shadow-lg shadow-primary/35 ring-2 ring-primary/20 transition-transform duration-300 hover:scale-[1.02]">
            K
          </div>
          <p className={`${pageKicker} mb-1 opacity-90`}>The Kasb</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-text-primary">
            Admin boshqaruvi
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Davom etish uchun tizimga kiring
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="kasb-phone" className="mb-1.5 block text-xs font-medium text-text-primary">
              Telefon
            </label>
            <div
              className={`${ctlInputLg} flex items-center gap-0.5 !py-0`}
            >
              <span
                className="shrink-0 select-none text-sm font-medium tracking-tight text-text-primary"
                aria-hidden
              >
                {UZ_PHONE_PREFIX}
              </span>
              <input
                id="kasb-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={nationalDisplay}
                onChange={onNationalChange}
                placeholder="90 123 45 67"
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted/60"
                disabled={loading}
                aria-describedby="kasb-phone-hint"
              />
            </div>
          </div>
          <div>
            <label htmlFor="kasb-password" className="mb-1.5 block text-xs font-medium text-text-primary">
              Parol
            </label>
            <input
              id="kasb-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={ctlInputLg}
              disabled={loading}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className={`${btnPrimaryLg} w-full`} disabled={loading}>
            {loading ? 'Kirilmoqda…' : 'Kirish'}
          </button>
        </form>
     
      </div>
    </div>
  );
}
