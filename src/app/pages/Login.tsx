import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { btnPrimaryLg, ctlInputLg, pageKicker, panelEliteRaised } from '../components/pageChrome';

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin/dashboard';

  const [email, setEmail] = useState('admin@kasb.uz');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Kirish | The Kasb';
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = login(email, password);
    if (!ok) {
      setError('Email va kamida 4 belgili parol kiriting.');
      return;
    }
    navigate(from, { replace: true });
  };

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
            <label htmlFor="kasb-email" className="mb-1.5 block text-xs font-medium text-text-primary">
              Email
            </label>
            <input
              id="kasb-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={ctlInputLg}
            />
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
            />
          </div>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className={`${btnPrimaryLg} w-full`}>
            Kirish
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-text-muted">
          Demo: istalgan email va kamida 4 belgili parol
        </p>
      </div>
    </div>
  );
}
