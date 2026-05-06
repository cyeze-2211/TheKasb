import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Bookmark,
  ChevronRight,
  FileText,
  Home,
  Loader2,
  MessageCircle,
  Search,
  User,
} from 'lucide-react';
import {
  formatNationalDisplay,
  sanitizeNationalDigits,
  toApiPhone,
  UZ_PHONE_PREFIX,
} from '../app/lib/uzPhone';
import {
  candidateAddLanguage,
  candidateAddTargetCountry,
  candidateCreateProfile,
  candidateFetchProfileMe,
  candidateFetchVacancies,
  candidatePortalError,
  candidateSendOtp,
  candidateSubmitProfile,
  candidateTrySessionFromTelegramChatId,
  candidateVerifyOtp,
  type PublicVacancyRow,
} from '../app/api/candidatePortal';
import { getCandidateToken } from '../app/candidate/candidateSession';
import {
  initTelegramMiniApp,
  isTelegramMiniApp,
  readTelegramMiniAppChatId,
} from '../app/lib/telegramWebApp';

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const C = {
  blue: '#1B4F8A',
  blueGlow: '#0a1929',
  blueSelected: '#0D2240',
  blueL: '#7FC3FF',
  gold: '#D4A843',
  goldBg: '#1a1400',
  bg: '#070E1A',
  card: '#0D1B2E',
  card2: '#122035',
  border: '#1A2E4A',
  text: '#F0F0F0',
  muted: '#7A9BB5',
  green: '#27AE60',
  red: '#E74C3C',
} as const;

const LOGO_URL = 'https://thekasb.uz/icones/new-main-logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type View = 'onboarding' | 'home';

type ProfessionId = 'construction' | 'electric' | 'driver' | 'cook' | 'nurse' | 'other';

interface FormState {
  phoneNational: string;
  otp: string[];
  profession: ProfessionId | null;
  customProfessionName: string;
  countries: string[];
  availability: 'now' | 'soon' | 'later' | null;
  languages: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFESSIONS: Array<{ id: ProfessionId; icon: string; name: string; desc: string }> = [
  { id: 'construction', icon: '🔧', name: 'Qurilishchi', desc: 'Usta, temir, beton ishlari' },
  { id: 'electric', icon: '⚡', name: 'Elektrik', desc: 'Elektr montaj ishlari' },
  { id: 'driver', icon: '🚗', name: 'Haydovchi', desc: 'Yuk, avtobus, taksi' },
  { id: 'cook', icon: '🍳', name: 'Oshpaz', desc: 'Restoran, mehmonxona' },
  { id: 'nurse', icon: '🏥', name: 'Hamshira / Parvarish', desc: 'Tibbiy, keksa parvarish' },
];

const COUNTRIES = [
  { id: 'de', flag: '🇩🇪', name: 'Germaniya', salary: '1800 – 3500 € · B1 til talab', code: 'DE' },
  { id: 'pl', flag: '🇵🇱', name: 'Polsha', salary: '900 – 2200 € · Til shart emas', code: 'PL' },
  { id: 'il', flag: '🇮🇱', name: 'Isroil', salary: '2000 – 4000 € · Yaxshi imkoniyat', code: 'IL' },
  { id: 'kr', flag: '🇰🇷', name: 'Koreya', salary: '1500 – 3000 € · EPS dasturi', code: 'KR' },
  { id: 'cz', flag: '🇨🇿', name: 'Chexiya', salary: '1200 – 2500 € · Viza oson', code: 'CZ' },
];

const AVAILABILITY = [
  { id: 'now', icon: '🟢', name: 'Hozir tayyorman', desc: 'Hujjatlarim tayyor' },
  { id: 'soon', icon: '📅', name: '1–3 oy ichida', desc: 'Hujjatlar tayyorlanmoqda' },
  { id: 'later', icon: '🔮', name: 'Keyinroq', desc: 'Hali rejalashtirmoqdaman' },
];

const LANGUAGES = ['Rus tili', 'Ingliz tili', 'Nemis tili', 'Koreys tili', 'Polyak tili', 'Til bilmayman'];

const TOTAL_SCREENS = 7;
/** Backend SMS kodi uzunligi */
const OTP_SLOT_COUNT = 5;
/** Qayta yuborishgacha kutish (sekund) */
const SMS_RESEND_COUNTDOWN_SEC = 120;

type SmsInlineNotice = { variant: 'error' | 'success'; text: string } | null;

function emptyOtpSlots(): string[] {
  return Array.from({ length: OTP_SLOT_COUNT }, () => '');
}

function InlineNoticeBar({ notice }: { notice: SmsInlineNotice }) {
  if (!notice) return null;
  const accent = notice.variant === 'error' ? C.red : C.green;
  return (
    <p
      role={notice.variant === 'error' ? 'alert' : 'status'}
      className="mb-3 rounded-xl px-3 py-2.5 text-center text-[13px] leading-snug"
      style={{
        backgroundColor: `${accent}18`,
        border: `1px solid ${accent}44`,
        color: C.text,
      }}
    >
      {notice.text}
    </p>
  );
}

const PROGRESS_BY_SCREEN: Record<number, number> = {
  2: 16,
  3: 32,
  4: 50,
  5: 66,
  6: 83,
  7: 100,
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function PulseDot({ color = C.blue }: { color?: string }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
      <span className="relative inline-flex h-full w-full rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

function BlueDot() {
  return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: C.blue }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: C.muted,
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </p>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="h-14 w-full rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:active:scale-100"
      style={{
        fontSize: 16,
        letterSpacing: '-0.2px',
        backgroundColor: disabled || loading ? C.blueGlow : C.blue,
        color: disabled || loading ? `${C.blue}44` : '#fff',
        border: disabled || loading ? `1px solid ${C.border}` : 'none',
        fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
      }}
    >
      {loading ? 'Yuklanmoqda…' : children}
    </button>
  );
}

function OptionCard({
  selected,
  onClick,
  left,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  left: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left transition-all active:scale-[0.98]"
      style={{
        border: `1.5px solid ${selected ? C.blue : C.border}`,
        backgroundColor: selected ? C.blueSelected : C.card,
      }}
    >
      {left}
      <div className="min-w-0 flex-1">
        <p className="font-medium" style={{ fontSize: 14, color: C.text }}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{desc}</p>
      </div>
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors"
        style={{
          border: `2px solid ${selected ? C.blue : C.border}`,
          backgroundColor: selected ? C.blue : 'transparent',
        }}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
      </div>
    </button>
  );
}

function TopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex items-center gap-2 px-5 pb-2 pt-[52px]">
      <img
        src={LOGO_URL}
        alt="THE KASB"
        width={32}
        height={32}
        style={{ objectFit: 'contain', width: 32, height: 32, borderRadius: 8 }}
      />
      <span
        className="font-bold tracking-tight"
        style={{ fontSize: 15, color: C.text, fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}
      >
        THE KASB
      </span>
      {onBack && (
        <button
          onClick={onBack}
          className="ml-auto text-xs transition-opacity active:opacity-60"
          style={{ color: C.muted, letterSpacing: '0.02em' }}
        >
          ← Orqaga
        </button>
      )}
    </div>
  );
}

