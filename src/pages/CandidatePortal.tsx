import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Circle,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  FileCheck2,
  Globe2,
  Languages,
  Dumbbell,
  Factory,
  FileText,
  Folder,
  GraduationCap,
  Home,
  Hotel,
  Laptop,
  Loader2,
  MessageCircle,
  Package,
  Palette,
  Pencil,
  Pickaxe,
  Scale,
  Search,
  ShoppingCart,
  Sprout,
  Stethoscope,
  Truck,
  Undo2,
  User,
  Wrench,
  Zap,
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
  candidateAddWorkExperience,
  candidateCreateProfile,
  type CandidateWorkExperienceBody,
  candidateFetchDestinationCountries,
  candidateFetchProfessionCategories,
  candidateFetchProfessionsByCategory,
  candidateFetchProfileMe,
  candidateFetchVacancies,
  candidatePortalError,
  candidateSendOtp,
  candidateSubmitProfile,
  candidateTryResumeSession,
  candidateTrySessionFromTelegramChatId,
  candidateUpdateMyUser,
  candidateUpdateProfile,
  candidateVerifyOtp,
  normalizeCandidateRegionId,
  type CandidateProfileUpdateBody,
  type DestinationCountryDto,
  type PublicVacancyRow,
} from '../app/api/candidatePortal';
import type { ProfessionCategoryDto, ProfessionDto } from '../app/api/professions';
import {
  adminLanguageUz,
  candidateProfileStatusUz,
  cefrLevelUz,
  documentTypeUz,
  EDUCATION_LEVEL_SELECT_ORDER,
  educationLevelToFormValue,
  educationLevelUz,
  experienceRangeUz,
  maritalStatusUz,
  uzOrCode,
} from '../app/lib/adminUiUz';
import { REGIONS } from '../app/data/mockData';
import { countryFlagEmoji, countryNameUz } from '../app/lib/regionFlags';
import { getCandidateProfileId, getCandidateToken } from '../app/candidate/candidateSession';
import { syntheticTelegramChatId } from '../app/lib/syntheticTelegramChatId';
import {
  initTelegramMiniApp,
  isTelegramMiniApp,
  readTelegramMiniAppChatId,
} from '../app/lib/telegramWebApp';

/** `mockData` REGIONS — "1-Toshkent..." → id */
const REGION_OPTIONS: { id: number; label: string }[] = REGIONS.map((r) => {
  const m = /^(\d+)\s*[-–]\s*/.exec(r.trim()) ?? /^(\d+)/.exec(r.trim());
  const id = m ? Number(m[1]) : NaN;
  return { id, label: r };
}).filter((x) => Number.isFinite(x.id) && x.id > 0);

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

/** Til darajasi (CEFR) — backend `level` bilan mos */
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

type LanguageSelection = { name: string; level: CefrLevel };

interface FormState {
  phoneNational: string;
  otp: string[];
  /** API kategoriya `id` */
  workProfessionCategoryId: number | null;
  /** Tanlangan kasb `id` (0 yoki null = «Boshqa» / hali tanlanmagan) */
  workProfessionId: number | null;
  /** Ro‘yxatda yo‘q kasb */
  workIsOtherProfession: boolean;
  /** `workIsOtherProfession` bo‘lsa — maxsus kasb nomi */
  workCustomProfessionName: string;
  /** Ish tajribasi (yil) — joriy qator (massivga qo‘shishdan oldin) */
  workExperienceYears: 1 | 2 | 5 | null;
  /** POST /work-experiences uchun yig‘ilgan qatorlar */
  workExperienceEntries: CandidateWorkExperienceBody[];
  /** Tanlangan qatorlar tartibi — katalog `id` (UUID, POST da destination_country_id) */
  countries: string[];
  availability: 'now' | 'soon' | 'later' | null;
  languageSelections: LanguageSelection[];
  /** «Til bilmayman» tanlangan bo‘lsa */
  declaresNoLanguage: boolean;
  /** EUR, `desired_salary_min` */
  desiredSalaryMin: number;
  /** EUR, `desired_salary_max` */
  desiredSalaryMax: number;
  profileFirstName: string;
  profileLastName: string;
  profileGender: 'ERKAK' | 'AYOL';
  /** YYYY-MM-DD */
  profileDateBirth: string;
}

