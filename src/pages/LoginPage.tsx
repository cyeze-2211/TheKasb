import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../app/auth/AuthContext';
import { sanitizeNationalDigits, toApiPhone } from '../app/lib/uzPhone';
import { FloatingStatCard } from '../components/FloatingStatCard';
import { isCompleteNationalNine, PhoneInput } from '../components/PhoneInput';

const LOGO_SRC = 'https://thekasb.uz/icones/new-main-logo.png';

function MiniSparkline() {
  const pts = [4, 12, 8, 16, 10];
  const w = 56;
  const h = 22;
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const path = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="mt-3 opacity-90" aria-hidden>
      <path d={path} fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MiniDonut() {
  return (
    <svg width={72} height={28} viewBox="0 0 72 28" className="mt-3" aria-hidden>
      <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(251,191,36,0.35)" strokeWidth="4" />
      <circle
        cx="14"
        cy="14"
        r="10"
        fill="none"
        stroke="#FBBF24"
        strokeWidth="4"
        strokeDasharray="40 63"
        transform="rotate(-90 14 14)"
      />
      <circle cx="40" cy="14" r="10" fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="4" />
      <circle
        cx="40"
        cy="14"
        r="10"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="4"
        strokeDasharray="25 63"
        transform="rotate(40 40 14)"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin/dashboard';

  const [nationalDigits, setNationalDigits] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Admin kirish | KASB';
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = toApiPhone(sanitizeNationalDigits(nationalDigits));
    if (!phone) {
      toast.error("Telefon raqamini to'liq kiriting.");
      return;
    }
    if (!password) {
      toast.error('Parolni kiriting.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(phone, password);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setSuccess(true);
      window.setTimeout(() => navigate(from, { replace: true }), 500);
    } finally {
      setLoading(false);
    }
  };

  const nationalOk = isCompleteNationalNine(sanitizeNationalDigits(nationalDigits));
  const canSubmit = nationalOk && password.length > 0 && !loading && !success;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden text-white"
      style={{ background: '#0D1117' }}
    >
      <div className="flex h-full w-full">
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative hidden h-full overflow-hidden md:block md:w-[40%] lg:w-[55%]"
          style={{
            background: 'linear-gradient(135deg, #050B18 0%, #0A1628 40%, #0D1F3C 100%)',
          }}
        >
          <div
            className="kasb-login-grid pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />
          <div
            className="kasb-login-glow pointer-events-none absolute h-[600px] w-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
              top: '50%',
              left: '30%',
            }}
          />

          <FloatingStatCard
            className="left-[8%] top-[14%] hidden w-[200px] md:block lg:left-[10%] lg:top-[12%]"
            rotateDeg={-8}
            animationDelay="0s"
          >
            <p className="font-mono text-3xl font-semibold tracking-tight text-white">10,847</p>
            <p className="mt-1 text-xs text-gray-400">Jami nomzodlar</p>
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-400">
              <span aria-hidden>↗</span>
              <span>+234 bu hafta</span>
            </p>
            <MiniSparkline />
          </FloatingStatCard>

          <FloatingStatCard
            className="left-1/2 top-[38%] hidden w-[220px] -translate-x-1/2 lg:block"
            rotateDeg={4}
            animationDelay="2s"
          >
            <p className="font-mono text-3xl font-semibold tracking-tight text-amber-400">103</p>
            <p className="mt-1 text-xs text-gray-400">Faol vakansiyalar</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300">
              🔴 18 ta shoshilinch
            </span>
            <MiniDonut />
          </FloatingStatCard>

          <FloatingStatCard
            className="bottom-[22%] right-[10%] hidden w-[190px] lg:block"
            rotateDeg={-3}
            animationDelay="4s"
          >
            <p className="font-mono text-3xl font-semibold tracking-tight text-emerald-400">4,552</p>
            <p className="mt-1 text-xs text-gray-400">Tasdiqlangan profillar</p>
            <p className="mt-3 text-xs font-medium text-emerald-400">↑ 12% o&apos;sish</p>
          </FloatingStatCard>

          <div className="absolute bottom-12 left-12 z-10">
            <img src={LOGO_SRC} alt="KASB" height={36} width={120} className="h-9 w-auto object-contain" />
            <p className="mt-4 text-[13px] text-gray-400">Mehnat migratsiyasi platformasi</p>
            <p className="mt-1 text-[11px] text-gray-600">© 2026 KASB. Barcha huquqlar himoyalangan.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex h-full w-full flex-col items-center justify-center border-l border-[#1F2937] md:w-[60%] lg:w-[45%]"
          style={{ background: '#0D1117' }}
        >
          <div className="w-full max-w-[380px] px-6">
            <div className="mb-8 flex justify-center md:hidden">
              <img src={LOGO_SRC} alt="KASB" height={48} width={160} className="h-12 w-auto object-contain" />
            </div>

            <h1 className="text-center text-[26px] font-bold tracking-[-0.02em] text-white">
              Admin Panelga Kirish
            </h1>
            <p className="mb-10 mt-2 text-center text-sm text-[#6B7280]">
              Telefon va parolingiz bilan tizimga kiring
            </p>

            <motion.form
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <PhoneInput
                id="kasb-admin-phone"
                nationalDigits={nationalDigits}
                onNationalDigitsChange={setNationalDigits}
                disabled={loading || success}
              />
              <p className="mt-3 text-xs text-gray-500">Masalan: 90 123 45 67</p>

              <label htmlFor="kasb-admin-password" className="sr-only">
                Parol
              </label>
              <input
                id="kasb-admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success}
                placeholder="Parol"
                className="mt-5 h-[52px] w-full rounded-[10px] border border-[#2D3748] bg-[#161D2E] px-4 font-mono text-base text-white outline-none transition-all duration-200 placeholder:text-gray-500 focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
              />

              <motion.button
                type="submit"
                disabled={!canSubmit}
                className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold text-white transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: success ? '#059669' : '#2563EB',
                }}
                whileHover={
                  canSubmit ? { y: -1, boxShadow: '0 12px 28px rgba(37,99,235,0.35)' } : {}
                }
                whileTap={canSubmit ? { y: 0 } : {}}
              >
                {success ? (
                  <>
                    <motion.svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <motion.path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                      />
                    </motion.svg>
                    Muvaffaqiyatli!
                  </>
                ) : loading ? (
                  <span
                    className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                ) : (
                  'Kirish'
                )}
              </motion.button>
            </motion.form>

            <div className="mt-8 border-t border-[#1F2937]" />
            <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-600">
              Faqat ADMIN, SUPER_ADMIN va AGENT rollari kira oladi
            </p>
            <p className="mt-2 text-center text-[11px] text-gray-600">
              🔒 256-bit SSL shifrlash bilan himoyalangan
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