function stepLabel(screen: Screen): string {
  const labels: Record<number, string> = {
    2: 'Telefon raqam',
    3: 'SMS Tasdiqlash',
    4: 'Kasb tanlash',
    5: 'Davlat tanlash',
    6: 'Tayyorlik & Til',
    7: 'Natijalar',
  };
  return labels[screen] ?? '';
}

function ProgressBar({ screen }: { screen: Screen }) {
  const pct = PROGRESS_BY_SCREEN[screen] ?? 0;
  return (
    <div className="px-5 pb-5">
      <div className="h-[3px] w-full rounded-full" style={{ backgroundColor: C.border }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: C.blue }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-2 text-[11px] tracking-[0.5px]" style={{ color: C.muted }}>
        {screen - 1} / 6 — {stepLabel(screen)}
      </p>
    </div>
  );
}

function toCandidateLanguageEnum(label: string): string | null {
  const m: Record<string, string> = {
    'Rus tili': 'RUSSIAN',
    'Ingliz tili': 'ENGLISH',
    'Nemis tili': 'GERMAN',
    'Koreys tili': 'KOREAN',
    'Polyak tili': 'POLISH',
  };
  if (label === 'Til bilmayman') return null;
  return m[label] ?? null;
}

function phoneE164FromNationalDigits(nationalDigits: string): string | null {
  const cleaned = sanitizeNationalDigits(nationalDigits);
  return toApiPhone(cleaned);
}

// ─── Screens ─────────────────────────────────────────────────────────────────

function Screen1({ onNext, lookupBusy = false }: { onNext: () => void; lookupBusy?: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-[52px]">
        <div
          className="mb-3 flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: C.blueSelected,
            border: `1px solid ${C.blue}`,
          }}
        >
          <img src={LOGO_URL} alt="THE KASB logo" style={{ objectFit: 'contain', width: 72, height: 72 }} />
        </div>
        <p className="mb-10 font-semibold" style={{ fontSize: 11, color: C.blue, letterSpacing: '1px' }}>
          THE KASB
        </p>

        <h1
          className="mb-3 w-full text-center"
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.15,
            letterSpacing: '-0.8px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Xorijda yuqori maoshli ish toping
        </h1>
        <p className="mb-8 text-center" style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
          Atigi 1 daqiqada ma&apos;lumotlaringizni kiriting — biz eng mos ishni topamiz
        </p>

        <div className="mb-8 flex w-full flex-col gap-[10px]">
          {[
            'Germaniya, Koreya, Polsha va boshqa mamlakatlar',
            '1800 – 4000 € oylik maosh',
            'Rasmiy shartnoma va viza yordami',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <BlueDot />
              <span style={{ fontSize: 13, color: C.muted }}>{item}</span>
            </div>
          ))}
        </div>

        <div
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: C.blueGlow, border: `1px solid ${C.blue}22` }}
        >
          <PulseDot />
          <p style={{ fontSize: 13, color: C.muted }}>
            <span className="font-bold" style={{ color: C.text }}>
              127 ta
            </span>{' '}
            nomzod bugun ariza topshirdi
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-5 pb-9 pt-6">
        {lookupBusy ? (
          <p className="mb-1 text-center text-[13px] leading-snug" style={{ color: C.muted }}>
            Mavjud akkaunt tekshirilmoqda…
          </p>
        ) : null}
        <PrimaryButton onClick={onNext} disabled={lookupBusy} loading={lookupBusy}>
          Boshlash — 1 daqiqa
        </PrimaryButton>
        <p className="text-center" style={{ fontSize: 13, color: C.muted }}>
          Allaqachon akkauntim bor →
        </p>
      </div>
    </div>
  );
}

