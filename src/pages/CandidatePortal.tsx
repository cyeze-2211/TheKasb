import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Bookmark,
  ChevronRight,
  FileText,
  Home,
  MessageCircle,
  Search,
  Star,
  User,
} from 'lucide-react';
import { sanitizeNationalDigits, toApiPhone } from '../app/lib/uzPhone';
import {
  candidateAddLanguage,
  candidateAddTargetCountry,
  candidateCreateProfile,
  candidateFetchVacancies,
  candidatePortalError,
  candidateSendOtp,
  candidateSubmitProfile,
  candidateVerifyOtp,
} from '../app/api/candidatePortal';

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

function Screen1({ onNext }: { onNext: () => void }) {
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
        <PrimaryButton onClick={onNext}>Boshlash — 1 daqiqa</PrimaryButton>
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
}: {
  onNext: () => void;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy: boolean;
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
        <div className="mb-2 flex gap-2">
          <div
            className="flex shrink-0 items-center justify-center rounded-[14px] px-4"
            style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.card, height: 56 }}
          >
            <span className="font-semibold" style={{ fontSize: 15, color: C.text }}>
              +998
            </span>
          </div>
          <input
            type="tel"
            placeholder="90 123 45 67"
            value={form.phoneNational}
            onChange={(e) => setForm((f) => ({ ...f, phoneNational: e.target.value }))}
            className="flex-1 rounded-[14px] px-4 outline-none transition-colors"
            style={{
              height: 56,
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
}: {
  onNext: () => void;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(45);
  useEffect(() => {
    if (timer <= 0) return;
    const t = window.setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [timer]);

  const handleOtp = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...form.otp];
    next[idx] = digit;
    setForm((f) => ({ ...f, otp: next }));
    if (digit && idx < next.length - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !form.otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const allFilled = form.otp.every((d) => d !== '');
  const timerStr = `00:${String(timer).padStart(2, '0')}`;

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
        <p className="mb-8" style={{ fontSize: 14, color: C.muted }}>
          +998 {sanitizeNationalDigits(form.phoneNational)} raqamiga yuborilgan kodni kiriting
        </p>
        <div className="mb-5 flex justify-center gap-2.5">
          {form.otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d || ''}
              onChange={(e) => handleOtp(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="rounded-[14px] text-center font-semibold outline-none transition-colors"
              style={{
                width: 56,
                height: 60,
                fontSize: 22,
                flexShrink: 0,
                border: `1.5px solid ${d ? C.blue : C.border}`,
                backgroundColor: d ? C.blueSelected : C.card,
                color: C.text,
                fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
              }}
            />
          ))}
        </div>
        <p className="text-center" style={{ fontSize: 12, color: C.muted }}>
          Kod qayta yuborish: <span style={{ color: C.blue }}>{timerStr}</span>
        </p>
      </div>
      <div className="px-5 pb-9 pt-4">
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

function HomeScreen() {
  const [activeNav, setActiveNav] = useState(0);
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: C.bg }}>
      <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-[52px]" style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="THE KASB" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.3px', fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>
            THE KASB
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={20} color={C.muted} strokeWidth={1.6} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: C.red }} />
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: C.blue }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>AN</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="px-5 pb-0 pt-5">
          <p style={{ fontSize: 13, color: C.muted }}>Xush kelibsiz,</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui", marginTop: 1 }}>
            Alisher Nazarov
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: C.blueGlow, border: `1px solid ${C.blue}` }}>
              <PulseDot color={C.gold} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.blueL }}>Ariza ko&apos;rib chiqilmoqda</span>
            </div>
            <div className="flex items-center rounded-full px-3 py-1.5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.muted }}>12-kun agentlikda</span>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-4 rounded-[20px] p-5" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #0d1f3a 100%)', border: `1px solid ${C.blue}` }}>
          <div className="flex items-start justify-between">
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Profil kuchi</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: C.text, letterSpacing: '-1px', marginTop: 2, fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>65%</p>
            </div>
            <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
              <CircleProgress pct={65} size={56} />
              <span className="absolute" style={{ fontSize: 12, fontWeight: 700, color: C.text }}>65%</span>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full" style={{ backgroundColor: C.border }}>
            <div className="h-full rounded-full" style={{ width: '65%', background: 'linear-gradient(90deg, #1B4F8A, #2980B9)' }} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {['✓ Telefon', '✓ Kasb', '✓ Mamlakat'].map((c) => (
              <span key={c} className="rounded-full px-2.5 py-1" style={{ fontSize: 11, fontWeight: 500, backgroundColor: '#0a1f0a', border: `1px solid ${C.green}44`, color: C.green }}>
                {c}
              </span>
            ))}
            {['+ Hujjatlar', '+ Til', '+ Tajriba'].map((c) => (
              <span key={c} className="rounded-full px-2.5 py-1" style={{ fontSize: 11, fontWeight: 500, backgroundColor: C.border, color: C.muted }}>
                {c}
              </span>
            ))}
          </div>

          <button className="mt-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] transition-all active:scale-[0.98]" style={{ backgroundColor: C.blue, fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>
            Profilni to&apos;ldirish
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mx-4 mt-3 flex items-center gap-3.5 rounded-[18px] p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #1B4F8A, #0F3566)', border: `2px solid ${C.gold}` }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>SA</span>
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: C.green, border: '2px solid #0D1B2E' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 11, color: C.muted }}>Sizning agentingiz</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 2, fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>Sarvar Alimov</p>
            <div className="mt-1 flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={C.gold} color={C.gold} />)}
            </div>
            <p style={{ fontSize: 11, color: C.green, marginTop: 2 }}>Bugun javob beradi</p>
          </div>
          <button className="flex shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 py-2 transition-all active:scale-95" style={{ border: `1px solid ${C.blue}`, fontSize: 12, fontWeight: 600, color: C.blue, backgroundColor: 'transparent' }}>
            <MessageCircle size={14} color={C.blue} />
            Yozish
          </button>
        </div>

        <div className="mx-4 mt-5 flex items-center justify-between">
          <SectionLabel>Sizga mos vakansiyalar</SectionLabel>
          <button style={{ fontSize: 12, fontWeight: 500, color: C.blue }}>Barchasini ko&apos;rish</button>
        </div>

        <div className="relative mx-4 mt-2.5 overflow-hidden rounded-[20px] p-5" style={{ background: 'linear-gradient(145deg, #0f1e0a 0%, #0a1929 50%, #0d1f0a 100%)', border: `1px solid ${C.gold}66` }}>
          <div className="mb-2.5 flex items-start justify-between">
            <div className="inline-flex items-center rounded-lg px-2.5 py-1.5" style={{ backgroundColor: C.blueGlow, border: `1px solid ${C.green}55` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>🇩🇪 Germaniya</span>
            </div>
            <div className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${C.gold}22`, border: `1px solid ${C.gold}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>92% mos</span>
            </div>
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.4px', fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>
            Qurilishchi – Elektrik
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.gold, letterSpacing: '-0.5px', marginTop: 2, marginBottom: 14, fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>
            1 800 – 2 200 €/oy
          </p>
          <div className="flex flex-col gap-2">
            {['Rasmiy ish va viza', 'Yotoqxona beriladi', 'Oylik bonus imkoniyati'].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: C.green }} />
                <span style={{ fontSize: 13, color: C.muted }}>{f}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="h-11 flex-1 rounded-[12px] font-semibold transition-all active:scale-[0.98]" style={{ backgroundColor: C.blue, color: '#fff', fontSize: 14, fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}>
              Ariza topshirish
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-[12px] transition-all active:scale-95" style={{ border: `1px solid ${C.border}`, backgroundColor: 'transparent' }}>
              <Bookmark size={18} color={C.muted} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div style={{ height: 92 }} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-start justify-around pt-3" style={{ height: 80, backgroundColor: C.card, borderTop: `1px solid ${C.border}`, paddingBottom: 36 }}>
        {[
          { icon: <Home size={22} />, label: 'Bosh', idx: 0 },
          { icon: <Search size={22} />, label: 'Ishlar', idx: 1 },
          { icon: <FileText size={22} />, label: 'Arizam', idx: 2, dot: true },
          { icon: <User size={22} />, label: 'Profil', idx: 3 },
        ].map((item) => {
          const active = activeNav === item.idx;
          return (
            <button key={item.label} onClick={() => setActiveNav(item.idx)} className="relative flex min-w-[60px] flex-col items-center gap-0.5 transition-colors" style={{ color: active ? C.blue : C.muted }}>
              {item.dot && <span className="absolute -top-0.5 left-1/2 ml-2.5 h-2 w-2 rounded-full" style={{ backgroundColor: C.red }} />}
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
  const [view, setView] = useState<View>('onboarding');
  const [screen, setScreen] = useState<Screen>(1);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Array<{ title: string; countryLabel: string; percent: string; salary: string }>>([
    { title: 'Qurilishchi – Elektrik', countryLabel: '🇩🇪 Germaniya', percent: '92%', salary: '1 800 – 2 200 €/oy' },
    { title: 'Ombor ishchisi', countryLabel: '🇵🇱 Polsha', percent: '87%', salary: '900 – 1 200 €/oy' },
    { title: 'Qurilishi – Beton', countryLabel: '🇮🇱 Isroil', percent: '81%', salary: '2 000 – 2 500 €/oy' },
  ]);

  const [form, setForm] = useState<FormState>({
    phoneNational: '',
    otp: ['', '', '', ''],
    profession: null,
    customProfessionName: '',
    countries: [],
    availability: null,
    languages: [],
  });

  const goNext = () => setScreen((s) => Math.min((s + 1) as Screen, TOTAL_SCREENS as Screen));
  const goBack = () => setScreen((s) => Math.max((s - 1) as Screen, 1 as Screen));
  const goHome = () => setView('home');

  const phoneE164 = useMemo(() => phoneE164FromNationalDigits(form.phoneNational), [form.phoneNational]);

  async function sendOtpAndNext() {
    if (!phoneE164) {
      toast.error('Telefon raqamini to‘liq kiriting.');
      return;
    }
    setBusy(true);
    try {
      await candidateSendOtp(phoneE164);
      toast.success('SMS kod yuborildi.');
      goNext();
    } catch (e) {
      toast.error(candidatePortalError(e, 'SMS yuborilmadi.'));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtpAndNext() {
    if (!phoneE164) {
      toast.error('Telefon raqamini to‘liq kiriting.');
      return;
    }
    const code = form.otp.join('').trim();
    if (code.length < form.otp.length) {
      toast.error('SMS kodni to‘liq kiriting.');
      return;
    }
    setBusy(true);
    try {
      await candidateVerifyOtp({ phoneE164, code });
      toast.success('Tasdiqlandi.');
      goNext();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Tasdiqlashda xato.'));
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
    1: <Screen1 onNext={() => setScreen(2)} />,
    2: <Screen2 onNext={() => void sendOtpAndNext()} onBack={goBack} form={form} setForm={setForm} busy={busy} />,
    3: <Screen3 onNext={() => void verifyOtpAndNext()} onBack={goBack} form={form} setForm={setForm} busy={busy} />,
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
              <HomeScreen />
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