/** Joriy forma bo‘yicha bitta work-experience obyekti (slug API bilan mos) */
function buildWorkExperienceBody(form: FormState): CandidateWorkExperienceBody | null {
  const y = form.workExperienceYears;
  if (y == null) return null;
  const catId = form.workProfessionCategoryId ?? 0;
  const profId = form.workIsOtherProfession ? 0 : form.workProfessionId ?? 0;
  if (!form.workIsOtherProfession && profId <= 0) return null;
  if (form.workIsOtherProfession && !form.workCustomProfessionName.trim()) return null;
  const description = `${y} yil ish tajribasi`;
  return {
    profession_id: profId,
    profession_category_id: catId,
    duration_years: y,
    duration_months: 0,
    description,
    ...(form.workIsOtherProfession && form.workCustomProfessionName.trim()
      ? { custom_profession_name: form.workCustomProfessionName.trim() }
      : {}),
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WORK_EXPERIENCE_YEAR_OPTIONS = [1, 2, 5] as const;

function destinationCountryCardDesc(d: {
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_currency_symbol?: string;
  language_req?: string;
  note?: string;
}): string {
  const parts: string[] = [];
  if (
    d.salary_min != null &&
    d.salary_max != null &&
    Number.isFinite(d.salary_min) &&
    Number.isFinite(d.salary_max)
  ) {
    const cur = (d.salary_currency_symbol || d.salary_currency || '').trim();
    parts.push(cur ? `${d.salary_min} – ${d.salary_max} ${cur}` : `${d.salary_min} – ${d.salary_max}`);
  }
  if (d.language_req) parts.push(d.language_req);
  if (d.note) parts.push(d.note);
  return parts.join(' · ') || ' ';
}

const AVAILABILITY = [
  { id: 'now', icon: '🟢', name: 'Hozir tayyorman', desc: 'Hujjatlarim tayyor' },
  { id: 'soon', icon: '📅', name: '1–3 oy ichida', desc: 'Hujjatlar tayyorlanmoqda' },
  { id: 'later', icon: '🔮', name: 'Keyinroq', desc: 'Hali rejalashtirmoqdaman' },
];

const PRESET_LANGUAGE_LABELS = ['Rus tili', 'Ingliz tili', 'Nemis tili', 'Koreys tili', 'Polyak tili'] as const;

const NO_LANGUAGE_LABEL = 'Til bilmayman';

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Kutilayotgan oylik (EUR) — suriladigan diapazon */
const SALARY_EUR_MIN_BOUND = 600;
const SALARY_EUR_MAX_BOUND = 8000;
const SALARY_EUR_STEP = 50;
const SALARY_EUR_DEFAULT_MIN = 600;
const SALARY_EUR_DEFAULT_MAX = 3500;

const TOTAL_SCREENS = 7;
/** Backend SMS kodi uzunligi */
const OTP_SLOT_COUNT = 5;
/** Qayta yuborishgacha kutish (sekund) */
const SMS_RESEND_COUNTDOWN_SEC = 120;

/** O‘zbekiston mobil operatorlari — telefon maydoni ostidagi ko‘rsatma */
const UZ_MOBILE_OPERATOR_LABELS = [
  'Beeline',
  'Ucell',
  'MobiUz',
  'Uzmobile',
  'Perfectum Mobile',
  'Oq',
] as const;

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
  2: 14,
  3: 28,
  4: 42,
  5: 55,
  6: 72,
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

/** Backend `ProfessionCategoryDto.icon` — slug (`construction`) → Lucide SVG; URL bo‘lsa rasm */
const CATEGORY_ICON_BY_SLUG: Record<string, LucideIcon> = {
  construction: Building2,
  medical: Stethoscope,
  hospitality: Hotel,
  transport: Truck,
  agriculture: Sprout,
  manufacturing: Factory,
  education: GraduationCap,
  retail: ShoppingCart,
  it: Laptop,
  technology: Laptop,
  finance: Briefcase,
  services: Wrench,
  logistics: Package,
  energy: Zap,
  mining: Pickaxe,
  legal: Scale,
  art: Palette,
  sport: Dumbbell,
};

/** API `icon`: URL / rasm yo‘li yoki slug → Lucide */
function isCategoryIconImageSrc(t: string): boolean {
  const s = t.trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  if (s.startsWith('//')) return true;
  if (s.startsWith('data:image')) return true;
  if (s.startsWith('/') && /\.(png|jpe?g|gif|webp|svg|ico)(\?|#|$)/i.test(s)) return true;
  return false;
}

function ProfessionCategoryIcon({ icon }: { icon: string }) {
  const raw = (icon ?? '').trim();
  const shellClass =
    'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px]';
  const shellStyle = {
    backgroundColor: C.card2,
    border: `1px solid ${C.border}80`,
  };

  if (isCategoryIconImageSrc(raw)) {
    const src = raw.startsWith('//') ? `https:${raw}` : raw;
    return (
      <div className={shellClass} style={shellStyle}>
        <img
          src={src}
          alt=""
          className="h-7 w-7 max-h-[90%] max-w-[90%] object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  const isSlug = /^[a-z0-9_-]+$/i.test(raw);
  const key = raw.toLowerCase().replace(/\s+/g, '_');
  const Mapped = isSlug ? CATEGORY_ICON_BY_SLUG[key] : undefined;

  if (Mapped) {
    const Ico = Mapped;
    return (
      <div className={shellClass} style={shellStyle} title={raw}>
        <Ico size={22} strokeWidth={1.65} style={{ color: C.blueL }} aria-hidden />
      </div>
    );
  }

  if (isSlug) {
    return (
      <div className={shellClass} style={shellStyle} title={raw}>
        <Folder size={22} strokeWidth={1.65} style={{ color: C.muted }} aria-hidden />
      </div>
    );
  }

  return (
    <div className={shellClass} style={shellStyle}>
      <span className="select-none text-[18px] leading-none" aria-hidden title={raw}>
        {raw}
      </span>
    </div>
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
    4: 'Shaxsiy ma’lumotlar',
    5: 'Kasb tanlash',
    6: 'Davlat tanlash',
    7: 'Tayyorlik & Til',
  };
  return labels[screen] ?? '';
}

function ProgressBar({ screen }: { screen: Screen }) {
  const pct = PROGRESS_BY_SCREEN[screen] ?? 0;
  const showCaption = screen !== 4;
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
      {showCaption ? (
        <p className="mt-2 text-[11px] tracking-[0.5px]" style={{ color: C.muted }}>
          {screen - 1} / {TOTAL_SCREENS - 1} — {stepLabel(screen)}
        </p>
      ) : null}
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
  return m[label] ?? 'OTHER';
}

/** Ro‘yxatdagi til bilan bir xil (harf-registrsiz) bo‘lsa — kanonik yozuvni qaytaradi, aks holda trimlangan matn */
function normalizeCustomLangLabel(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  for (const lang of PRESET_LANGUAGE_LABELS) {
    if (lang.toLowerCase() === lower) return lang;
  }
  if (NO_LANGUAGE_LABEL.toLowerCase() === lower) return NO_LANGUAGE_LABEL;
  return t;
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
        <div
          className="mb-2 flex min-h-[56px] w-full min-w-0 items-stretch overflow-hidden rounded-[14px] transition-[box-shadow] focus-within:shadow-[0_0_0_2px_rgba(27,79,138,0.4)]"
          style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.card }}
        >
          <div
            className="flex shrink-0 select-none items-center px-3 sm:px-4"
            style={{ borderRight: `1px solid ${C.border}`, backgroundColor: C.card2 }}
            aria-hidden
          >
            <span className="font-semibold tabular-nums" style={{ fontSize: 15, color: C.muted }}>
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
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 outline-none sm:px-4"
            style={{
              color: C.text,
              fontSize: 15,
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          />
        </div>
        <p className="mb-2 mt-1" style={{ fontSize: 11, color: C.muted, letterSpacing: '0.4px' }}>
          O‘zbekiston mobil operatorlari
        </p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {UZ_MOBILE_OPERATOR_LABELS.map((op) => (
            <span
              key={op}
              className="max-w-full break-words rounded-lg px-2.5 py-1.5"
              style={{
                backgroundColor: C.card2,
                fontSize: 11,
                color: C.text,
                border: `1px solid ${C.border}`,
              }}
            >
              {op}
            </span>
          ))}
        </div>
        <p className="mb-2" style={{ fontSize: 12, color: C.muted }}>
          Ma&apos;lumotlaringizni hech kimga bermaymiz
        </p>
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

function Screen4Personal({
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
  const fnOk = form.profileFirstName.trim().length > 0;
  const lnOk = form.profileLastName.trim().length > 0;
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(form.profileDateBirth);
  const canContinue = fnOk && lnOk && dateOk;
  const dateMax = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex h-full min-w-0 flex-col">
      <TopBar onBack={onBack} />
      <ProgressBar screen={4} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-5 pt-1">
        <SectionLabel>Ism</SectionLabel>
        <input
          type="text"
          autoComplete="given-name"
          placeholder="Ism"
          value={form.profileFirstName}
          onChange={(e) => setForm((f) => ({ ...f, profileFirstName: e.target.value }))}
          className="mt-2 box-border min-h-[52px] w-full min-w-0 max-w-full rounded-[14px] px-4 py-3 text-base outline-none transition-colors"
          style={{
            border: `1.5px solid ${form.profileFirstName.trim() ? C.blue : C.border}`,
            backgroundColor: C.card,
            color: C.text,
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        />

        <div className="mt-4 min-w-0">
          <SectionLabel>Familiya</SectionLabel>
          <input
            type="text"
            autoComplete="family-name"
            placeholder="Familiya"
            value={form.profileLastName}
            onChange={(e) => setForm((f) => ({ ...f, profileLastName: e.target.value }))}
            className="mt-2 box-border min-h-[52px] w-full min-w-0 max-w-full rounded-[14px] px-4 py-3 text-base outline-none transition-colors"
            style={{
              border: `1.5px solid ${form.profileLastName.trim() ? C.blue : C.border}`,
              backgroundColor: C.card,
              color: C.text,
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          />
        </div>

        <div className="mt-4 min-w-0">
          <SectionLabel>Jins</SectionLabel>
          <div className="mt-2 grid min-w-0 w-full grid-cols-2 gap-2.5">
          {(['ERKAK', 'AYOL'] as const).map((g) => {
            const sel = form.profileGender === g;
            const label = g === 'ERKAK' ? 'Erkak' : 'Ayol';
            return (
              <button
                key={g}
                type="button"
                onClick={() => setForm((f) => ({ ...f, profileGender: g }))}
                className="rounded-[14px] py-3.5 text-center text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  border: `1.5px solid ${sel ? C.blue : C.border}`,
                  backgroundColor: sel ? C.blueSelected : C.card,
                  color: sel ? C.blueL : C.muted,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        </div>

        <div className="mt-4 min-w-0">
          <SectionLabel>Tug‘ilgan sana</SectionLabel>
          <input
            type="date"
            min="1940-01-01"
            max={dateMax}
            value={dateOk ? form.profileDateBirth : ''}
            onChange={(e) => {
              const v = e.target.value;
              if (v) setForm((f) => ({ ...f, profileDateBirth: v }));
            }}
            className="mt-2 box-border min-h-[52px] w-full min-w-0 max-w-full rounded-[14px] px-4 py-3 text-base outline-none transition-colors"
            style={{
              border: `1.5px solid ${dateOk ? C.blue : C.border}`,
              backgroundColor: C.card,
              color: C.text,
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
            aria-label="Tug‘ilgan sana"
          />
        </div>
      </div>
      <div className="px-5 pb-9 pt-4">
        <InlineNoticeBar notice={notice} />
        <PrimaryButton onClick={onNext} disabled={!canContinue} loading={busy}>
          Saqlash va davom etish
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
  type Panel = 'category' | 'profession' | 'otherDetail' | 'experience';

  const [panel, setPanel] = useState<Panel>(() => {
    const years = form.workExperienceYears;
    const hasNamedProfession = form.workProfessionId != null && form.workProfessionId > 0;
    const hasOtherReady =
      form.workIsOtherProfession && form.workCustomProfessionName.trim().length > 0;
    if (years != null && (hasNamedProfession || hasOtherReady)) return 'experience';
    if (form.workIsOtherProfession) return 'otherDetail';
    if (form.workProfessionCategoryId != null) return 'profession';
    return 'category';
  });
  const [categories, setCategories] = useState<ProfessionCategoryDto[]>([]);
  const [professions, setProfessions] = useState<ProfessionDto[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [profsLoading, setProfsLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCatsLoading(true);
    setLoadErr(null);
    void candidateFetchProfessionCategories()
      .then((c) => {
        if (!cancelled) setCategories(c);
      })
      .catch((e) => {
        if (!cancelled) setLoadErr(candidatePortalError(e, 'Kasb kategoriyalari yuklanmadi.'));
      })
      .finally(() => {
        if (!cancelled) setCatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const catId = form.workProfessionCategoryId;
    if (catId == null) {
      setProfessions([]);
      return;
    }
    let cancelled = false;
    setProfsLoading(true);
    setLoadErr(null);
    void candidateFetchProfessionsByCategory(catId)
      .then((list) => {
        if (!cancelled) setProfessions(list);
      })
      .catch((e) => {
        if (!cancelled) setLoadErr(candidatePortalError(e, 'Kasblar ro‘yxati yuklanmadi.'));
      })
      .finally(() => {
        if (!cancelled) setProfsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.workProfessionCategoryId]);

  const handleTopBack = () => {
    if (panel === 'category') {
      onBack();
      return;
    }
    if (panel === 'profession') {
      setPanel('category');
      setProfessions([]);
      setForm((f) => ({
        ...f,
        workProfessionCategoryId: null,
        workProfessionId: null,
        workIsOtherProfession: false,
        workCustomProfessionName: '',
        workExperienceYears: null,
      }));
      return;
    }
    if (panel === 'otherDetail') {
      setPanel('profession');
      setForm((f) => ({
        ...f,
        workIsOtherProfession: false,
        workCustomProfessionName: '',
        workProfessionId: null,
        workExperienceYears: null,
      }));
      return;
    }
    setPanel(form.workIsOtherProfession ? 'otherDetail' : 'profession');
    setForm((f) => ({ ...f, workExperienceYears: null }));
  };

  const selectCategory = (catId: number) => {
    setForm((f) => ({
      ...f,
      workProfessionCategoryId: catId,
      workProfessionId: null,
      workIsOtherProfession: false,
      workCustomProfessionName: '',
      workExperienceYears: null,
    }));
    setPanel('profession');
  };

  const selectProfessionRow = (p: ProfessionDto) => {
    setForm((f) => ({
      ...f,
      workProfessionId: p.id,
      workProfessionCategoryId: p.category_id,
      workIsOtherProfession: false,
      workCustomProfessionName: '',
      workExperienceYears: null,
    }));
    setPanel('experience');
  };

  const selectOtherProfession = () => {
    setForm((f) => ({
      ...f,
      workProfessionId: 0,
      workIsOtherProfession: true,
      workCustomProfessionName: '',
      workExperienceYears: null,
    }));
    setPanel('otherDetail');
  };

  const otherNameOk = form.workCustomProfessionName.trim().length > 0;
  const hasProfessionChoice =
    (form.workProfessionId != null && form.workProfessionId > 0) ||
    (form.workIsOtherProfession && otherNameOk);
  const canFinishExperience = hasProfessionChoice && form.workExperienceYears != null;

  const addAnotherWork = () => {
    const body = buildWorkExperienceBody(form);
    if (!body) return;
    const nextEntries = [...form.workExperienceEntries, body];
    setForm((f) => ({
      ...f,
      workExperienceEntries: nextEntries,
      workProfessionCategoryId: null,
      workProfessionId: null,
      workIsOtherProfession: false,
      workCustomProfessionName: '',
      workExperienceYears: null,
    }));
    setPanel('category');
    setProfessions([]);
  };

  const goNextWithWorkExperiences = () => {
    const addition = buildWorkExperienceBody(form);
    const merged: CandidateWorkExperienceBody[] = addition
      ? [...form.workExperienceEntries, addition]
      : [...form.workExperienceEntries];
    if (merged.length === 0) {
      toast.error('Kamida bitta ish tajribasini tanlang.');
      return;
    }
    setForm((f) => ({
      ...f,
      workExperienceEntries: merged,
      workProfessionCategoryId: null,
      workProfessionId: null,
      workIsOtherProfession: false,
      workCustomProfessionName: '',
      workExperienceYears: null,
    }));
    onNext();
  };

  const primaryDisabled =
    panel === 'otherDetail' ? !otherNameOk : panel === 'experience' ? false : true;
  const primaryAction = () => {
    if (panel === 'otherDetail' && otherNameOk) {
      setPanel('experience');
      return;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar onBack={handleTopBack} />
      <ProgressBar screen={5} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-5">
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
          {panel === 'category'
            ? 'Kasb yo‘nalishingiz'
            : panel === 'profession'
              ? 'Aniq kasbingiz'
              : panel === 'otherDetail'
                ? 'Kasb nomi'
                : 'Ish tajribangiz'}
        </h2>
        <p className="mb-4" style={{ fontSize: 14, color: C.muted }}>
          {panel === 'category'
            ? 'Kategoriyani tanlang — keyin ro‘yxatdan kasbni tanlaysiz.'
            : panel === 'profession'
              ? 'O‘zingizga mos kasbni tanlang yoki «Boshqa kasb».'
              : panel === 'otherDetail'
                ? 'Ro‘yxatda bo‘lmagan kasbingizni qisqa yozing.'
                : 'Yillarni tanlang (faqat bittasi).'}
        </p>

        {loadErr ? (
          <p className="mb-3 rounded-xl px-3 py-2.5 text-center text-[13px]" style={{ backgroundColor: `${C.red}18`, color: C.text }}>
            {loadErr}
          </p>
        ) : null}

        {panel === 'category' ? (
          catsLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: C.blueL }} />
              <span style={{ fontSize: 14, color: C.muted }}>Kasblar yuklanmoqda…</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 pb-2">
              {categories.map((c) => (
                <OptionCard
                  key={c.id}
                  selected={false}
                  onClick={() => selectCategory(c.id)}
                  left={<ProfessionCategoryIcon icon={c.icon} />}
                  title={c.name_uz || c.name_ru || 'Kategoriya'}
                  desc={c.name_ru && c.name_uz !== c.name_ru ? c.name_ru : 'Tanlash'}
                />
              ))}
            </div>
          )
        ) : null}

        {panel === 'profession' ? (
          profsLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: C.blueL }} />
              <span style={{ fontSize: 13, color: C.muted }}>Kasblar yuklanmoqda…</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 pb-2">
              {professions.map((p) => (
                <OptionCard
                  key={p.id}
                  selected={form.workProfessionId === p.id && !form.workIsOtherProfession}
                  onClick={() => selectProfessionRow(p)}
                  left={
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-lg"
                      style={{ backgroundColor: C.card2 }}
                    >
                      💼
                    </div>
                  }
                  title={p.name_uz || p.name_ru || 'Kasb'}
                  desc={p.name_ru && p.name_uz !== p.name_ru ? p.name_ru : 'Tanlash'}
                />
              ))}
              <OptionCard
                selected={form.workIsOtherProfession}
                onClick={() => selectOtherProfession()}
                left={
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-lg"
                    style={{ backgroundColor: C.card2 }}
                  >
                    ✏️
                  </div>
                }
                title="Boshqa kasb"
                desc="Ro‘yxatda yo‘q"
              />
            </div>
          )
        ) : null}

        {panel === 'otherDetail' ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <input
              type="text"
              autoFocus
              placeholder="Masalan: CNC operator"
              value={form.workCustomProfessionName}
              onChange={(e) => setForm((f) => ({ ...f, workCustomProfessionName: e.target.value }))}
              className="box-border min-h-[52px] w-full min-w-0 max-w-full rounded-[14px] px-4 py-3 text-base outline-none"
              style={{
                border: `1.5px solid ${otherNameOk ? C.blue : C.border}`,
                backgroundColor: C.card,
                color: C.text,
                fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
              }}
            />
          </motion.div>
        ) : null}

        {panel === 'experience' ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="pb-2">
            <div className="grid grid-cols-3 gap-2.5">
              {WORK_EXPERIENCE_YEAR_OPTIONS.map((y) => {
                const sel = form.workExperienceYears === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, workExperienceYears: y }))}
                    className="rounded-[14px] py-4 text-center text-[15px] font-bold tabular-nums transition-all active:scale-[0.98]"
                    style={{
                      border: `1.5px solid ${sel ? C.blue : C.border}`,
                      backgroundColor: sel ? C.blueSelected : C.card,
                      color: sel ? C.blueL : C.text,
                      fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
                    }}
                  >
                    {y} yil
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </div>
      {panel === 'otherDetail' ? (
        <div className="px-5 pb-9 pt-4">
          <PrimaryButton onClick={() => primaryAction()} disabled={primaryDisabled}>
            Davom etish
          </PrimaryButton>
        </div>
      ) : panel === 'experience' ? (
        <div className="flex flex-col gap-2.5 px-5 pb-9 pt-4">
          {form.workExperienceEntries.length > 0 ? (
            <p className="text-center text-[13px] leading-snug" style={{ color: C.muted }}>
              {form.workExperienceEntries.length} ta ish tajribasi qo‘shildi. Yana qo‘shishingiz yoki keyingi bosqichga
              o‘tishingiz mumkin.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => addAnotherWork()}
            disabled={!canFinishExperience}
            className="h-14 w-full rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100"
            style={{
              fontSize: 15,
              letterSpacing: '-0.2px',
              backgroundColor: C.card,
              color: C.text,
              border: `1.5px solid ${C.border}`,
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          >
            Yana ish qo‘shish
          </button>
          <PrimaryButton
            onClick={() => goNextWithWorkExperiences()}
            disabled={!canFinishExperience && form.workExperienceEntries.length === 0}
          >
            Keyingi bosqich
          </PrimaryButton>
        </div>
      ) : (
        <div className="shrink-0 pb-6" />
      )}
    </div>
  );
}

function Screen6({
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
  const [destinations, setDestinations] = useState<DestinationCountryDto[]>([]);
  const [destLoading, setDestLoading] = useState(true);
  const [destErr, setDestErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDestLoading(true);
    setDestErr(null);
    void candidateFetchDestinationCountries()
      .then((rows) => {
        if (!cancelled) setDestinations(rows);
      })
      .catch((e) => {
        if (!cancelled) setDestErr(candidatePortalError(e, 'Mamlakatlar ro‘yxati yuklanmadi.'));
      })
      .finally(() => {
        if (!cancelled) setDestLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) =>
    setForm((f) => ({
      ...f,
      countries: f.countries.includes(id) ? f.countries.filter((c) => c !== id) : [...f.countries, id],
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
          Qaysi davlatda ishlamoqchisiz?
        </h2>
        <p className="mb-5" style={{ fontSize: 14, color: C.muted }}>
          Bir necha tanlash mumkin
        </p>
        <div className="flex flex-col gap-2.5 pb-4">
          {destLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin" color={C.blue} strokeWidth={2} aria-hidden />
              <p style={{ fontSize: 14, color: C.muted }}>Mamlakatlar yuklanmoqda…</p>
            </div>
          ) : destErr ? (
            <p
              className="rounded-xl px-3 py-2.5 text-center text-[13px] leading-snug"
              style={{ backgroundColor: `${C.red}18`, border: `1px solid ${C.red}44`, color: C.text }}
              role="alert"
            >
              {destErr}
            </p>
          ) : destinations.length === 0 ? (
            <p style={{ fontSize: 14, color: C.muted }}>Hozircha tanlash uchun mamlakat katalogi bo‘sh.</p>
          ) : (
            destinations.map((d) => {
              const title = d.name_uz || d.name_ru || d.country_code;
              const flag = d.flag_emoji || countryFlagEmoji(d.country_code);
              return (
                <OptionCard
                  key={d.id}
                  selected={form.countries.includes(d.id)}
                  onClick={() => toggle(d.id)}
                  left={
                    <span className="shrink-0" style={{ fontSize: 22 }}>
                      {flag}
                    </span>
                  }
                  title={title}
                  desc={destinationCountryCardDesc(d)}
                />
              );
            })
          )}
        </div>
      </div>
      <div className="px-5 pb-9 pt-4">
        <PrimaryButton onClick={onNext} disabled={form.countries.length === 0 || destLoading || !!destErr}>
          Davom etish
        </PrimaryButton>
      </div>
    </div>
  );
}

function DesiredSalaryRangeBlock({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<'min' | 'max' | null>(null);

  const span = SALARY_EUR_MAX_BOUND - SALARY_EUR_MIN_BOUND;
  const leftPct = ((form.desiredSalaryMin - SALARY_EUR_MIN_BOUND) / span) * 100;
  const rightPct = ((form.desiredSalaryMax - SALARY_EUR_MIN_BOUND) / span) * 100;
  const widthPct = Math.max(0, rightPct - leftPct);

  const valueFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return SALARY_EUR_MIN_BOUND;
    const r = el.getBoundingClientRect();
    const t = r.width <= 0 ? 0 : Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const raw = SALARY_EUR_MIN_BOUND + t * span;
    const stepped = Math.round(raw / SALARY_EUR_STEP) * SALARY_EUR_STEP;
    return Math.max(SALARY_EUR_MIN_BOUND, Math.min(SALARY_EUR_MAX_BOUND, stepped));
  };

  const closestThumb = (clientX: number): 'min' | 'max' => {
    const el = trackRef.current;
    if (!el) return 'min';
    const r = el.getBoundingClientRect();
    const xMin = r.left + (leftPct / 100) * r.width;
    const xMax = r.left + (rightPct / 100) * r.width;
    return Math.abs(clientX - xMin) <= Math.abs(clientX - xMax) ? 'min' : 'max';
  };

  const applyDrag = (v: number, which: 'min' | 'max') => {
    const stepped = Math.round(v / SALARY_EUR_STEP) * SALARY_EUR_STEP;
    if (which === 'min') {
      setForm((f) => {
        const cap = f.desiredSalaryMax - SALARY_EUR_STEP;
        const next = Math.min(Math.max(SALARY_EUR_MIN_BOUND, stepped), cap);
        return { ...f, desiredSalaryMin: next };
      });
    } else {
      setForm((f) => {
        const floor = f.desiredSalaryMin + SALARY_EUR_STEP;
        const next = Math.max(Math.min(SALARY_EUR_MAX_BOUND, stepped), floor);
        return { ...f, desiredSalaryMax: next };
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const thumb = (e.target as HTMLElement).closest('[data-salary-thumb]') as HTMLElement | null;
    let which: 'min' | 'max';
    if (thumb?.dataset.salaryThumb === 'min') which = 'min';
    else if (thumb?.dataset.salaryThumb === 'max') which = 'max';
    else which = closestThumb(e.clientX);

    dragRef.current = which;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    applyDrag(valueFromClientX(e.clientX), which);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    applyDrag(valueFromClientX(e.clientX), dragRef.current);
  };

  const endDrag = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const thumbStyle = {
    boxShadow: `0 1px 4px ${C.border}, 0 0 0 2px #fff`,
    backgroundColor: C.blue,
    borderColor: '#fff',
  };

  return (
    <div className="mb-6">
      <SectionLabel>Kutilayotgan oylik (EUR)</SectionLabel>
      <div className="mb-1 mt-2 flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: C.muted }}>
            Minimum
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: C.blueL }}>
            {form.desiredSalaryMin.toLocaleString('de-DE')} €
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: C.muted }}>
            Maksimum
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: C.blueL }}>
            {form.desiredSalaryMax.toLocaleString('de-DE')} €
          </p>
        </div>
      </div>
      <div
        ref={trackRef}
        role="group"
        aria-label="Kutilayotgan oylik oralig'i"
        className="relative mb-3 mt-1 h-11 w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: C.border }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full transition-[left,width] duration-75 ease-out"
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            minWidth: widthPct > 0 ? 4 : 0,
            backgroundColor: C.blue,
            boxShadow: `0 0 12px ${C.blue}55`,
          }}
        />
        <button
          type="button"
          data-salary-thumb="min"
          aria-label={`Minimal oylik: ${form.desiredSalaryMin} evro`}
          className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: `${leftPct}%`, ...thumbStyle }}
        />
        <button
          type="button"
          data-salary-thumb="max"
          aria-label={`Maksimal oylik: ${form.desiredSalaryMax} evro`}
          className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: `${rightPct}%`, ...thumbStyle }}
        />
      </div>
      <p className="text-[11px]" style={{ color: C.muted }}>
        Oraliq: {SALARY_EUR_MIN_BOUND.toLocaleString('de-DE')} – {SALARY_EUR_MAX_BOUND.toLocaleString('de-DE')} € · qadam{' '}
        {SALARY_EUR_STEP} €
      </p>
    </div>
  );
}

function Screen7({
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
  const [showOtherLangPanel, setShowOtherLangPanel] = useState(false);
  const [otherLangDraft, setOtherLangDraft] = useState('');
  const [otherLangLevel, setOtherLangLevel] = useState<CefrLevel>('B1');

  const langLevel = (name: string) => form.languageSelections.find((s) => s.name === name)?.level ?? null;

  const setPresetLangLevel = (name: string, level: CefrLevel) => {
    setForm((f) => {
      if (f.declaresNoLanguage) {
        return { ...f, declaresNoLanguage: false, languageSelections: [{ name, level }] };
      }
      const i = f.languageSelections.findIndex((s) => s.name === name);
      const next = [...f.languageSelections];
      if (i >= 0) {
        if (next[i].level === level) next.splice(i, 1);
        else next[i] = { name, level };
      } else {
        next.push({ name, level });
      }
      return { ...f, languageSelections: next, declaresNoLanguage: false };
    });
  };

  const toggleNoLanguage = () => {
    setForm((f) =>
      f.declaresNoLanguage
        ? { ...f, declaresNoLanguage: false }
        : { ...f, declaresNoLanguage: true, languageSelections: [] },
    );
    setShowOtherLangPanel(false);
  };

  const addOtherLanguage = () => {
    const raw = otherLangDraft.trim();
    if (!raw) return;
    const name = normalizeCustomLangLabel(raw) ?? raw;
    setForm((f) => {
      if (f.declaresNoLanguage) {
        return { ...f, declaresNoLanguage: false, languageSelections: [{ name, level: otherLangLevel }] };
      }
      if (f.languageSelections.some((s) => s.name.toLowerCase() === name.toLowerCase())) return f;
      return {
        ...f,
        languageSelections: [...f.languageSelections, { name, level: otherLangLevel }],
      };
    });
    setOtherLangDraft('');
    setShowOtherLangPanel(false);
  };

  const removeSelection = (name: string) => {
    setForm((f) => ({ ...f, languageSelections: f.languageSelections.filter((s) => s.name !== name) }));
  };

  const customSelections = form.languageSelections.filter(
    (s) => !(PRESET_LANGUAGE_LABELS as readonly string[]).includes(s.name),
  );

  const langsOk = form.declaresNoLanguage || form.languageSelections.length > 0;

  return (
    <div className="flex h-full flex-col">
      <TopBar onBack={onBack} />
      <ProgressBar screen={7} />
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
        <p className="mb-4" style={{ fontSize: 14, color: C.muted }}>
          Ish boshlash vaqtingizni tanlang — bu ma&apos;lumot profilingizga yoziladi.
        </p>
        <SectionLabel>Bandlik tayyorgarligi</SectionLabel>
        <div className="mb-6 mt-2 flex flex-col gap-2.5">
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

        <DesiredSalaryRangeBlock form={form} setForm={setForm} />

        <div className="mb-5 h-px w-full" style={{ backgroundColor: C.border }} aria-hidden />

        <SectionLabel>Til bilimi</SectionLabel>
        <p className="mb-3 mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
          Har bir til uchun darajani belgilang. «Boshqa til» bosilganda yozish maydoni ochiladi.
        </p>

        <div className="flex flex-col gap-4 pb-2">
          {PRESET_LANGUAGE_LABELS.map((lang) => (
            <div key={lang} className="rounded-[14px] px-3 py-2.5" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card2 }}>
              <p className="mb-2 font-medium" style={{ fontSize: 13, color: C.text }}>
                {lang}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CEFR_LEVELS.map((lvl) => {
                  const on = langLevel(lang) === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPresetLangLevel(lang, lvl)}
                      className="min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-xs font-semibold tabular-nums transition-all active:scale-95"
                      style={{
                        border: `1.5px solid ${on ? C.blue : C.border}`,
                        backgroundColor: on ? C.blueSelected : C.card,
                        color: on ? C.blueL : C.muted,
                      }}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleNoLanguage}
          className="mb-3 w-full rounded-[14px] py-3.5 text-center text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            border: `1.5px solid ${form.declaresNoLanguage ? C.blue : C.border}`,
            backgroundColor: form.declaresNoLanguage ? C.blueSelected : C.card,
            color: form.declaresNoLanguage ? C.blueL : C.muted,
          }}
        >
          {NO_LANGUAGE_LABEL}
        </button>

        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowOtherLangPanel((v) => !v)}
            className="w-full rounded-[14px] py-3.5 text-center text-sm font-semibold transition-all active:scale-[0.98]"
            style={{
              border: `1.5px solid ${showOtherLangPanel ? C.blue : C.border}`,
              backgroundColor: showOtherLangPanel ? C.blueSelected : C.card,
              color: showOtherLangPanel ? C.blueL : C.text,
            }}
          >
            Boshqa til {showOtherLangPanel ? '▼' : '▶'}
          </button>

          {showOtherLangPanel ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden rounded-[14px] px-3 py-3"
              style={{ border: `1px solid ${C.border}`, backgroundColor: C.card }}
            >
              <input
                type="text"
                placeholder="Til nomini yozing..."
                value={otherLangDraft}
                onChange={(e) => setOtherLangDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOtherLanguage();
                  }
                }}
                className="mb-3 w-full rounded-[12px] px-3 py-2.5 outline-none"
                style={{
                  border: `1.5px solid ${otherLangDraft.trim() ? C.blue : C.border}`,
                  backgroundColor: C.card2,
                  color: C.text,
                  fontSize: 14,
                }}
              />
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
                Daraja
              </p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {CEFR_LEVELS.map((lvl) => {
                  const on = otherLangLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setOtherLangLevel(lvl)}
                      className="min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-xs font-semibold tabular-nums"
                      style={{
                        border: `1.5px solid ${on ? C.blue : C.border}`,
                        backgroundColor: on ? C.blueSelected : C.card2,
                        color: on ? C.blueL : C.muted,
                      }}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addOtherLanguage}
                disabled={!otherLangDraft.trim()}
                className="w-full rounded-[12px] py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40"
                style={{
                  border: `1.5px solid ${C.blue}`,
                  backgroundColor: C.blueSelected,
                  color: C.blueL,
                }}
              >
                Qo‘shish
              </button>
            </motion.div>
          ) : null}
        </div>

        {customSelections.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {customSelections.map((s) => (
              <button
                key={`${s.name}-${s.level}`}
                type="button"
                onClick={() => removeSelection(s.name)}
                className="rounded-[10px] px-3 py-2 text-[13px] font-medium transition-all active:scale-95"
                style={{
                  border: `1.5px solid ${C.blue}`,
                  backgroundColor: C.blueSelected,
                  color: C.blueL,
                }}
                title="Olib tashlash"
              >
                {s.name} · {s.level} ×
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="px-5 pb-9 pt-4">
        <PrimaryButton onClick={onNext} disabled={!form.availability || !langsOk} loading={busy}>
          Arizani yuborish
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Home Screen (after apply) ────────────────────────────────────────────────

const AVAILABILITY_STATUS_UZ: Record<string, string> = {
  READY_NOW: 'Hozir tayyor',
  WITHIN_1_MONTH: '1 oy ichida',
  WITHIN_3_MONTHS: '3 oy ichida',
};

function formatPortalDateTime(raw: string): string {
  if (!raw || !raw.trim()) return '—';
  const t = raw.trim();
  try {
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
    }
  } catch {
    /* ignore */
  }
  return t;
}

function phoneTelHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '');
  const core = digits.startsWith('+') ? digits.slice(1) : digits;
  if (core.replace(/\D/g, '').length < 9) return null;
  return `tel:${digits.startsWith('+') ? digits : `+${core}`}`;
}

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
  const flag = countryFlagEmoji(u);
  const name = countryNameUz(u);
  return name ? `${flag} ${name}` : flag;
}

function profileStatusLabelUz(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return '—';
  const u = s.toUpperCase();
  const mapped = candidateProfileStatusUz[u];
  if (mapped) return mapped;
  if (u.includes('DRAFT')) return 'Qoralama';
  if (u.includes('SUBMIT')) return 'Yuborilgan';
  if (u.includes('REVIEW') || u.includes('PENDING')) return 'Ko‘rib chiqilmoqda';
  if (u.includes('APPROV')) return 'Tasdiqlangan';
  if (u.includes('REJECT')) return 'Rad etilgan';
  return s;
}

type ProfileCompletionSection = {
  key: string;
  labelUz: string;
  max: number;
  earned: number;
  color: string;
  isBonus?: boolean;
  icon: LucideIcon;
};

function personalInfoEarned(profile: Record<string, unknown> | null): number {
  if (!profile) return 0;
  let n = 0;
  if (displayNameFromProfile(profile) !== 'Nomzod') n += 1;
  if (pickStr(profile, 'phone_number', 'phoneNumber', 'phone', 'mobile')) n += 1;
  if (pickStr(profile, 'date_birth', 'dateBirth', 'birth_date', 'birthDate')) n += 1;
  if (pickStr(profile, 'education_level', 'educationLevel')) n += 1;
  return Math.min(20, n * 5);
}

function documentBonusEarned(profile: Record<string, unknown> | null): number {
  if (!profile) return 0;
  const docs = profile.documents;
  if (!Array.isArray(docs) || docs.length === 0) return 0;
  let verified = 0;
  for (const d of docs) {
    if (d && typeof d === 'object') {
      const o = d as Record<string, unknown>;
      if (o.verified === true || o.is_verified === true) verified += 1;
      else if (pickStr(o, 'status', 'verification_status', 'verificationStatus').toUpperCase() === 'VERIFIED') {
        verified += 1;
      }
    }
  }
  if (verified > 0) return 20;
  return 10;
}

function workExperiencesArray(profile: Record<string, unknown> | null): unknown[] {
  if (!profile) return [];
  const we = profile.work_experiences ?? profile.workExperiences;
  return Array.isArray(we) ? we : [];
}

function hasProfessionSignal(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false;
  if (
    !!pickStr(
      profile,
      'custom_profession_name',
      'customProfessionName',
      'profession_name',
      'professionName',
    )
  )
    return true;
  if ((pickNum(profile, 'profession_id', 'professionId') ?? 0) > 0) return true;
  for (const row of workExperiencesArray(profile)) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const o = row as Record<string, unknown>;
    if ((pickNum(o, 'profession_id', 'professionId') ?? 0) > 0) return true;
    if (!!pickStr(o, 'custom_profession_name', 'customProfessionName')) return true;
    if (!!pickStr(o, 'description')) return true;
  }
  return false;
}

function professionDisplayFromProfile(profile: Record<string, unknown> | null): string {
  if (!profile) return '';
  const top = pickStr(
    profile,
    'custom_profession_name',
    'customProfessionName',
    'profession_name',
    'professionName',
  );
  if (top) return top;
  const we = workExperiencesArray(profile);
  if (we.length === 0) return '';
  if (we.length === 1 && we[0] && typeof we[0] === 'object' && !Array.isArray(we[0])) {
    const o = we[0] as Record<string, unknown>;
    const d = pickStr(o, 'description');
    if (d) return d.length > 90 ? `${d.slice(0, 90)}…` : d;
  }
  return `${we.length} ta ish tajribasi bandi`;
}

function pickBackendProfilePct(profile: Record<string, unknown> | null): number | null {
  if (!profile) return null;
  const orderedKeys = [
    'profile_completeness',
    'profileCompleteness',
    'profile_score',
    'profileScore',
    'profile_completion_percent',
    'completion_percent',
    'profileStrength',
    'profile_strength',
    'completeness',
  ];
  for (const k of orderedKeys) {
    const v = pickNum(profile, k);
    if (v != null && v >= 0 && v <= 100) return Math.min(100, Math.round(v));
  }
  return null;
}

type ProfileCheckItem = { key: string; label: string; ok: boolean; optional?: boolean };

function profileChecklistItems(profile: Record<string, unknown> | null): ProfileCheckItem[] {
  if (!profile) return [];
  const langs = profile.languages ?? profile.candidate_languages ?? profile.candidateLanguages;
  const langsOk = Array.isArray(langs) && langs.length > 0;
  const tc = profile.target_countries ?? profile.targetCountries;
  const countriesOk = Array.isArray(tc) && tc.length > 0;
  const salMin = pickNum(profile, 'desired_salary_min', 'desiredSalaryMin', 'salary_min', 'salaryMin');
  const salMax = pickNum(profile, 'desired_salary_max', 'desiredSalaryMax', 'salary_max', 'salaryMax');
  const salaryOk = salMin != null && salMax != null;
  const weLen = workExperiencesArray(profile).length;
  const expOk =
    !!pickStr(profile, 'experience_range', 'experienceRange', 'experience') || weLen > 0;
  const hasRegion =
    (pickNum(profile, 'region_id', 'regionId') ?? 0) > 0 ||
    !!pickStr(profile, 'region_name_uz', 'regionNameUz', 'region_name', 'regionName', 'region');
  const consentRaw = profile.data_consent ?? profile.dataConsent;
  const consentOk = consentRaw === true;
  const educations = profile.educations;
  const eduOk = Array.isArray(educations) && educations.length > 0;
  const skills = profile.skills;
  const skillsOk = Array.isArray(skills) && skills.length > 0;
  const docs = profile.documents;
  const docsOk = Array.isArray(docs) && docs.length > 0;

  return [
    { key: 'phone', label: 'Telefon', ok: !!pickStr(profile, 'phone_number', 'phoneNumber', 'phone', 'mobile') },
    {
      key: 'name',
      label: 'Ism-familiya',
      ok: displayNameFromProfile(profile) !== 'Nomzod',
    },
    {
      key: 'birth',
      label: 'Tug‘ilgan sana',
      ok: !!pickStr(profile, 'date_birth', 'dateBirth', 'birth_date', 'birthDate'),
    },
    {
      key: 'edu',
      label: 'Ta’lim darajasi',
      ok: !!pickStr(profile, 'education_level', 'educationLevel'),
    },
    { key: 'region', label: 'Hudud', ok: hasRegion },
    { key: 'prof', label: 'Kasb / ish tajribasi', ok: hasProfessionSignal(profile) },
    { key: 'lang', label: 'Tillar', ok: langsOk },
    { key: 'countries', label: 'Maqsad mamlakatlar', ok: countriesOk },
    { key: 'salary', label: 'Maosh (min va max)', ok: salaryOk },
    { key: 'exp', label: 'Ish tajribasi (yoki bandlar)', ok: expOk },
    {
      key: 'avail',
      label: 'Ishga tayyorgarlik',
      ok: !!pickStr(profile, 'availability_status', 'availabilityStatus', 'availability'),
    },
    { key: 'consent', label: 'Ma’lumotlar bilan rozilik', ok: consentOk },
    { key: 'educations', label: 'Ta’limlar ro‘yxati', ok: eduOk, optional: true },
    { key: 'skills', label: 'Ko‘nikmalar', ok: skillsOk, optional: true },
    { key: 'docs', label: 'Hujjatlar', ok: docsOk, optional: true },
  ];
}

function summarizeProfileCompletion(profile: Record<string, unknown> | null): {
  sections: ProfileCompletionSection[];
  totalRounded: number;
} {
  if (!profile) return { sections: [], totalRounded: 0 };

  const professionEarned = hasProfessionSignal(profile) ? 20 : 0;

  const langs = profile.languages ?? profile.candidate_languages ?? profile.candidateLanguages;
  const langEarned = Array.isArray(langs) && langs.length > 0 ? 15 : 0;

  const tc = profile.target_countries ?? profile.targetCountries;
  const countryEarned =
    (Array.isArray(tc) && tc.length > 0) ||
    !!pickStr(profile, 'target_country_code', 'targetCountryCode', 'primary_target_country')
      ? 15
      : 0;

  const expEarned =
    pickStr(profile, 'experience_range', 'experienceRange', 'experience') || workExperiencesArray(profile).length > 0
      ? 10
      : 0;
  const availEarned = pickStr(profile, 'availability_status', 'availabilityStatus', 'availability')
    ? 10
    : 0;

  const salMin = pickNum(profile, 'desired_salary_min', 'desiredSalaryMin', 'salary_min', 'salaryMin');
  const salMax = pickNum(profile, 'desired_salary_max', 'desiredSalaryMax', 'salary_max', 'salaryMax');
  const salaryEarned =
    salMin != null && salMax != null ? 10 : salMin != null || salMax != null ? 5 : 0;

  const personalEarned = personalInfoEarned(profile);
  const docBonus = documentBonusEarned(profile);

  const sections: ProfileCompletionSection[] = [
    { key: 'profession', labelUz: 'Kasb', max: 20, earned: professionEarned, color: C.blue, icon: Briefcase },
    {
      key: 'personal',
      labelUz: 'Shaxsiy ma’lumot',
      max: 20,
      earned: personalEarned,
      color: '#2980B9',
      icon: User,
    },
    { key: 'languages', labelUz: 'Tillar', max: 15, earned: langEarned, color: C.green, icon: Languages },
    {
      key: 'countries',
      labelUz: 'Maqsad mamlakatlar',
      max: 15,
      earned: countryEarned,
      color: '#2ecc71',
      icon: Globe2,
    },
    {
      key: 'experience',
      labelUz: 'Ish tajribasi',
      max: 10,
      earned: expEarned,
      color: C.gold,
      icon: Building2,
    },
    {
      key: 'availability',
      labelUz: 'Ishga tayyorgarlik',
      max: 10,
      earned: availEarned,
      color: '#e67e22',
      icon: Clock,
    },
    {
      key: 'salary',
      labelUz: 'Maosh diapazoni',
      max: 10,
      earned: salaryEarned,
      color: '#e67e22',
      icon: CircleDollarSign,
    },
    {
      key: 'documents',
      labelUz: 'Tasdiqlangan hujjatlar',
      max: 20,
      earned: docBonus,
      color: '#9b59b6',
      isBonus: true,
      icon: FileCheck2,
    },
  ];

  const baseEarned = sections.filter((s) => !s.isBonus).reduce((a, s) => a + s.earned, 0);
  const bonusEarned = docBonus;
  const totalRounded = Math.min(100, Math.round(baseEarned + bonusEarned));

  return { sections, totalRounded };
}

function profileCompletionPct(profile: Record<string, unknown> | null): number {
  const api = pickBackendProfilePct(profile);
  if (api != null) return api;
  if (!profile) return 0;
  return summarizeProfileCompletion(profile).totalRounded;
}

function formatProfileDateOnly(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return '—';
  const d = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-');
    return `${day}.${m}.${y}`;
  }
  return s;
}

function formatWorkExperienceDuration(o: Record<string, unknown>): string {
  const y = pickNum(o, 'duration_years', 'durationYears') ?? 0;
  const mo = pickNum(o, 'duration_months', 'durationMonths') ?? 0;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} yil`);
  if (mo > 0) parts.push(`${mo} oy`);
  return parts.join(' ') || '—';
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
    type Row = { code: string; pr: number };
    const rows: Row[] = [];
    for (const item of tc) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const o = item as Record<string, unknown>;
        const code = pickStr(o, 'country_code', 'countryCode', 'code').toUpperCase();
        if (!code) continue;
        const pr = pickNum(o, 'priority') ?? 999;
        rows.push({ code, pr });
      } else if (item != null) {
        const code = String(item).trim().toUpperCase();
        if (code) rows.push({ code, pr: 999 });
      }
    }
    rows.sort((a, b) => a.pr - b.pr);
    const parts = rows.map((r) => {
      const name = countryNameUz(r.code);
      const flag = countryFlagEmoji(r.code);
      return name ? `${flag} ${name}` : flag;
    });
    return parts.join(', ') || '—';
  }
  const single = pickStr(profile, 'target_country_code', 'targetCountryCode', 'primary_target_country');
  if (single) {
    const u = single.toUpperCase();
    const name = countryNameUz(u);
    const flag = countryFlagEmoji(u);
    return name ? `${flag} ${name}` : flag;
  }
  return '—';
}

function targetCountryRows(profile: Record<string, unknown> | null): Array<{ code: string; pr: number }> {
  if (!profile) return [];
  const tc = profile.target_countries ?? profile.targetCountries;
  if (!Array.isArray(tc)) return [];
  type Row = { code: string; pr: number };
  const rows: Row[] = [];
  for (const item of tc) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      const code = pickStr(o, 'country_code', 'countryCode', 'code').toUpperCase();
      if (!code) continue;
      const pr = pickNum(o, 'priority') ?? 999;
      rows.push({ code, pr });
    } else if (item != null) {
      const code = String(item).trim().toUpperCase();
      if (code) rows.push({ code, pr: 999 });
    }
  }
  rows.sort((a, b) => a.pr - b.pr);
  return rows;
}

function languagesSummary(profile: Record<string, unknown> | null): string {
  if (!profile) return '—';
  const langs = profile.languages ?? profile.candidate_languages ?? profile.candidateLanguages;
  if (Array.isArray(langs) && langs.length) {
    const parts = langs.map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const o = item as Record<string, unknown>;
        const code = pickStr(o, 'language', 'language_code', 'languageCode', 'name');
        const level = pickStr(o, 'level', 'language_level', 'languageLevel');
        const label = code ? uzOrCode(adminLanguageUz, code.toUpperCase()) || code : '';
        if (!label) return '';
        if (level) return `${label} — ${uzOrCode(cefrLevelUz, level)}`;
        return label;
      }
      const s = String(item ?? '').trim();
      return s ? uzOrCode(adminLanguageUz, s.toUpperCase()) || s : '';
    });
    return parts.filter(Boolean).join(' · ') || '—';
  }
  const flat = pickStr(profile, 'languages');
  if (flat.includes(',')) {
    const parts = flat
      .split(',')
      .map((x) => uzOrCode(adminLanguageUz, x.trim().toUpperCase()))
      .filter(Boolean);
    return parts.length ? parts.join(' · ') : '—';
  }
  return '—';
}

function vacancyRowKey(v: PublicVacancyRow, idx: number): string {
  const id = v['id'] ?? v['uuid'] ?? v['vacancyId'] ?? v['vacancy_id'];
  if (id != null && String(id).length > 0) return String(id);
  return `vac-${idx}`;
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

function ProfileCompletenessPanel({ profile }: { profile: Record<string, unknown> | null }) {
  const { sections, totalRounded } = useMemo(() => summarizeProfileCompletion(profile), [profile]);
  const checklist = useMemo(() => profileChecklistItems(profile), [profile]);
  const backendPct = useMemo(() => pickBackendProfilePct(profile), [profile]);
  const headline = backendPct ?? totalRounded;
  const required = checklist.filter((i) => !i.optional);
  const reqDone = required.filter((i) => i.ok).length;

  return (
    <div
      className="mt-5 rounded-[20px] border p-4 sm:p-5"
      style={{ backgroundColor: C.card2, borderColor: C.border }}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
            }}
          >
            Profil to‘ldirilganligi
          </p>
          <p
            className="mt-1"
            style={{
              fontSize: 'clamp(1.75rem, 6vw, 2.25rem)',
              fontWeight: 900,
              color: C.text,
              letterSpacing: '-0.5px',
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          >
            {headline}%
          </p>
          {backendPct != null ? (
            <p className="mt-1 max-w-[280px] text-[11px] leading-snug" style={{ color: C.muted }}>
              Foiz serverdagi <span className="font-medium" style={{ color: C.blueL }}>profile_completeness</span> /{' '}
              <span className="font-medium" style={{ color: C.blueL }}>profile_score</span> maydoniga asoslangan.
            </p>
          ) : (
            <p className="mt-1 max-w-[280px] text-[11px] leading-snug" style={{ color: C.muted }}>
              Server foizi yo‘q — taxminiy hisob ishlatilmoqda.
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[12px] font-semibold tabular-nums" style={{ color: C.text }}>
            {reqDone}/{required.length}
          </p>
          <p className="text-[11px]" style={{ color: C.muted }}>
            asosiy band
          </p>
        </div>
      </div>

      <div
        className="mb-3 flex justify-between px-1 text-[10px] font-medium"
        style={{ color: C.muted }}
        aria-hidden
      >
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
      <div className="mb-5 h-2 overflow-hidden rounded-full" style={{ backgroundColor: `${C.border}88` }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${headline}%`,
            background: `linear-gradient(90deg, ${C.blue}, #2980B9)`,
            boxShadow: headline > 0 ? `0 0 12px ${C.blue}55` : undefined,
          }}
        />
      </div>

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
        Tekshiruv ro‘yxati
      </p>
      <div className="mb-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {checklist.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-2 rounded-xl border px-2.5 py-2"
            style={{
              borderColor: item.ok ? `${C.green}44` : C.border,
              backgroundColor: item.ok ? `${C.green}0d` : 'transparent',
              opacity: item.optional && !item.ok ? 0.85 : 1,
            }}
          >
            {item.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" color={C.green} strokeWidth={2} aria-hidden />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0" color={C.muted} strokeWidth={2} aria-hidden />
            )}
            <span className="min-w-0 text-[13px] leading-snug" style={{ color: C.text }}>
              {item.label}
              {item.optional ? (
                <span className="ml-1 text-[10px] font-medium" style={{ color: C.muted }}>
                  (ixtiyoriy)
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>

      <details className="group rounded-xl border" style={{ borderColor: C.border, backgroundColor: `${C.card}66` }}>
        <summary
          className="cursor-pointer list-none px-3 py-2.5 text-[12px] font-semibold outline-none marker:content-none [&::-webkit-details-marker]:hidden"
          style={{ color: C.blueL }}
        >
          Bo‘limlar bo‘yicha taxminiy ulush
        </summary>
        <div className="flex flex-col gap-3 border-t px-3 py-3" style={{ borderColor: C.border }}>
          {sections.map((s) => {
            const Icon = s.icon;
            const fillPct = s.max > 0 ? Math.min(100, Math.round((s.earned / s.max) * 100)) : 0;
            const sub: ReactNode = s.isBonus ? (
              <span style={{ fontSize: 10, color: '#9b59b6' }}>+ bonus</span>
            ) : null;
            return (
              <div key={s.key} className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${s.color}22`, border: `1px solid ${s.color}44` }}
                >
                  <Icon size={18} color={s.color} strokeWidth={2} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-1">
                    <span className="text-[13px] font-semibold leading-tight" style={{ color: C.text }}>
                      {s.labelUz}
                    </span>
                    <span className="shrink-0 tabular-nums text-[12px] font-bold" style={{ color: s.color }}>
                      {s.earned}/{s.max}
                      {sub ? <span className="ml-1 font-normal">{sub}</span> : null}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: `${C.border}88` }}>
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: s.color,
                        boxShadow: fillPct > 0 ? `0 0 10px ${s.color}55` : undefined,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function CandidateProfileUnifiedForm({
  profile,
  onSaved,
}: {
  profile: Record<string, unknown> | null;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [marital, setMarital] = useState('SINGLE');
  const [edu, setEdu] = useState('BACHELOR');
  const [avail, setAvail] = useState('WITHIN_3_MONTHS');
  const [exp, setExp] = useState('YEAR_1_3');
  const [salMin, setSalMin] = useState(SALARY_EUR_DEFAULT_MIN);
  const [salMax, setSalMax] = useState(SALARY_EUR_DEFAULT_MAX);
  const [salCur, setSalCur] = useState('EUR');
  const [consent, setConsent] = useState(true);
  const [regionSelect, setRegionSelect] = useState<number | ''>('');
  const [customProf, setCustomProf] = useState('');

  const applyServerToDraft = useCallback(() => {
    if (!profile) return;
    setMarital(pickStr(profile, 'marital_status', 'maritalStatus') || 'SINGLE');
    setEdu(educationLevelToFormValue(pickStr(profile, 'education_level', 'educationLevel')));
    setAvail(pickStr(profile, 'availability_status', 'availabilityStatus') || 'WITHIN_3_MONTHS');
    setExp(pickStr(profile, 'experience_range', 'experienceRange') || 'YEAR_1_3');
    setSalMin(pickNum(profile, 'desired_salary_min', 'desiredSalaryMin') ?? SALARY_EUR_DEFAULT_MIN);
    setSalMax(pickNum(profile, 'desired_salary_max', 'desiredSalaryMax') ?? SALARY_EUR_DEFAULT_MAX);
    setSalCur(pickStr(profile, 'salary_currency', 'salaryCurrency') || 'EUR');
    setConsent(profile.data_consent === true || profile.dataConsent === true);
    const rid = normalizeCandidateRegionId(pickNum(profile, 'region_id', 'regionId'));
    setRegionSelect(rid ?? '');
    setCustomProf(pickStr(profile, 'custom_profession_name', 'customProfessionName'));
  }, [profile]);

  useEffect(() => {
    applyServerToDraft();
  }, [applyServerToDraft]);

  if (!profile) return null;

  const availabilityKeys = (() => {
    const cur = pickStr(profile, 'availability_status', 'availabilityStatus');
    const set = new Set<string>(Object.keys(AVAILABILITY_STATUS_UZ));
    if (cur) set.add(cur);
    return [...set];
  })();
  const experienceKeys = (() => {
    const cur = pickStr(profile, 'experience_range', 'experienceRange');
    const set = new Set<string>(Object.keys(experienceRangeUz));
    if (cur) set.add(cur);
    return [...set];
  })();

  const statusUzLocal = profileStatusLabelUz(
    pickStr(profile, 'profile_status', 'profileStatus', 'status', 'application_status', 'applicationStatus'),
  );
  const displayNameLocal = displayNameFromProfile(profile);
  const phoneLocal = pickStr(profile, 'phone_number', 'phoneNumber', 'phone', 'mobile') || '—';
  const birthLocal = formatProfileDateOnly(
    pickStr(profile, 'date_birth', 'dateBirth', 'birth_date', 'birthDate'),
  );
  const regionLocal =
    pickStr(profile, 'region_name_uz', 'regionNameUz', 'region_name', 'regionName', 'region') || '—';
  const countriesLocal = targetCountriesSummary(profile);
  const langsLocal = languagesSummary(profile);
  const professionLocal = professionDisplayFromProfile(profile) || '—';
  const consentRo =
    profile.data_consent === true || profile.dataConsent === true ? 'Berilgan' : 'Berilmagan / —';
  const consentTime = formatPortalDateTime(pickStr(profile, 'data_consent_at', 'dataConsentAt'));
  const createdLocal = formatPortalDateTime(pickStr(profile, 'created_at', 'createdAt', 'created'));
  const updatedLocal = formatPortalDateTime(pickStr(profile, 'updated_at', 'updatedAt', 'updated'));

  const ctl =
    'mt-1.5 box-border min-h-[50px] w-full rounded-[14px] border px-3.5 py-2.5 text-[15px] outline-none transition-[box-shadow,border-color] focus:border-[#2980B9] focus:shadow-[0_0_0_3px_rgba(27,79,138,0.22)]';
  const fieldStyle: CSSProperties = {
    borderColor: C.border,
    backgroundColor: C.card2,
    color: C.text,
    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
  };
  const roStyle: CSSProperties = { ...fieldStyle, opacity: 0.92, cursor: 'default' };

  const save = async () => {
    if (salMin > salMax) {
      toast.error('Minimal maosh maksimaldan katta bo‘lmasligi kerak.');
      return;
    }
    setBusy(true);
    try {
      const body: CandidateProfileUpdateBody = {
        marital_status: marital,
        education_level: edu,
        data_consent: consent,
        availability_status: avail,
        experience_range: exp,
        desired_salary_min: salMin,
        desired_salary_max: salMax,
        salary_currency: salCur,
      };
      if (regionSelect !== '') {
        const rid = normalizeCandidateRegionId(regionSelect);
        if (rid == null) {
          toast.error('Hududni ro‘yxatdan tanlang.');
          setBusy(false);
          return;
        }
        body.region_id = rid;
      }
      const pid = pickNum(profile, 'profession_id', 'professionId');
      const pcid = pickNum(profile, 'profession_category_id', 'professionCategoryId');
      if (pid != null && pid > 0) body.profession_id = pid;
      if (pcid != null && pcid > 0) body.profession_category_id = pcid;
      if (customProf.trim()) body.custom_profession_name = customProf.trim();

      await candidateUpdateProfile(body);
      toast.success('Profil yangilandi.');
      onSaved();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Profilni saqlashda xato.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-[22px] border p-4 sm:p-5"
      style={{
        backgroundColor: C.card,
        borderColor: C.border,
        boxShadow: '0 14px 42px rgba(0,0,0,0.32), inset 0 1px 0 rgba(127,195,255,0.07)',
      }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${C.blue}22`, border: `1px solid ${C.blue}55` }}
          >
            <Pencil size={18} color={C.blueL} strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0">
            <h3
              className="leading-tight"
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: C.text,
                fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
              }}
            >
              Ma’lumotlarim
            </h3>
            <p className="mt-1 max-w-[320px] text-[12px] leading-snug" style={{ color: C.muted }}>
              Yuqorida serverdan kelgan qiymatlar (ko‘rish). Pastda anketa bo‘limini o‘zgartirib, saqlang.
            </p>
          </div>
        </div>
      </div>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>
        Ko‘rish rejimi
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Holat
          </span>
          <input readOnly className={ctl} style={roStyle} value={statusUzLocal} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            To‘liq ism
          </span>
          <input readOnly className={ctl} style={roStyle} value={displayNameLocal} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Telefon
          </span>
          <input readOnly className={ctl} style={roStyle} value={phoneLocal} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Tug‘ilgan sana
          </span>
          <input readOnly className={ctl} style={roStyle} value={birthLocal} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Hudud (nom)
          </span>
          <input readOnly className={ctl} style={roStyle} value={regionLocal} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Kasb / ish tajribasi (qisqa)
          </span>
          <input readOnly className={ctl} style={roStyle} value={professionLocal} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Maqsad davlatlar
          </span>
          <input readOnly className={ctl} style={roStyle} value={countriesLocal} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Tillar
          </span>
          <input readOnly className={ctl} style={roStyle} value={langsLocal} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Rozilik
          </span>
          <input readOnly className={ctl} style={roStyle} value={consentRo} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Rozilik vaqti
          </span>
          <input readOnly className={ctl} style={roStyle} value={consentTime} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Yaratilgan
          </span>
          <input readOnly className={ctl} style={roStyle} value={createdLocal} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Yangilangan
          </span>
          <input readOnly className={ctl} style={roStyle} value={updatedLocal} />
        </label>
      </div>

      <div
        className="my-5 h-px w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${C.border}, transparent)` }}
        aria-hidden
      />

      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.blueL }}>
        Tahrirlash
      </p>
      <div className="flex flex-col gap-3.5">
        <label className="block">
          <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
            Oilaviy holat
          </span>
          <select className={ctl} style={fieldStyle} value={marital} onChange={(e) => setMarital(e.target.value)}>
            {Object.keys(maritalStatusUz).map((k) => (
              <option key={k} value={k}>
                {maritalStatusUz[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
            Ta’lim darajasi
          </span>
          <select className={ctl} style={fieldStyle} value={edu} onChange={(e) => setEdu(e.target.value)}>
            {EDUCATION_LEVEL_SELECT_ORDER.map((k) => (
              <option key={k} value={k}>
                {educationLevelUz[k] ?? k}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
            Ishga tayyorgarlik
          </span>
          <select className={ctl} style={fieldStyle} value={avail} onChange={(e) => setAvail(e.target.value)}>
            {availabilityKeys.map((k) => (
              <option key={k} value={k}>
                {AVAILABILITY_STATUS_UZ[k] ?? k}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
            Ish tajribasi (oraliq)
          </span>
          <select className={ctl} style={fieldStyle} value={exp} onChange={(e) => setExp(e.target.value)}>
            {experienceKeys.map((k) => (
              <option key={k} value={k}>
                {experienceRangeUz[k] ?? k}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
              Maosh min
            </span>
            <input
              type="number"
              className={ctl}
              style={fieldStyle}
              value={salMin}
              min={SALARY_EUR_MIN_BOUND}
              max={SALARY_EUR_MAX_BOUND}
              step={SALARY_EUR_STEP}
              onChange={(e) => setSalMin(Number(e.target.value) || 0)}
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
              Maosh max
            </span>
            <input
              type="number"
              className={ctl}
              style={fieldStyle}
              value={salMax}
              min={SALARY_EUR_MIN_BOUND}
              max={SALARY_EUR_MAX_BOUND}
              step={SALARY_EUR_STEP}
              onChange={(e) => setSalMax(Number(e.target.value) || 0)}
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
            Valyuta
          </span>
          <input
            type="text"
            className={ctl}
            style={fieldStyle}
            value={salCur}
            onChange={(e) => setSalCur(e.target.value.toUpperCase().slice(0, 8))}
            maxLength={8}
            placeholder="EUR"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
            Hudud
          </span>
          <select
            className={ctl}
            style={fieldStyle}
            value={regionSelect === '' ? '' : String(regionSelect)}
            onChange={(e) => {
              const v = e.target.value;
              setRegionSelect(v ? Number(v) : '');
            }}
          >
            <option value="">Tanlang (ixtiyoriy)</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
            Maxsus kasb nomi (ixtiyoriy)
          </span>
          <input
            type="text"
            className={ctl}
            style={fieldStyle}
            value={customProf}
            onChange={(e) => setCustomProf(e.target.value)}
            placeholder="Agar kasb ro‘yxatdan tashqari bo‘lsa"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border px-3 py-3" style={{ borderColor: C.border, backgroundColor: C.card2 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="h-4 w-4 shrink-0 accent-[#2980B9]" />
          <span className="text-[13px] leading-snug" style={{ color: C.text }}>
            Ma’lumotlardan foydalanishga roziman
          </span>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={() => applyServerToDraft()}
          disabled={busy}
          className="flex h-12 min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-[14px] border px-4 text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ borderColor: C.border, color: C.blueL, backgroundColor: 'transparent' }}
        >
          <Undo2 size={16} strokeWidth={2} aria-hidden />
          Bekor qilish
        </button>
        <div className="min-w-0 flex-1 sm:max-w-[280px]">
          <PrimaryButton loading={busy} onClick={() => void save()} disabled={busy}>
            O‘zgarishlarni saqlash
          </PrimaryButton>
        </div>
      </div>
    </div>
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
  const profession = professionDisplayFromProfile(profile);
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
  const createdFmt = formatPortalDateTime(created);
  const updatedFmt = formatPortalDateTime(updated);
  const region = pickStr(profile, 'region_name_uz', 'regionNameUz', 'region_name', 'regionName', 'region');
  const marital = pickStr(profile, 'marital_status', 'maritalStatus');
  const maritalUz = marital ? uzOrCode(maritalStatusUz, marital) : '';
  const consentRaw = profile?.data_consent ?? profile?.dataConsent;
  const consentTxt =
    typeof consentRaw === 'boolean' ? (consentRaw ? 'Berilgan' : 'Berilmagan') : '—';
  const experienceUz = experience ? uzOrCode(experienceRangeUz, experience) || experience : '';
  const availabilityUz = availability
    ? AVAILABILITY_STATUS_UZ[availability] ?? availability
    : '';
  const eduUz = edu ? uzOrCode(educationLevelUz, edu) || edu : '';

  const dateBirthRaw = pickStr(profile, 'date_birth', 'dateBirth', 'birth_date', 'birthDate');
  const dateBirthFmt = formatProfileDateOnly(dateBirthRaw);
  const consentAtRaw = pickStr(profile, 'data_consent_at', 'dataConsentAt');
  const consentAtFmt = formatPortalDateTime(consentAtRaw);
  const tcRows = targetCountryRows(profile);
  const hasRegionField =
    (pickNum(profile, 'region_id', 'regionId') ?? 0) > 0 ||
    !!pickStr(profile, 'region_name_uz', 'regionNameUz', 'region_name', 'regionName', 'region');

  const agentRaw = profile?.assigned_agent ?? profile?.agent ?? profile?.assignedAgent;
  let agentName = '';
  let agentPhone = '';
  if (agentRaw && typeof agentRaw === 'object') {
    const ag = agentRaw as Record<string, unknown>;
    agentName = displayNameFromProfile(ag);
    agentPhone = pickStr(ag, 'phone_number', 'phoneNumber', 'phone', 'mobile');
  }
  if (!agentName) agentName = pickStr(profile, 'agent_name', 'agentName', 'assigned_agent_name', 'assignedAgentName');
  const agentCallHref = agentPhone ? phoneTelHref(agentPhone) : null;

  const hasCountries = countries !== '—' && countries.length > 0;
  const hasLangs = langs !== '—' && langs.length > 0;
  const docCount = Array.isArray(profile?.documents) ? (profile!.documents as unknown[]).length : null;
  const weList = workExperiencesArray(profile);
  const hasWorkExpChip = !!experience || weList.length > 0;
  const workExpSummary =
    weList.length === 0
      ? ''
      : weList
          .map((row, i) => {
            if (!row || typeof row !== 'object') return '';
            const o = row as Record<string, unknown>;
            const d = pickStr(o, 'description');
            const dur = formatWorkExperienceDuration(o);
            const bits = [dur !== '—' ? dur : '', d].filter(Boolean);
            return bits.join(' — ') || `Band ${i + 1}`;
          })
          .filter(Boolean)
          .join(' · ');

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
              {pickBackendProfilePct(profile) != null ? (
                <p className="mt-1 max-w-[260px] text-[11px] leading-snug" style={{ color: C.muted }}>
                  Foiz serverdagi <span style={{ color: C.blueL }}>profile_completeness</span> /{' '}
                  <span style={{ color: C.blueL }}>profile_score</span> bilan uyg‘unlashtirilgan.
                </p>
              ) : null}
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
              [!!profession, '✓ Kasb / tajriba', '+ Kasb / tajriba'],
              [hasCountries, '✓ Mamlakat', '+ Mamlakat'],
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
              [hasRegionField, '✓ Hudud', '+ Hudud'],
              [!!availabilityUz, '✓ Tayyorgarlik', '+ Tayyorgarlik'],
              [salaryMin != null && salaryMax != null, '✓ Maosh', '+ Maosh'],
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
              [hasWorkExpChip, '✓ Tajriba', '+ Tajriba'],
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
            {agentCallHref ? (
              <a
                href={agentCallHref}
                className="flex shrink-0 items-center justify-center gap-1.5 self-stretch rounded-[10px] px-3.5 py-2.5 transition-all active:scale-95 min-[400px]:self-auto"
                style={{ border: `1px solid ${C.blue}`, fontSize: 12, fontWeight: 600, color: C.blue, backgroundColor: 'transparent' }}
              >
                <MessageCircle size={14} color={C.blue} />
                Qo‘ng‘iroq
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Agent telefoni ko‘rinmayapti"
                className="flex shrink-0 cursor-not-allowed items-center justify-center gap-1.5 self-stretch rounded-[10px] px-3.5 py-2.5 opacity-50 min-[400px]:self-auto"
                style={{ border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.muted, backgroundColor: 'transparent' }}
              >
                <MessageCircle size={14} color={C.muted} />
                Qo‘ng‘iroq
              </button>
            )}
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
                onClick={() => toast('Tanlanganlar tez orada mavjud bo‘ladi.', { duration: 2200 })}
                className="flex h-11 w-full shrink-0 items-center justify-center rounded-[12px] transition-all active:scale-95 sm:w-11"
                style={{ border: `1px solid ${C.border}`, backgroundColor: 'transparent' }}
                aria-label="Keyinroq saqlash"
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
                <div key={vacancyRowKey(v, idx)} className="rounded-2xl border p-4" style={{ backgroundColor: C.card, borderColor: C.border }}>
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
          <ProfileInfoRow label="Profil to‘ldirish" value={`${pct}%`} />
          <ProfileInfoRow label="Telefon" value={phone} />
          <ProfileInfoRow label="Tug‘ilgan sana" value={dateBirthFmt} />
          <ProfileInfoRow label="Oilaviy holat" value={maritalUz || '—'} />
          <ProfileInfoRow label="Hudud" value={region || '—'} />
          <ProfileInfoRow label="Kasb / ish tajribasi" value={profession || '—'} />
          <ProfileInfoRow label="Ish tajribasi (bandlar)" value={workExpSummary || '—'} />
          <ProfileInfoRow label="Ta’lim darajasi" value={eduUz || '—'} />
          <ProfileInfoRow label="Ish tajribasi (oraliq)" value={experienceUz || '—'} />
          <ProfileInfoRow label="Ishga tayyorgarlik" value={availabilityUz || '—'} />
          <ProfileInfoRow label="Tillar" value={langs} />
          <ProfileInfoRow label="Maqsad maosh" value={salaryTxt} />
          <ProfileInfoRow label="Maqsad davlatlar" value={countries} />
          <ProfileInfoRow label="Ma’lumotlardan foydalanish" value={consentTxt} />
          <ProfileInfoRow label="Rozilik vaqti" value={consentAtFmt} />
          <ProfileInfoRow label="Yaratilgan" value={createdFmt} />
          <ProfileInfoRow label="Yangilangan" value={updatedFmt} />
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
              Profil kuchi
            </p>
            <p
              className="mt-0.5 text-[clamp(1.5rem,5vw,1.85rem)] font-black tabular-nums"
              style={{ color: C.text, fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}
            >
              {pct}%
            </p>
          </div>
          <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
            <CircleProgress pct={pct} size={52} />
            <span className="absolute text-[11px] font-bold" style={{ color: C.text }}>
              {pct}
            </span>
          </div>
        </div>
        <CandidateProfileUnifiedForm profile={profile} onSaved={() => void refresh()} />

        <div
          className="mt-4 rounded-[18px] border p-4"
          style={{ backgroundColor: C.card, borderColor: C.border }}
        >
          <p
            className="mb-3"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Maqsad mamlakatlar
          </p>
          {tcRows.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tcRows.map((r) => {
                const name = countryNameUz(r.code);
                const flag = countryFlagEmoji(r.code);
                const label = name ? `${flag} ${name}` : flag || r.code;
                return (
                  <span
                    key={`${r.code}-${r.pr}`}
                    className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ backgroundColor: C.blueGlow, border: `1px solid ${C.border}`, color: C.text }}
                  >
                    <span style={{ color: C.muted }} className="mr-1.5 text-[10px]">
                      #{r.pr}
                    </span>
                    {label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
              Hozircha maqsad mamlakat tanlanmagan.
            </p>
          )}
        </div>

        <div
          className="mt-4 rounded-[18px] border p-4"
          style={{ backgroundColor: C.card, borderColor: C.border }}
        >
          <p
            className="mb-3"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Ish tajribasi bandlari
          </p>
          {weList.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {weList.map((row, i) => {
                if (!row || typeof row !== 'object') return null;
                const o = row as Record<string, unknown>;
                const desc = pickStr(o, 'description');
                const dur = formatWorkExperienceDuration(o);
                const pid = pickNum(o, 'profession_id', 'professionId');
                const cid = pickNum(o, 'profession_category_id', 'professionCategoryId');
                const metaBits: string[] = [];
                if (cid != null) metaBits.push(`Kategoriya #${cid}`);
                if (pid != null) metaBits.push(`Kasb #${pid}`);
                const meta = metaBits.join(' · ');
                return (
                  <div
                    key={pickStr(o, 'id') || `we-${i}`}
                    className="rounded-xl border px-3 py-2.5"
                    style={{ borderColor: C.border, backgroundColor: C.card2 }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{dur}</p>
                    {desc ? (
                      <p className="mt-1 text-[13px] leading-snug" style={{ color: C.text }}>
                        {desc}
                      </p>
                    ) : null}
                    {meta ? (
                      <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
                        {meta}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
              Hozircha ish joylari kiritilmagan.
            </p>
          )}
        </div>

        <div
          className="mt-4 rounded-[18px] border p-4"
          style={{ backgroundColor: C.card, borderColor: C.border }}
        >
          <p
            className="mb-3"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Tillar
          </p>
          {profile &&
          Array.isArray(profile.languages ?? profile.candidate_languages ?? profile.candidateLanguages) &&
          (profile.languages ?? profile.candidate_languages ?? profile.candidateLanguages) &&
          ((profile.languages ?? profile.candidate_languages ?? profile.candidateLanguages) as unknown[]).length >
            0 ? (
            <div className="flex flex-col gap-2">
              {(
                (profile.languages ??
                  profile.candidate_languages ??
                  profile.candidateLanguages) as unknown[]
              ).map((item, i) => {
                if (!item || typeof item !== 'object') return null;
                const o = item as Record<string, unknown>;
                const code = pickStr(o, 'language', 'language_code', 'languageCode', 'name');
                const level = pickStr(o, 'level', 'language_level', 'languageLevel');
                const cert =
                  o.has_certificate === true ||
                  o.hasCertificate === true ||
                  pickStr(o, 'certificate', 'has_certificate') === 'true';
                const label = code ? uzOrCode(adminLanguageUz, code.toUpperCase()) || code : 'Til';
                const levelUz = level ? uzOrCode(cefrLevelUz, level) || level : '';
                return (
                  <div
                    key={pickStr(o, 'id') || `lang-${i}`}
                    className="flex flex-col gap-1 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: C.border, backgroundColor: C.card2 }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</p>
                      {levelUz ? (
                        <p className="text-[12px]" style={{ color: C.muted }}>
                          Daraja: {levelUz}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold"
                      style={{
                        backgroundColor: cert ? `${C.green}22` : C.border,
                        color: cert ? C.green : C.muted,
                      }}
                    >
                      {cert ? 'Sertifikat bor' : 'Sertifikat yo‘q'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
              Hozircha tillar ro‘yxati bo‘sh.
            </p>
          )}
        </div>

        <div
          className="mt-4 rounded-[18px] border p-4"
          style={{ backgroundColor: C.card, borderColor: C.border }}
        >
          <p
            className="mb-3"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Ta’lim
          </p>
          {profile && Array.isArray(profile.educations) && (profile.educations as unknown[]).length > 0 ? (
            <div className="flex flex-col gap-3">
              {(profile.educations as unknown[]).map((ed, i) => {
                const E = ed as Record<string, unknown>;
                const spec = pickStr(E, 'specialty');
                const inst = pickStr(E, 'institution_name', 'institutionName');
                const yr = pickNum(E, 'graduation_year', 'graduationYear');
                const lv = pickStr(E, 'level');
                const ctry = pickStr(E, 'country');
                const title = spec || inst || 'Ta’lim';
                const bits: string[] = [];
                if (inst && inst !== spec) bits.push(inst);
                if (lv) bits.push(uzOrCode(educationLevelUz, lv));
                if (yr != null) bits.push(String(yr));
                if (ctry) {
                  const fl = countryFlagEmoji(ctry);
                  const nm = countryNameUz(ctry) ?? '';
                  bits.push(nm ? `${fl} ${nm}` : fl);
                }
                const sub = bits.join(' · ');
                return (
                  <div
                    key={`ed-${i}`}
                    className="rounded-xl border px-3 py-2.5"
                    style={{ borderColor: C.border, backgroundColor: C.card2 }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</p>
                    {sub ? (
                      <p className="mt-1 text-[13px] leading-snug" style={{ color: C.muted }}>
                        {sub}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
              Hozircha ta’limlar ro‘yxati bo‘sh.
            </p>
          )}
        </div>

        <div
          className="mt-4 rounded-[18px] border p-4"
          style={{ backgroundColor: C.card, borderColor: C.border }}
        >
          <p
            className="mb-3"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Hujjatlar
          </p>
          {profile && Array.isArray(profile.documents) && (profile.documents as unknown[]).length > 0 ? (
            <div className="flex flex-col gap-2">
              {(profile.documents as unknown[]).map((doc, i) => {
                const D = doc as Record<string, unknown>;
                const dtype = pickStr(D, 'document_type', 'documentType');
                const fname = pickStr(D, 'file_name', 'fileName');
                const url = pickStr(D, 'file_url', 'fileUrl');
                const verified =
                  D.is_verified === true ||
                  D.verified === true ||
                  pickStr(D, 'status').toUpperCase() === 'VERIFIED';
                const typeUz = dtype ? uzOrCode(documentTypeUz, dtype) : '';
                const line = typeUz || fname || 'Hujjat';
                return (
                  <div
                    key={`doc-${i}`}
                    className="flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: C.border, backgroundColor: C.card2 }}
                  >
                    <div className="min-w-0">
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{line}</p>
                      {fname && typeUz ? (
                        <p className="truncate text-[12px]" style={{ color: C.muted }}>
                          {fname}
                        </p>
                      ) : null}
                      <p className="text-[11px]" style={{ color: verified ? C.green : C.muted }}>
                        {verified ? 'Tasdiqlangan' : 'Tekshiruvda / tasdiqlanmagan'}
                      </p>
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg px-3 py-1.5 text-center text-[12px] font-semibold"
                        style={{ border: `1px solid ${C.blue}`, color: C.blue }}
                      >
                        Ochish
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
              Hozircha yuklangan hujjat yo‘q.
            </p>
          )}
        </div>

        <div
          className="mt-4 rounded-[18px] border p-4"
          style={{ backgroundColor: C.card, borderColor: C.border }}
        >
          <p
            className="mb-3"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Ko‘nikmalar
          </p>
          {profile && Array.isArray(profile.skills) && (profile.skills as unknown[]).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(profile.skills as unknown[]).map((sk, i) => {
                const S = sk as Record<string, unknown>;
                const nm = pickStr(S, 'skill_name', 'skillName', 'name');
                if (!nm) return null;
                return (
                  <span
                    key={`sk-${i}`}
                    className="rounded-full px-3 py-1 text-[12px] font-medium"
                    style={{ backgroundColor: C.blueGlow, border: `1px solid ${C.border}`, color: C.text }}
                  >
                    {nm}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
              Hozircha ko‘nikmalar kiritilmagan.
            </p>
          )}
        </div>
        <ProfileCompletenessPanel profile={profile} />
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
  const [sessionBootstrapped, setSessionBootstrapped] = useState(false);

  const [form, setForm] = useState<FormState>({
    phoneNational: '',
    otp: emptyOtpSlots(),
    workProfessionCategoryId: null,
    workProfessionId: null,
    workIsOtherProfession: false,
    workCustomProfessionName: '',
    workExperienceYears: null,
    workExperienceEntries: [],
    countries: [],
    availability: null,
    languageSelections: [],
    declaresNoLanguage: false,
    desiredSalaryMin: SALARY_EUR_DEFAULT_MIN,
    desiredSalaryMax: SALARY_EUR_DEFAULT_MAX,
    profileFirstName: '',
    profileLastName: '',
    profileGender: 'ERKAK',
    profileDateBirth: '2000-01-01',
  });
  const [smsNoticeScreen2, setSmsNoticeScreen2] = useState<SmsInlineNotice>(null);
  const [smsNoticeScreen3, setSmsNoticeScreen3] = useState<SmsInlineNotice>(null);
  const [profileNoticeScreen4, setProfileNoticeScreen4] = useState<SmsInlineNotice>(null);

  useEffect(() => {
    setSmsNoticeScreen2((prev) => (prev?.variant === 'error' ? null : prev));
  }, [form.phoneNational]);

  useEffect(() => {
    setSmsNoticeScreen3((prev) => (prev?.variant === 'error' ? null : prev));
  }, [form.otp.join('')]);

  useEffect(() => {
    setProfileNoticeScreen4((prev) => (prev?.variant === 'error' ? null : prev));
  }, [form.profileFirstName, form.profileLastName, form.profileGender, form.profileDateBirth]);

  useLayoutEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ok = await candidateTryResumeSession();
        if (!cancelled && ok) {
          setHomeInitialTab(3);
          setView('home');
        }
      } finally {
        if (!cancelled) setSessionBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const goNext = () => setScreen((s) => (Math.min(s + 1, 7) as Screen));
  const goBack = () => setScreen((s) => (Math.max(s - 1, 1) as Screen));

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

  async function savePersonalProfileAndNext() {
    if (!form.profileFirstName.trim() || !form.profileLastName.trim()) {
      setProfileNoticeScreen4({ variant: 'error', text: 'Ism va familiyani kiriting.' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.profileDateBirth)) {
      setProfileNoticeScreen4({ variant: 'error', text: 'Tug‘ilgan sanani tanlang.' });
      return;
    }
    if (!phoneE164) {
      setProfileNoticeScreen4({ variant: 'error', text: 'Telefon raqami topilmadi. OTP qayta o‘ting.' });
      return;
    }

    const fromTg = isTelegramMiniApp() ? miniAppChatId : '';
    const cid = (trimmedTg || fromTg).trim();
    const telegramChatId =
      cid && /^-?\d+$/.test(cid)
        ? Number(cid)
        : syntheticTelegramChatId({ otpCode: form.otp.join('').trim() });

    setBusy(true);
    setProfileNoticeScreen4(null);
    try {
      await candidateUpdateMyUser({
        firstName: form.profileFirstName.trim(),
        lastName: form.profileLastName.trim(),
        genderType: form.profileGender,
        dateBirth: form.profileDateBirth,
        phoneNumber: phoneE164,
        telegramChatId,
      });
      goNext();
    } catch (e) {
      setProfileNoticeScreen4({
        variant: 'error',
        text: candidatePortalError(e, 'Ma’lumotlarni saqlashda xato.'),
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitProfileAndLoadResults() {
    setBusy(true);
    try {
      const entries = form.workExperienceEntries;
      if (!entries.length) {
        throw new Error('Ish tajribasi kiritilmagan.');
      }
      const maxY = Math.max(...entries.map((e) => e.duration_years), 1);
      const experience_range = maxY >= 5 ? 'YEAR_5_PLUS' : 'YEAR_1_3';

      const availability_status =
        form.availability === 'now' ? 'READY_NOW' : form.availability === 'soon' ? 'WITHIN_1_MONTH' : 'WITHIN_3_MONTHS';

      const lead = entries[0]!;
      const customName = lead.custom_profession_name?.trim() ?? '';
      if (lead.profession_category_id == null || lead.profession_category_id <= 0) {
        throw new Error('Kasb toifasi aniqlanmadi. 5-qadamda ish tajribasini qayta kiriting.');
      }
      if (
        (lead.profession_id == null || lead.profession_id <= 0) &&
        !customName
      ) {
        throw new Error('Kasb tanlanmagan. 5-qadamda kasbni tanlang yoki «Boshqa» kasbni kiriting.');
      }

      const createdProfileId = await candidateCreateProfile({
        marital_status: 'SINGLE',
        education_level: 'BACHELOR',
        data_consent: true,
        experience_range,
        experience_years: maxY,
        availability_status,
        desired_salary_min: form.desiredSalaryMin,
        desired_salary_max: form.desiredSalaryMax,
        salary_currency: 'EUR',
        profession_id: lead.profession_id,
        profession_category_id: lead.profession_category_id,
        ...(customName ? { custom_profession_name: customName } : {}),
      });
      if (!createdProfileId && !getCandidateProfileId()) {
        throw new Error('Profil yaratilmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.');
      }

      await candidateAddWorkExperience(entries);

      for (let i = 0; i < form.countries.length; i++) {
        const destination_country_id = form.countries[i]!;
        await candidateAddTargetCountry({ destination_country_id, priority: i + 1 });
      }

      if (!form.declaresNoLanguage) {
        for (const { name, level } of form.languageSelections) {
          const lang = toCandidateLanguageEnum(name);
          if (!lang) continue;
          await candidateAddLanguage({ language: lang, level, has_certificate: false });
        }
      }

      await candidateSubmitProfile();

      setHomeInitialTab(3);
      setView('home');
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
    4: (
      <Screen4Personal
        onNext={() => void savePersonalProfileAndNext()}
        onBack={goBack}
        form={form}
        setForm={setForm}
        busy={busy}
        notice={profileNoticeScreen4}
      />
    ),
    5: <Screen5 onNext={goNext} onBack={goBack} form={form} setForm={setForm} />,
    6: <Screen6 onNext={goNext} onBack={goBack} form={form} setForm={setForm} />,
    7: <Screen7 onNext={() => void submitProfileAndLoadResults()} onBack={goBack} form={form} setForm={setForm} busy={busy} />,
  };

  if (!sessionBootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#040a12' }}>
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ width: 'min(390px, 100vw)', height: 'min(844px, 100svh)', backgroundColor: C.bg }}
        >
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: C.blueL }} strokeWidth={2} aria-hidden />
        </div>
      </div>
    );
  }

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