function Screen2({
  onNext,
  onBack,
  form,
  setForm,
  busy,
  notice,
}: {
  onNext: () => void;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy: boolean;
  notice: SmsInlineNotice;
}) {
  const isValid = sanitizeNationalDigits(form.phoneNational).length >= 9;
  return (
    <div className="flex h-full flex-col">
      <TopBar onBack={onBack} />
      <ProgressBar screen={2} />
      <div className="flex flex-1 flex-col overflow-y-auto px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Telefon raqamingizni kiriting
        </h2>
        <p className="mb-6" style={{ fontSize: 14, color: C.muted }}>
          SMS orqali tasdiqlash kodi yuboramiz
        </p>
        <div className="mb-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
          <div
            className="flex shrink-0 items-center justify-center rounded-[14px] px-3 sm:px-4"
            style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.card, minHeight: 56 }}
          >
            <span className="font-semibold tabular-nums" style={{ fontSize: 15, color: C.text }}>
              {UZ_PHONE_PREFIX}
            </span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="90 123 45 67"
            value={formatNationalDisplay(form.phoneNational)}
            onChange={(e) =>
              setForm((f) => ({ ...f, phoneNational: sanitizeNationalDigits(e.target.value) }))
            }
            className="min-h-[56px] min-w-0 flex-1 rounded-[14px] px-3 outline-none transition-colors sm:px-4"
            style={{
              border: `1.5px solid ${C.border}`,
              backgroundColor: C.card,
              color: C.text,
              fontSize: 15,
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          />
        </div>
        <p className="mb-6" style={{ fontSize: 12, color: C.muted }}>
          Ma&apos;lumotlaringizni hech kimga bermaymiz
        </p>
        <div className="rounded-[14px] p-4" style={{ backgroundColor: C.card }}>
          <p className="mb-3" style={{ fontSize: 12, color: C.muted }}>
            Qo&apos;llab-quvvatlanadigan operatorlar
          </p>
          <div className="flex flex-wrap gap-2">
            {['Ucell', 'Beeline', 'Mobiuz', 'UMS'].map((op) => (
              <span
                key={op}
                className="rounded-md px-2.5 py-1"
                style={{ backgroundColor: C.card2, fontSize: 12, color: C.text }}
              >
                {op}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 pb-9 pt-4">
        <InlineNoticeBar notice={notice} />
        <PrimaryButton onClick={onNext} disabled={!isValid} loading={busy}>
          SMS kod yuborish
        </PrimaryButton>
      </div>
    </div>
  );
}

function Screen3({
  onNext,
  onBack,
  form,
  setForm,
  busy,
  notice,
}: {
  onNext: () => void;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy: boolean;
  notice: SmsInlineNotice;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(SMS_RESEND_COUNTDOWN_SEC);
  useEffect(() => {
    if (timer <= 0) return;
    const t = window.setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [timer]);

  const handleOtp = (val: string, idx: number) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length > 1) {
      const next = [...form.otp];
      for (let j = 0; j < raw.length && idx + j < next.length; j++) {
        next[idx + j] = raw[j] ?? '';
      }
      setForm((f) => ({ ...f, otp: next }));
      const focusIdx = Math.min(idx + raw.length, next.length - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    const digit = raw.slice(-1);
    const next = [...form.otp];
    next[idx] = digit;
    setForm((f) => ({ ...f, otp: next }));
    if (digit && idx < next.length - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !form.otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const allFilled = form.otp.every((d) => d !== '');
  const timerStr = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  return (
    <div className="flex h-full flex-col">
      <TopBar onBack={onBack} />
      <ProgressBar screen={3} />
      <div className="flex flex-1 flex-col px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          SMS kodni kiriting
        </h2>
        <p
          className="mb-6 max-w-full break-words sm:mb-8"
          style={{ fontSize: 14, color: C.muted, lineHeight: 1.45 }}
        >
          <span className="inline sm:inline">{UZ_PHONE_PREFIX} </span>
          <span className="inline-block break-all tabular-nums">
            {sanitizeNationalDigits(form.phoneNational) || '—'}
          </span>{' '}
          raqamiga yuborilgan 5 raqamli kodni kiriting
        </p>
        <div className="mb-5 mx-auto grid w-full max-w-[min(100%,320px)] grid-cols-5 gap-1.5 sm:max-w-[380px] sm:gap-2.5">
          {form.otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="tel"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={d || ''}
              onChange={(e) => handleOtp(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="h-11 w-full rounded-[12px] text-center text-lg font-semibold outline-none transition-colors sm:h-[60px] sm:rounded-[14px] sm:text-[22px]"
              style={{
                border: `1.5px solid ${d ? C.blue : C.border}`,
                backgroundColor: d ? C.blueSelected : C.card,
                color: C.text,
                fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
              }}
              aria-label={`SMS kodi ${i + 1} / ${OTP_SLOT_COUNT}`}
            />
          ))}
        </div>
        <p className="text-center tabular-nums" style={{ fontSize: 12, color: C.muted }}>
          Qayta yuborish: <span style={{ color: C.blue }}>{timerStr}</span>
        </p>
      </div>
      <div className="px-5 pb-9 pt-4">
        <InlineNoticeBar notice={notice} />
        <PrimaryButton onClick={onNext} disabled={!allFilled} loading={busy}>
          Tasdiqlash
        </PrimaryButton>
      </div>
    </div>
  );
}

function Screen4({
  onNext,
  onBack,
  form,
  setForm,
}: {
  onNext: () => void;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const isOther = form.profession === 'other';
  const canContinue =
    form.profession && (form.profession !== 'other' || form.customProfessionName.trim().length > 0);

  return (
    <div className="flex h-full flex-col">
      <TopBar onBack={onBack} />
      <ProgressBar screen={4} />
      <div className="flex flex-1 flex-col overflow-y-auto px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Qaysi kasbda ishlaysiz?
        </h2>
        <p className="mb-5" style={{ fontSize: 14, color: C.muted }}>
          Eng mos vakansiyalarni ko&apos;rsatamiz
        </p>
        <div className="flex flex-col gap-2.5 pb-4">
          {PROFESSIONS.map((p) => (
            <OptionCard
              key={p.id}
              selected={form.profession === p.id}
              onClick={() => setForm((f) => ({ ...f, profession: p.id }))}
              left={
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-lg" style={{ backgroundColor: C.card2 }}>
                  {p.icon}
                </div>
              }
              title={p.name}
              desc={p.desc}
            />
          ))}

          <OptionCard
            selected={isOther}
            onClick={() => setForm((f) => ({ ...f, profession: 'other' }))}
            left={
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-lg" style={{ backgroundColor: C.card2 }}>
                ✏️
              </div>
            }
            title="Boshqa kasb"
            desc="O'zingiz yozing"
          />

          {isOther && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <input
                autoFocus
                type="text"
                placeholder="Kasbingizni kiriting..."
                value={form.customProfessionName}
                onChange={(e) => setForm((f) => ({ ...f, customProfessionName: e.target.value }))}
                className="w-full rounded-[14px] px-4 outline-none transition-colors"
                style={{
                  height: 52,
                  border: `1.5px solid ${form.customProfessionName.trim() ? C.blue : C.border}`,
                  backgroundColor: C.card,
                  color: C.text,
                  fontSize: 15,
                  fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
      <div className="px-5 pb-9 pt-4">
        <PrimaryButton onClick={onNext} disabled={!canContinue}>
          Davom etish
        </PrimaryButton>
      </div>
    </div>
  );
}

function Screen5({
  onNext,
  onBack,
  form,
  setForm,
}: {
  onNext: () => void;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const toggle = (id: string) =>
    setForm((f) => ({
      ...f,
      countries: f.countries.includes(id) ? f.countries.filter((c) => c !== id) : [...f.countries, id],
    }));
  return (
    <div className="flex h-full flex-col">
      <TopBar onBack={onBack} />
      <ProgressBar screen={5} />
      <div className="flex flex-1 flex-col overflow-y-auto px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Qaysi davlatda ishlamoqchisiz?
        </h2>
        <p className="mb-5" style={{ fontSize: 14, color: C.muted }}>
          Bir necha tanlash mumkin
        </p>
        <div className="flex flex-col gap-2.5 pb-4">
          {COUNTRIES.map((c) => (
            <OptionCard
              key={c.id}
              selected={form.countries.includes(c.id)}
              onClick={() => toggle(c.id)}
              left={
                <span className="shrink-0" style={{ fontSize: 22 }}>
                  {c.flag}
                </span>
              }
              title={c.name}
              desc={c.salary}
            />
          ))}
        </div>
      </div>
      <div className="px-5 pb-9 pt-4">
        <PrimaryButton onClick={onNext} disabled={form.countries.length === 0}>
          Davom etish
        </PrimaryButton>
      </div>
    </div>
  );
}

function Screen6({
  onNext,
  onBack,
  form,
  setForm,
  busy,
}: {
  onNext: () => void;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy: boolean;
}) {
  const toggleLang = (lang: string) =>
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang) ? f.languages.filter((l) => l !== lang) : [...f.languages, lang],
    }));
  return (
    <div className="flex h-full flex-col">
      <TopBar onBack={onBack} />
      <ProgressBar screen={6} />
      <div className="flex flex-1 flex-col overflow-y-auto px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Qachon ishlashga tayyorsiz?
        </h2>
        <p className="mb-5" style={{ fontSize: 14, color: C.muted }}>
          Va til bilimingiz
        </p>
        <div className="mb-7 flex flex-col gap-2.5">
          {AVAILABILITY.map((a) => (
            <OptionCard
              key={a.id}
              selected={form.availability === (a.id as any)}
              onClick={() => setForm((f) => ({ ...f, availability: a.id as any }))}
              left={<span className="shrink-0 text-lg">{a.icon}</span>}
              title={a.name}
              desc={a.desc}
            />
          ))}
        </div>
        <p className="mb-3" style={{ fontSize: 13, color: C.muted }}>
          Til bilimingiz (opsional)
        </p>
        <div className="flex flex-wrap gap-2 pb-4">
          {LANGUAGES.map((lang) => {
            const sel = form.languages.includes(lang);
            return (
              <button
                key={lang}
                onClick={() => toggleLang(lang)}
                className="rounded-[10px] px-3.5 py-2.5 font-medium transition-all active:scale-95"
                style={{
                  fontSize: 13,
                  border: `1.5px solid ${sel ? C.blue : C.border}`,
                  backgroundColor: sel ? C.blueSelected : C.card,
                  color: sel ? C.blueL : C.muted,
                  letterSpacing: '0.02em',
                }}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-5 pb-9 pt-4">
        <PrimaryButton onClick={onNext} disabled={!form.availability} loading={busy}>
          Natijalarni ko&apos;rish
        </PrimaryButton>
      </div>
    </div>
  );
}

function ResultCard1({
  onApply,
  title,
  countryLabel,
  percent,
  salary,
}: {
  onApply: () => void;
  title: string;
  countryLabel: string;
  percent: string;
  salary: string;
}) {
  return (
    <div
      className="relative rounded-[20px] p-6"
      style={{ background: 'linear-gradient(135deg, #0a1929, #0d1f3a)', border: `1px solid ${C.blue}44` }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="inline-flex items-center rounded-lg px-2.5 py-1" style={{ backgroundColor: C.blueGlow, border: `1px solid ${C.blue}` }}>
          <span className="font-semibold" style={{ fontSize: 12, color: C.blueL }}>
            {countryLabel}
          </span>
        </div>
        <span className="font-bold" style={{ fontSize: 13, color: C.gold }}>
          {percent} mos
        </span>
      </div>
      <h3 className="mb-1" style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.3px', fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>
        {title}
      </h3>
      <p className="mb-4 font-bold" style={{ fontSize: 20, color: C.gold }}>
        {salary}
      </p>
      <div className="flex flex-col gap-2">
        {['Rasmiy ish va viza', 'Yotoqxona beriladi', 'Oylik bonuslar'].map((feat) => (
          <div key={feat} className="flex items-center gap-2">
            <BlueDot />
            <span style={{ fontSize: 13, color: C.muted }}>{feat}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onApply}
        className="mt-5 h-12 w-full rounded-[14px] font-semibold transition-all active:scale-[0.98]"
        style={{ backgroundColor: C.blue, color: '#fff', fontSize: 15, fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}
      >
        Ariza topshirish
      </button>
    </div>
  );
}

function Screen7({
  onApply,
  results,
}: {
  onApply: () => void;
  results: Array<{ title: string; countryLabel: string; percent: string; salary: string }>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-1 pt-[52px]">
        <div className="mb-2 h-[3px] w-full rounded-full" style={{ backgroundColor: C.blue }} />
        <p className="text-[11px] tracking-[0.5px]" style={{ color: C.muted }}>
          6 / 6 — Natijalar
        </p>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-5">
        <div className="pb-5 pt-4">
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.4px', fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>
            Zo&apos;r! Sizga mos ishlar topildi
          </h2>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{results.length} ta vakansiya siz bilan mos keladi</p>
        </div>
        <div className="flex flex-col gap-3 pb-6">
          {results.map((r, idx) =>
            idx === 0 ? (
              <ResultCard1 key={idx} onApply={onApply} {...r} />
            ) : (
              <div key={idx} className="rounded-2xl border p-4" style={{ backgroundColor: C.card, borderColor: C.border }}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-lg px-2 py-0.5" style={{ backgroundColor: C.goldBg, border: `1px solid ${C.gold}55` }}>
                    <span className="font-semibold" style={{ fontSize: 12, color: C.gold }}>
                      {r.countryLabel}
                    </span>
                  </div>
                  <span className="font-bold" style={{ fontSize: 13, color: C.gold }}>
                    {r.percent} mos
                  </span>
                </div>
                <p className="mb-1 font-bold" style={{ fontSize: 16, color: C.text, fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>
                  {r.title}
                </p>
                <p className="font-bold" style={{ fontSize: 15, color: C.gold }}>
                  {r.salary}
                </p>
              </div>
            ),
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 px-5 pb-9 pt-2">
        <PrimaryButton onClick={onApply}>Bosh sahifaga o&apos;tish →</PrimaryButton>
        <p className="text-center" style={{ fontSize: 13, color: C.muted }}>
          Barchasini ko&apos;rish →
        </p>
      </div>
    </div>
  );
}

// ─── Home Screen (after apply) ────────────────────────────────────────────────

const CC_FLAG: Record<string, string> = {
  DE: '🇩🇪',
  PL: '🇵🇱',
  IL: '🇮🇱',
  KR: '🇰🇷',
  CZ: '🇨🇿',
  UZ: '🇺🇿',
  US: '🇺🇸',
  AE: '🇦🇪',
  TR: '🇹🇷',
};

function pickStr(obj: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!obj) return '';
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
}

function pickNum(obj: Record<string, unknown> | null | undefined, ...keys: string[]): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function countryChip(code: string): string {
  const u = code.trim().toUpperCase();
  if (!u) return '—';
  const flag = CC_FLAG[u] ?? '🌍';
  return `${flag} ${u}`;
}

function profileStatusLabelUz(raw: string): string {
  const s = raw.toUpperCase();
  if (!s) return '—';
  if (s.includes('DRAFT')) return 'Qoralama';
  if (s.includes('SUBMIT')) return 'Yuborilgan';
  if (s.includes('REVIEW') || s.includes('PENDING')) return 'Ko‘rib chiqilmoqda';
  if (s.includes('APPROV')) return 'Tasdiqlangan';
  if (s.includes('REJECT')) return 'Rad etilgan';
  return raw;
}

function profileCompletionPct(profile: Record<string, unknown> | null): number {
  if (!profile) return 0;
  const direct = pickNum(
    profile,
    'profile_completion_percent',
    'completion_percent',
    'profileStrength',
    'profile_strength',
    'completeness',
  );
  if (direct != null && direct >= 0 && direct <= 100) return Math.min(100, Math.round(direct));
  let n = 0;
  const checks = [
    pickStr(profile, 'phone_number', 'phoneNumber', 'phone', 'mobile'),
    pickStr(profile, 'custom_profession_name', 'customProfessionName', 'profession_name', 'professionName'),
    pickStr(profile, 'education_level', 'educationLevel'),
    profile.target_countries ?? profile.targetCountries,
    profile.languages,
    pickStr(profile, 'availability_status', 'availabilityStatus'),
  ];
  for (const c of checks) {
    if (c == null || c === '') continue;
    if (Array.isArray(c) && c.length === 0) continue;
    n++;
  }
  return Math.min(100, Math.round((n / 6) * 100));
}

function displayNameFromProfile(profile: Record<string, unknown> | null): string {
  if (!profile) return 'Nomzod';
  const full = pickStr(profile, 'full_name', 'fullName', 'name', 'display_name', 'displayName');
  if (full) return full;
  const fn = pickStr(profile, 'first_name', 'firstName');
  const ln = pickStr(profile, 'last_name', 'lastName');
  const t = `${fn} ${ln}`.trim();
  return t || 'Nomzod';
}

function initialsFromName(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return 'K';
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return `${p[0]![0] ?? ''}${p[1]![0] ?? ''}`.toUpperCase() || 'K';
}

function formatVacancySalary(v: PublicVacancyRow): string {
  const min = v.salary_min ?? v.salaryMin;
  const max = v.salary_max ?? v.salaryMax;
  const cur = String(v.salary_currency ?? v.salaryCurrency ?? 'EUR');
  if (typeof min === 'number' && typeof max === 'number') return `${min} – ${max} ${cur}/oy`;
  if (typeof min === 'number') return `${min}+ ${cur}/oy`;
  return `— ${cur}`;
}

function vacancyTitle(v: PublicVacancyRow): string {
  return String(v.title ?? v.employer_name ?? v.employerName ?? 'Vakansiya');
}

function vacancyCountryCode(v: PublicVacancyRow): string {
  const c = v.country_code ?? v.countryCode;
  return typeof c === 'string' ? c : '';
}

function targetCountriesSummary(profile: Record<string, unknown> | null): string {
  if (!profile) return '—';
  const tc = profile.target_countries ?? profile.targetCountries;
  if (Array.isArray(tc) && tc.length) {
    const parts = tc.map((item) => {
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        return pickStr(o, 'country_code', 'countryCode', 'code', 'name');
      }
      return String(item ?? '');
    });
    return parts.filter(Boolean).join(', ') || '—';
  }
  return pickStr(profile, 'target_country_code', 'targetCountryCode') || '—';
}

function languagesSummary(profile: Record<string, unknown> | null): string {
  if (!profile) return '—';
  const langs = profile.languages ?? profile.candidate_languages ?? profile.candidateLanguages;
  if (Array.isArray(langs) && langs.length) {
    const parts = langs.map((item) => {
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        return pickStr(o, 'language', 'language_code', 'languageCode', 'name');
      }
      return String(item ?? '');
    });
    return parts.filter(Boolean).join(', ') || '—';
  }
  return '—';
}

function ProfileInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
      style={{ borderColor: C.border }}
    >
      <span className="shrink-0" style={{ fontSize: 12, color: C.muted }}>
        {label}
      </span>
      <span
        className="min-w-0 break-words sm:max-w-[70%] sm:text-right"
        style={{ fontSize: 14, fontWeight: 600, color: C.text }}
      >
        {value || '—'}
      </span>
    </div>
  );
}

function CircleProgress({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={C.blue}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

function HomeScreen({ initialTab = 0 }: { initialTab?: number }) {
  const [activeNav, setActiveNav] = useState(initialTab);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [vacancies, setVacancies] = useState<PublicVacancyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [softWarn, setSoftWarn] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!getCandidateToken()) {
      setLoading(false);
      setProfile(null);
      setVacancies([]);
      setLoadErr('Sessiya topilmadi. Qayta kiring.');
      setSoftWarn(null);
      return;
    }
    setLoading(true);
    setLoadErr(null);
    setSoftWarn(null);
    try {
      const [me, vac] = await Promise.all([candidateFetchProfileMe(), candidateFetchVacancies({})]);
      setProfile(me);
      setVacancies(Array.isArray(vac) ? vac : []);
      if (!me) setSoftWarn('Profil ma’lumotlari hozircha yuklanmadi yoki bo‘sh.');
    } catch (e) {
      setLoadErr(candidatePortalError(e, 'Ma’lumot yuklanmadi.'));
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setActiveNav(initialTab);
  }, [initialTab]);

  const displayName = useMemo(() => displayNameFromProfile(profile), [profile]);
  const initials = useMemo(() => initialsFromName(displayName), [displayName]);
  const pct = useMemo(() => profileCompletionPct(profile), [profile]);
  const statusRaw = pickStr(
    profile,
    'profile_status',
    'profileStatus',
    'status',
    'application_status',
    'applicationStatus',
  );
  const statusUz = profileStatusLabelUz(statusRaw);
  const phone = pickStr(profile, 'phone_number', 'phoneNumber', 'phone', 'mobile');
  const profession = pickStr(
    profile,
    'custom_profession_name',
    'customProfessionName',
    'profession_name',
    'professionName',
  );
  const countries = targetCountriesSummary(profile);
  const langs = languagesSummary(profile);
  const salaryMin = pickNum(profile, 'desired_salary_min', 'desiredSalaryMin');
  const salaryMax = pickNum(profile, 'desired_salary_max', 'desiredSalaryMax');
  const salaryCur = pickStr(profile, 'salary_currency', 'salaryCurrency') || 'EUR';
  const salaryTxt =
    salaryMin != null && salaryMax != null
      ? `${salaryMin} – ${salaryMax} ${salaryCur}`
      : salaryMin != null
        ? `${salaryMin}+ ${salaryCur}`
        : '—';
  const availability = pickStr(profile, 'availability_status', 'availabilityStatus');
  const experience = pickStr(profile, 'experience_range', 'experienceRange');
  const edu = pickStr(profile, 'education_level', 'educationLevel');
  const created = pickStr(profile, 'created_at', 'createdAt', 'created');
  const updated = pickStr(profile, 'updated_at', 'updatedAt', 'updated');
  const profileId = pickStr(profile, 'id', 'profile_id', 'profileId');

  const agentRaw = profile?.assigned_agent ?? profile?.agent ?? profile?.assignedAgent;
  let agentName = '';
  let agentPhone = '';
  if (agentRaw && typeof agentRaw === 'object') {
    const ag = agentRaw as Record<string, unknown>;
    agentName = displayNameFromProfile(ag);
    agentPhone = pickStr(ag, 'phone_number', 'phoneNumber', 'phone', 'mobile');
  }
  if (!agentName) agentName = pickStr(profile, 'agent_name', 'agentName', 'assigned_agent_name', 'assignedAgentName');

  const hasCountries = countries !== '—' && countries.length > 0;
  const hasLangs = langs !== '—' && langs.length > 0;
  const docCount = Array.isArray(profile?.documents) ? (profile!.documents as unknown[]).length : null;

  const firstVac = vacancies[0];
  const ccFirst = firstVac ? vacancyCountryCode(firstVac) : '';

  const bottomSafe = 'max(2.25rem, calc(2.25rem + env(safe-area-inset-bottom, 0px)))';

  let mainScroll: React.ReactNode = null;
  if (loading) {
    mainScroll = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-16">
        <Loader2 className="h-9 w-9 animate-spin" color={C.blue} strokeWidth={2} aria-hidden />
        <p style={{ fontSize: 14, color: C.muted }}>Ma’lumotlar yuklanmoqda…</p>
      </div>
    );
  } else if (activeNav === 0) {
    mainScroll = (
      <>
        <div className="px-3 pb-0 pt-4 sm:px-5 sm:pt-5">
          <p style={{ fontSize: 13, color: C.muted }}>Xush kelibsiz,</p>
          <p
            className="mt-0.5 break-words"
            style={{
              fontSize: 'clamp(1.25rem, 4.5vw, 1.5rem)',
              fontWeight: 800,
              color: C.text,
              letterSpacing: '-0.5px',
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
              lineHeight: 1.2,
            }}
          >
            {displayName}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <div
              className="flex min-w-0 max-w-full items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: C.blueGlow, border: `1px solid ${C.blue}` }}
            >
              <PulseDot color={C.gold} />
              <span className="truncate" style={{ fontSize: 11, fontWeight: 600, color: C.blueL }}>
                {statusUz}
              </span>
            </div>
            {profileId ? (
              <div
                className="flex items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
              >
                <span className="mono truncate text-[11px]" style={{ color: C.muted }}>
                  ID {profileId}
                </span>
              </div>
            ) : null}
          </div>
          {softWarn ? (
            <p className="mt-3 rounded-xl px-3 py-2 text-[13px] leading-snug" style={{ backgroundColor: `${C.gold}18`, color: C.muted }}>
              {softWarn}
            </p>
          ) : null}
          {loadErr ? (
            <p
              className="mt-3 rounded-xl px-3 py-2 text-[13px]"
              style={{ backgroundColor: `${C.red}15`, color: C.red }}
              role="alert"
            >
              {loadErr}
            </p>
          ) : null}
        </div>

        <div
          className="mx-3 mt-4 max-w-full rounded-[20px] p-4 sm:mx-4 sm:p-5"
          style={{ background: 'linear-gradient(135deg, #0a1929 0%, #0d1f3a 100%)', border: `1px solid ${C.blue}` }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.muted,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                }}
              >
                Profil kuchi
              </p>
              <p
                style={{
                  fontSize: 'clamp(1.75rem, 8vw, 2.25rem)',
                  fontWeight: 900,
                  color: C.text,
                  letterSpacing: '-1px',
                  marginTop: 2,
                  fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
                }}
              >
                {pct}%
              </p>
            </div>
            <div className="relative mx-auto flex items-center justify-center sm:mx-0" style={{ width: 56, height: 56 }}>
              <CircleProgress pct={pct} size={56} />
              <span className="absolute" style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                {pct}%
              </span>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full" style={{ backgroundColor: C.border }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1B4F8A, #2980B9)' }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              [phone, '✓ Telefon', '+ Telefon'],
              [profession, '✓ Kasb', '+ Kasb'],
              [hasCountries ? countries : '', '✓ Mamlakat', '+ Mamlakat'],
            ].map(([ok, done, todo]) => (
              <span
                key={String(done)}
                className="rounded-full px-2.5 py-1"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: ok ? '#0a1f0a' : C.border,
                  border: ok ? `1px solid ${C.green}44` : `1px solid ${C.border}`,
                  color: ok ? C.green : C.muted,
                }}
              >
                {ok ? done : todo}
              </span>
            ))}
            {[
              [docCount != null && docCount > 0, '✓ Hujjatlar', '+ Hujjatlar'],
              [hasLangs, '✓ Tillar', '+ Tillar'],
              [!!experience, '✓ Tajriba', '+ Tajriba'],
            ].map(([ok, done, todo]) => (
              <span
                key={String(done)}
                className="rounded-full px-2.5 py-1"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: ok ? '#0a1f0a' : C.border,
                  border: ok ? `1px solid ${C.green}44` : `1px solid ${C.border}`,
                  color: ok ? C.green : C.muted,
                }}
              >
                {ok ? done : todo}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveNav(3)}
            className="mt-3.5 flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-[12px] transition-all active:scale-[0.98]"
            style={{
              backgroundColor: C.blue,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          >
            Profilni ko‘rish
            <ChevronRight size={16} />
          </button>
        </div>

        {agentName ? (
          <div
            className="mx-3 mt-3 flex max-w-full flex-col gap-3 rounded-[18px] p-4 min-[400px]:flex-row min-[400px]:items-center sm:mx-4"
            style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="relative shrink-0 self-start">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg, #1B4F8A, #0F3566)', border: `2px solid ${C.gold}` }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{initialsFromName(agentName)}</span>
              </div>
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: C.green, border: '2px solid #0D1B2E' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ fontSize: 11, color: C.muted }}>Sizning agentingiz</p>
              <p
                className="break-words"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.text,
                  marginTop: 2,
                  fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
                }}
              >
                {agentName}
              </p>
              {agentPhone ? (
                <p className="mono mt-1 break-all text-[12px]" style={{ color: C.muted }}>
                  {agentPhone}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="flex shrink-0 items-center justify-center gap-1.5 self-stretch rounded-[10px] px-3.5 py-2.5 transition-all active:scale-95 min-[400px]:self-auto"
              style={{ border: `1px solid ${C.blue}`, fontSize: 12, fontWeight: 600, color: C.blue, backgroundColor: 'transparent' }}
            >
              <MessageCircle size={14} color={C.blue} />
              Yozish
            </button>
          </div>
        ) : null}

        <div className="mx-3 mt-5 flex min-w-0 flex-wrap items-center justify-between gap-2 sm:mx-4">
          <SectionLabel>Sizga mos vakansiyalar</SectionLabel>
          <button type="button" onClick={() => setActiveNav(1)} style={{ fontSize: 12, fontWeight: 500, color: C.blue }}>
            Barchasini ko‘rish
          </button>
        </div>

        {firstVac ? (
          <div
            className="relative mx-3 mt-2.5 max-w-full overflow-hidden rounded-[20px] p-4 sm:mx-4 sm:p-5"
            style={{
              background: 'linear-gradient(145deg, #0f1e0a 0%, #0a1929 50%, #0d1f0a 100%)',
              border: `1px solid ${C.gold}66`,
            }}
          >
            <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
              <div
                className="inline-flex max-w-full items-center rounded-lg px-2.5 py-1.5"
                style={{ backgroundColor: C.blueGlow, border: `1px solid ${C.green}55` }}
              >
                <span className="break-words" style={{ fontSize: 11, fontWeight: 600, color: C.green }}>
                  {countryChip(ccFirst)}
                </span>
              </div>
            </div>
            <p
              className="break-words"
              style={{
                fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                fontWeight: 800,
                color: C.text,
                letterSpacing: '-0.4px',
                fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
              }}
            >
              {vacancyTitle(firstVac)}
            </p>
            <p
              className="mb-3 break-words"
              style={{
                fontSize: 'clamp(1.1rem, 4vw, 1.35rem)',
                fontWeight: 800,
                color: C.gold,
                letterSpacing: '-0.5px',
                marginTop: 2,
                fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
              }}
            >
              {formatVacancySalary(firstVac)}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setActiveNav(1)}
                className="h-11 w-full flex-1 rounded-[12px] font-semibold transition-all active:scale-[0.98] sm:w-auto"
                style={{ backgroundColor: C.blue, color: '#fff', fontSize: 14, fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}
              >
                Barcha ishlar
              </button>
              <button
                type="button"
                className="flex h-11 w-full shrink-0 items-center justify-center rounded-[12px] transition-all active:scale-95 sm:w-11"
                style={{ border: `1px solid ${C.border}`, backgroundColor: 'transparent' }}
              >
                <Bookmark size={18} color={C.muted} strokeWidth={1.6} />
              </button>
            </div>
          </div>
        ) : (
          <p className="mx-3 mt-3 px-1 text-[13px] sm:mx-4" style={{ color: C.muted }}>
            Hozircha tavsiya etiladigan vakansiya yo‘q. «Ishlar» bo‘limiga o‘ting.
          </p>
        )}

        <div style={{ height: 24 }} />
      </>
    );
  } else if (activeNav === 1) {
    mainScroll = (
      <div className="px-3 pb-6 pt-4 sm:px-5">
        <h2
          className="mb-1 break-words"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.text,
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Ochiq vakansiyalar
        </h2>
        <p className="mb-4 text-[13px]" style={{ color: C.muted }}>
          {vacancies.length} ta topildi
        </p>
        <div className="flex flex-col gap-3">
          {vacancies.length === 0 ? (
            <p style={{ fontSize: 14, color: C.muted }}>Hozircha e’lonlar yo‘q.</p>
          ) : (
            vacancies.map((v, idx) => {
              const cc = vacancyCountryCode(v);
              return (
                <div key={idx} className="rounded-2xl border p-4" style={{ backgroundColor: C.card, borderColor: C.border }}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold" style={{ color: C.green }}>
                      {countryChip(cc)}
                    </span>
                  </div>
                  <p className="mb-1 break-words font-bold" style={{ fontSize: 16, color: C.text }}>
                    {vacancyTitle(v)}
                  </p>
                  <p className="break-words font-bold" style={{ fontSize: 15, color: C.gold }}>
                    {formatVacancySalary(v)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  } else if (activeNav === 2) {
    mainScroll = (
      <div className="px-3 pb-6 pt-4 sm:px-5">
        <h2
          className="mb-4 break-words"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.text,
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Mening arizam
        </h2>
        <div className="rounded-[18px] border p-4" style={{ backgroundColor: C.card, borderColor: C.border }}>
          <ProfileInfoRow label="Holat" value={statusUz} />
          <ProfileInfoRow label="Profil ID" value={profileId} />
          <ProfileInfoRow label="Yaratilgan" value={created} />
          <ProfileInfoRow label="Yangilangan" value={updated} />
          <ProfileInfoRow label="Kasb" value={profession} />
          <ProfileInfoRow label="Maqsad davlatlar" value={countries} />
        </div>
      </div>
    );
  } else {
    mainScroll = (
      <div className="px-3 pb-6 pt-4 sm:px-5">
        <h2
          className="mb-4 break-words"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.text,
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Shaxsiy ma’lumotlar
        </h2>
        <div className="rounded-[18px] border p-4" style={{ backgroundColor: C.card, borderColor: C.border }}>
          <ProfileInfoRow label="To‘liq ism" value={displayName} />
          <ProfileInfoRow label="Telefon" value={phone} />
          <ProfileInfoRow label="Kasb" value={profession} />
          <ProfileInfoRow label="Ta’lim" value={edu} />
          <ProfileInfoRow label="Tajriba" value={experience} />
          <ProfileInfoRow label="Bandlik tayyorgarligi" value={availability} />
          <ProfileInfoRow label="Maqsad maosh" value={salaryTxt} />
          <ProfileInfoRow label="Maqsad davlatlar" value={countries} />
          <ProfileInfoRow label="Tillar" value={langs} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col" style={{ backgroundColor: C.bg }}>
      <div
        className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 pb-3 pt-[52px] sm:px-4"
        style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <img src={LOGO_URL} alt="THE KASB" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
          <span
            className="truncate"
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              letterSpacing: '-0.3px',
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          >
            THE KASB
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg p-2 transition-colors active:scale-95"
            style={{ color: C.muted }}
            aria-label="Yangilash"
          >
            <Loader2 className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.6} />
          </button>
          <div className="relative">
            <Bell size={20} color={C.muted} strokeWidth={1.6} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: C.red }} />
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: C.blue }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{initials}</span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
        {mainScroll}
        <div style={{ height: `calc(5rem + env(safe-area-inset-bottom, 0px))` }} />
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 flex items-start justify-around border-t pt-2"
        style={{
          backgroundColor: C.card,
          borderColor: C.border,
          paddingBottom: bottomSafe,
          borderTopWidth: 1,
        }}
      >
        {[
          { icon: <Home size={22} />, label: 'Bosh', idx: 0 },
          { icon: <Search size={22} />, label: 'Ishlar', idx: 1 },
          { icon: <FileText size={22} />, label: 'Arizam', idx: 2, dot: vacancies.length > 0 },
          { icon: <User size={22} />, label: 'Profil', idx: 3 },
        ].map((item) => {
          const active = activeNav === item.idx;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveNav(item.idx)}
              className="relative flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-0.5 px-1 transition-colors"
              style={{ color: active ? C.blue : C.muted }}
            >
              {item.dot ? (
                <span
                  className="absolute left-1/2 top-0.5 h-2 w-2 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: C.red }}
                />
              ) : null}
              <span style={{ color: active ? C.blue : C.muted }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: active ? C.blue : C.muted }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CandidatePortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const trimmedTg = (
    searchParams.get('tg') ??
    searchParams.get('chatId') ??
    searchParams.get('chat_id') ??
    ''
  ).trim();

  const [view, setView] = useState<View>('onboarding');
  const [homeInitialTab, setHomeInitialTab] = useState(0);
  const [miniAppChatId, setMiniAppChatId] = useState('');
  const [screen1ByTgBusy, setScreen1ByTgBusy] = useState(false);
  const byTgCheckedForChatIdRef = useRef<string | null>(null);
  const telegramUiInitedRef = useRef(false);
  const [screen, setScreen] = useState<Screen>(1);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Array<{ title: string; countryLabel: string; percent: string; salary: string }>>([
    { title: 'Qurilishchi – Elektrik', countryLabel: '🇩🇪 Germaniya', percent: '92%', salary: '1 800 – 2 200 €/oy' },
    { title: 'Ombor ishchisi', countryLabel: '🇵🇱 Polsha', percent: '87%', salary: '900 – 1 200 €/oy' },
    { title: 'Qurilishi – Beton', countryLabel: '🇮🇱 Isroil', percent: '81%', salary: '2 000 – 2 500 €/oy' },
  ]);

  const [form, setForm] = useState<FormState>({
    phoneNational: '',
    otp: emptyOtpSlots(),
    profession: null,
    customProfessionName: '',
    countries: [],
    availability: null,
    languages: [],
  });
  const [smsNoticeScreen2, setSmsNoticeScreen2] = useState<SmsInlineNotice>(null);
  const [smsNoticeScreen3, setSmsNoticeScreen3] = useState<SmsInlineNotice>(null);

  useEffect(() => {
    setSmsNoticeScreen2((prev) => (prev?.variant === 'error' ? null : prev));
  }, [form.phoneNational]);

  useEffect(() => {
    setSmsNoticeScreen3((prev) => (prev?.variant === 'error' ? null : prev));
  }, [form.otp.join('')]);

  useEffect(() => {
    const run = () => {
      if (!isTelegramMiniApp()) {
        setMiniAppChatId('');
        return;
      }
      if (!telegramUiInitedRef.current) {
        telegramUiInitedRef.current = true;
        initTelegramMiniApp();
      }
      const id = readTelegramMiniAppChatId();
      if (id) setMiniAppChatId(id);
    };
    run();
    const raf = window.requestAnimationFrame(run);
    const t1 = window.setTimeout(run, 150);
    const t2 = window.setTimeout(run, 600);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (view !== 'onboarding' || screen !== 1) return;
    const fromTg = isTelegramMiniApp() ? miniAppChatId : '';
    const cid = (trimmedTg || fromTg).trim();
    if (!cid) {
      setScreen1ByTgBusy(false);
      return;
    }
    if (byTgCheckedForChatIdRef.current === cid) {
      setScreen1ByTgBusy(false);
      return;
    }

    let cancelled = false;
    setScreen1ByTgBusy(true);
    void (async () => {
      try {
        const ok = await candidateTrySessionFromTelegramChatId(cid);
        if (cancelled) return;
        byTgCheckedForChatIdRef.current = cid;
        if (ok) {
          setHomeInitialTab(3);
          setView('home');
          setSearchParams(
            (p) => {
              const n = new URLSearchParams(p);
              n.delete('tg');
              n.delete('chatId');
              n.delete('chat_id');
              return n;
            },
            { replace: true },
          );
        }
      } finally {
        if (!cancelled) setScreen1ByTgBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, screen, trimmedTg, miniAppChatId, setSearchParams]);

  const goNext = () => setScreen((s) => Math.min((s + 1) as Screen, TOTAL_SCREENS as Screen));
  const goBack = () => setScreen((s) => Math.max((s - 1) as Screen, 1 as Screen));
  const goHome = () => {
    setHomeInitialTab(0);
    setView('home');
  };

  const phoneE164 = useMemo(() => phoneE164FromNationalDigits(form.phoneNational), [form.phoneNational]);

  async function sendOtpAndNext() {
    if (!phoneE164) {
      setSmsNoticeScreen2({ variant: 'error', text: 'Telefon raqamini to‘liq kiriting.' });
      return;
    }
    setBusy(true);
    setSmsNoticeScreen2(null);
    try {
      await candidateSendOtp(phoneE164);
      setForm((f) => ({ ...f, otp: emptyOtpSlots() }));
      setSmsNoticeScreen3({
        variant: 'success',
        text: 'SMS kodi yuborildi. Kelgan kodni kiriting.',
      });
      goNext();
    } catch (e) {
      setSmsNoticeScreen2({
        variant: 'error',
        text: candidatePortalError(e, 'SMS yuborilmadi.'),
      });
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtpAndNext() {
    if (!phoneE164) {
      setSmsNoticeScreen3({ variant: 'error', text: 'Telefon raqamini to‘liq kiriting.' });
      return;
    }
    const code = form.otp.join('').trim();
    if (code.length < form.otp.length) {
      setSmsNoticeScreen3({ variant: 'error', text: 'SMS kodini to‘liq kiriting.' });
      return;
    }
    setBusy(true);
    try {
      await candidateVerifyOtp({ phoneE164, code });
      setSmsNoticeScreen3(null);
      goNext();
    } catch (e) {
      setSmsNoticeScreen3({
        variant: 'error',
        text: candidatePortalError(e, 'Tasdiqlashda xato.'),
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitProfileAndLoadResults() {
    setBusy(true);
    try {
      const picked = form.profession
        ? form.profession === 'other'
          ? form.customProfessionName.trim()
          : (PROFESSIONS.find((p) => p.id === form.profession)?.name ?? '')
        : '';

      const availability_status =
        form.availability === 'now' ? 'READY_NOW' : form.availability === 'soon' ? 'WITHIN_1_MONTH' : 'WITHIN_3_MONTHS';

      await candidateCreateProfile({
        region_id: 1,
        marital_status: 'SINGLE',
        education_level: 'HIGHER',
        data_consent: true,
        experience_range: 'YEAR_1_3',
        availability_status,
        desired_salary_min: 0,
        desired_salary_max: 0,
        salary_currency: 'EUR',
        custom_profession_name: picked || undefined,
      });

      for (let i = 0; i < form.countries.length; i++) {
        const id = form.countries[i];
        const code = COUNTRIES.find((c) => c.id === id)?.code;
        if (!code) continue;
        await candidateAddTargetCountry({ country_code: code, priority: i + 1 });
      }

      for (const l of form.languages) {
        const lang = toCandidateLanguageEnum(l);
        if (!lang) continue;
        await candidateAddLanguage({ language: lang, level: 'A1', has_certificate: false });
      }

      await candidateSubmitProfile();

      const firstCountry = form.countries[0];
      const firstCode = firstCountry ? COUNTRIES.find((c) => c.id === firstCountry)?.code : undefined;
      const vac = await candidateFetchVacancies({ countryCode: firstCode });
      if (vac.length) {
        const mapped = vac.slice(0, 3).map((v, idx) => {
          const title = String(v.title ?? v.employer_name ?? v.employerName ?? 'Vakansiya');
          const cc = String(v.country_code ?? v.countryCode ?? firstCode ?? '');
          const countryLabel = cc ? `${cc}` : 'Vakansiya';
          const salaryMin = v.salary_min ?? v.salaryMin;
          const salaryMax = v.salary_max ?? v.salaryMax;
          const cur = String(v.salary_currency ?? v.salaryCurrency ?? 'EUR');
          const salary =
            typeof salaryMin === 'number' && typeof salaryMax === 'number'
              ? `${salaryMin} – ${salaryMax} ${cur}/oy`
              : `— ${cur}/oy`;
          const percent = idx === 0 ? '92%' : idx === 1 ? '87%' : '81%';
          return { title, countryLabel, percent, salary };
        });
        setResults(mapped);
      }

      goNext();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Profil yuborishda xato.'));
    } finally {
      setBusy(false);
    }
  }

  const screenMap: Record<Screen, React.ReactNode> = {
    1: <Screen1 onNext={() => setScreen(2)} lookupBusy={screen1ByTgBusy} />,
    2: (
      <Screen2
        onNext={() => void sendOtpAndNext()}
        onBack={goBack}
        form={form}
        setForm={setForm}
        busy={busy}
        notice={smsNoticeScreen2}
      />
    ),
    3: (
      <Screen3
        onNext={() => void verifyOtpAndNext()}
        onBack={goBack}
        form={form}
        setForm={setForm}
        busy={busy}
        notice={smsNoticeScreen3}
      />
    ),
    4: <Screen4 onNext={goNext} onBack={goBack} form={form} setForm={setForm} />,
    5: <Screen5 onNext={goNext} onBack={goBack} form={form} setForm={setForm} />,
    6: <Screen6 onNext={() => void submitProfileAndLoadResults()} onBack={goBack} form={form} setForm={setForm} busy={busy} />,
    7: <Screen7 onApply={goHome} results={results} />,
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#040a12', fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>
      <div className="relative flex overflow-hidden" style={{ width: 'min(390px, 100vw)', height: 'min(844px, 100svh)', backgroundColor: C.bg }}>
        <AnimatePresence mode="wait" initial={false}>
          {view === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="absolute inset-0">
              <HomeScreen initialTab={homeInitialTab} />
            </motion.div>
          ) : (
            <motion.div
              key={`onboarding-${screen}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col overflow-hidden"
              style={{ backgroundColor: C.bg }}
            >
              {screenMap[screen]}
            </motion.div>
          )}
        </AnimatePresence>

        {view === 'onboarding' ? (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0" style={{ paddingBottom: 8 }}>
            <div className="flex items-center justify-center gap-1.5 py-3">
              {Array.from({ length: TOTAL_SCREENS }, (_, i) => {
                const active = i + 1 === screen;
                return (
                  <motion.div
                    key={i}
                    animate={{ width: active ? 20 : 6 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="h-1.5 rounded-full"
                    style={{ backgroundColor: active ? C.blue : C.border }}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
