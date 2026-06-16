import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import FotonLogo from '../Img/e9ee15f1-3bc8-490d-941f-3b6a5ee4ce9c_removalai_preview.png';
import type { PublicDistrict, PublicRegion } from '../app/api/publicRegions';
import {
  FaceLandmarker,
  FilesetResolver,
  FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

import {
  fetchPublicUniversities,
  filterPublicUniversities,
  type PublicUniversity,
} from '../app/api/publicUniversities';
import {
  ensurePublicDistrictsLoaded,
  ensurePublicRegionsLoaded,
  resolvePublicRegionId,
  resolvePublicRegionNameUz,
} from '../app/lib/publicRegionCatalog';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
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
  Eye,
  Trash2,
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
  candidateAddEducation,
  candidateAddLanguage,
  candidateDeleteDocument,
  candidateAddTargetCountry,
  candidateAddWorkExperience,
  ensureCandidateProfile,
  linkCandidateProfileAfterUserEdit,
  type CandidateWorkExperienceBody,
  bootstrapCandidatePortalSession,
  candidateFetchDestinationCountries,
  candidateFetchMeSummary,
  candidateFetchProfessionCategories,
  candidateFetchProfessionsByCategory,
  candidateFetchProfileMe,
  candidateFetchVacancies,
  candidatePortalError,
  candidateSendOtp,
  candidateSubmitProfile,
  candidateUpdateMyUser,
  candidateUpdateProfile,
  candidateUploadDocument,
  candidateProcessPassportPhoto,
  candidateVerifyOtp,
  normalizeCandidateRegionId,
  candidateLocationFieldsFromForm,
  candidateRegionFieldsFromInputs,
  type CandidateProfileUpdateBody,
  type DestinationCountryDto,
  type PublicVacancyRow,
} from '../app/api/candidatePortal';
import type { ProfessionCategoryDto, ProfessionDto } from '../app/api/professions';
import { API_BASE_URL } from '../app/api/client';
import {
  adminLanguageUz,
  candidateProfileStatusUz,
  cefrLevelUz,
  documentTypeUz,
  CANDIDATE_SALARY_CURRENCY,
  formatSalaryCurrencyLabel,
  EDUCATION_LEVEL_SELECT_ORDER,
  educationLevelToFormValue,
  educationLevelUz,
  normalizeEducationLevelForApi,
  experienceRangeUz,
  maritalStatusUz,
  uzOrCode,
} from '../app/lib/adminUiUz';
import { countryFlagEmoji, countryNameUz } from '../app/lib/regionFlags';
import {
  getCachedCandidateSummary,
  getCandidateProfileId,
  getCandidateToken,
} from '../app/candidate/candidateSession';
import { syntheticTelegramChatId } from '../app/lib/syntheticTelegramChatId';
import {
  getTelegramEntryContext,
  initTelegramMiniApp,
  isTelegramMiniApp,
  readTelegramMiniAppChatId,
  readPortalViewportHeightPx,
  readTelegramSafeAreaInsets,
  subscribeTelegramViewportInsets,
  telegramEntryContextLabel,
} from '../app/lib/telegramWebApp';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

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

/** Bo‘sh / null profil maydonlari uchun */
const FIELD_EMPTY = 'Berilmagan';

/** Qiziqishlar (target countries) — maksimal tanlov */
const MAX_TARGET_COUNTRIES = 5;

const PREVIEWABLE_FILE_RE = /\.(png|jpe?g|gif|webp|bmp|svg|pdf)(\?.*)?$/i;

function apiOriginForAssets(): string {
  if (import.meta.env.DEV) return window.location.origin;
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

/** Server `file_url` — ko‘rish uchun brauzer URL */
function resolveCandidateFileUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  const origin = apiOriginForAssets();
  if (t.startsWith('/')) return `${origin}${t}`;
  return `${origin}/${t}`;
}

function canPreviewCandidateFile(url: string, fileName?: string): boolean {
  const probe = `${url} ${fileName ?? ''}`.toLowerCase();
  if (!probe.trim()) return false;
  if (PREVIEWABLE_FILE_RE.test(probe)) return true;
  if (/\.(png|jpe?g|gif|webp|bmp|svg|pdf)$/i.test(fileName ?? '')) return true;
  return false;
}

function displayField(value: string | null | undefined): string {
  const s = (value ?? '').trim();
  if (!s || s === '—') return FIELD_EMPTY;
  return s;
}

/** To‘liq ekran (Telegram / mobil); katta telefonlarda markazda cheklanadi */
const PORTAL_MAX_WIDTH_PX = 480;
const PORTAL_BASE_INSET_PX = 12;
const ONBOARDING_DOTS_RESERVE_PX = 40;

type PortalChrome = {
  topPx: number;
  bottomPx: number;
  footerExtraPx: number;
  viewportHeightPx: number;
  isTelegram: boolean;
};

const PortalChromeContext = createContext<PortalChrome>({
  topPx: PORTAL_BASE_INSET_PX,
  bottomPx: PORTAL_BASE_INSET_PX,
  footerExtraPx: 0,
  viewportHeightPx: 0,
  isTelegram: false,
});

function portalChromeCssVars(chrome: PortalChrome): CSSProperties {
  const vh =
    chrome.viewportHeightPx > 0 ? `${chrome.viewportHeightPx}px` : '100dvh';
  return {
    ['--portal-top-inset' as string]: `${chrome.topPx}px`,
    ['--portal-bottom-inset' as string]: `${chrome.bottomPx}px`,
    ['--portal-footer-extra' as string]: `${chrome.footerExtraPx}px`,
    ['--portal-vh' as string]: vh,
  };
}

function usePortalChromeInsets(onboarding: boolean): PortalChrome {
  const [tgInsets, setTgInsets] = useState(readTelegramSafeAreaInsets);
  const [viewportHeightPx, setViewportHeightPx] = useState(readPortalViewportHeightPx);
  const isTelegram = isTelegramMiniApp();

  useLayoutEffect(() => {
    const sync = () => {
      setTgInsets(readTelegramSafeAreaInsets());
      setViewportHeightPx(readPortalViewportHeightPx());
    };
    if (isTelegram) initTelegramMiniApp();
    sync();
    const unsubTg = subscribeTelegramViewportInsets(sync);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', sync);
    vv?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    return () => {
      unsubTg();
      vv?.removeEventListener('resize', sync);
      vv?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [isTelegram]);

  return useMemo(() => {
    const topPx = isTelegram
      ? Math.max(PORTAL_BASE_INSET_PX, tgInsets.top + 8)
      : PORTAL_BASE_INSET_PX;
    const bottomPx = Math.max(PORTAL_BASE_INSET_PX, isTelegram ? tgInsets.bottom : 0);
    return {
      topPx,
      bottomPx,
      footerExtraPx: onboarding ? ONBOARDING_DOTS_RESERVE_PX : 0,
      viewportHeightPx,
      isTelegram,
    };
  }, [isTelegram, tgInsets.top, tgInsets.bottom, onboarding, viewportHeightPx]);
}

function portalFrameStyle(chrome: PortalChrome): CSSProperties {
  const height =
    chrome.viewportHeightPx > 0 ? `${chrome.viewportHeightPx}px` : '100dvh';
  return {
    width: '100%',
    maxWidth: PORTAL_MAX_WIDTH_PX,
    height,
    maxHeight: height,
    backgroundColor: C.bg,
  };
}

function CandidatePortalShell({
  children,
  chrome,
}: {
  children: ReactNode;
  chrome: PortalChrome;
}) {
  return (
    <div
      className="kasb-candidate-portal flex w-full justify-center overflow-hidden"
      style={{
        height: 'var(--portal-vh, 100dvh)',
        maxHeight: 'var(--portal-vh, 100dvh)',
        backgroundColor: C.bg,
        fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
        ...portalChromeCssVars(chrome),
      }}
    >
      <div className="relative flex min-h-0 w-full flex-col overflow-hidden" style={portalFrameStyle(chrome)}>
        {children}
      </div>
    </div>
  );
}

/** TopBar + progress — kichik ekranda siqilmaydi, kontent alohida scroll */
function OnboardingHeader({ onBack, screen }: { onBack?: () => void; screen?: Screen }) {
  return (
    <div className="shrink-0" style={{ backgroundColor: C.bg, flexShrink: 0 }}>
      {onBack ? <TopBar onBack={onBack} /> : null}
      {screen != null ? <ProgressBar screen={screen} /> : null}
    </div>
  );
}

function ScreenScroll({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`kasb-portal-screen-scroll min-h-0 flex-1 ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

function ScreenFooter({ children }: { children: ReactNode }) {
  return (
    <div
      className="shrink-0 px-5 pt-4"
      style={{
        paddingBottom: `calc(max(var(--portal-bottom-inset, 12px), env(safe-area-inset-bottom, 0px)) + var(--portal-footer-extra, 0px) + 1rem)`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type View = 'onboarding' | 'home';

/** Til darajasi (CEFR) — backend `level` bilan mos */
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

type LanguageSelection = {
  name: string;
  level: CefrLevel;
  hasCertificate: boolean;
  certificateFile?: File | null;
};

type CandidateDocumentType =
  | 'PASSPORT'
  | 'DIPLOMA'
  | 'CERTIFICATE'
  | 'PHOTO'
  | 'WORK_PERMIT'
  | 'OTHER';

const DOCUMENT_TYPES: Array<{ type: CandidateDocumentType; label: string; required: boolean }> = [
  { type: 'PASSPORT', label: documentTypeUz.PASSPORT, required: true },
  { type: 'PHOTO', label: documentTypeUz.PHOTO, required: true },
  { type: 'DIPLOMA', label: documentTypeUz.DIPLOMA, required: false },
  { type: 'CERTIFICATE', label: documentTypeUz.CERTIFICATE, required: false },
  { type: 'WORK_PERMIT', label: documentTypeUz.WORK_PERMIT, required: false },
  { type: 'OTHER', label: documentTypeUz.OTHER, required: false },
];



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
  /** POST /work-experiences uchun yig‘ilgan qatorlar */
  workExperienceEntries: CandidateWorkExperienceBody[];
  /** Tanlangan qatorlar tartibi — katalog `id` (UUID, POST da destination_country_id) */
  countries: string[];
  availability: 'now' | 'soon' | 'later' | null;
  languageSelections: LanguageSelection[];
  /** «Til bilmayman» tanlangan bo‘lsa */

  workExperienceYears: number | null;
  workExperienceMonths: number | null;
  declaresNoLanguage: boolean;
  /** USD, `desired_salary_min` */
  desiredSalaryMin: number;
  /** USD, `desired_salary_max` */
  desiredSalaryMax: number;
  profileFirstName: string;
  profileLastName: string;
  profileGender: 'ERKAK' | 'AYOL';
  /** YYYY-MM-DD */
  profileDateBirth: string;
  addressRegion: string;
  addressDistrict: string;
  addressMFY: string;
  address: string;
  /** Ta’lim — `uzbekistan_otm.json` */
  educationLevel: string;
  educationRegionId: number | null;
  educationUniversityId: number | null;
  educationInstitutionName: string;
  educationSpecialty: string;
  educationGraduationYear: number | null;
  educationCountry: string;
  documents: Partial<Record<CandidateDocumentType, File>>;
}

/** Joriy forma bo‘yicha bitta work-experience obyekti (slug API bilan mos) */
function buildWorkExperienceBody(
  form: FormState
): CandidateWorkExperienceBody | null {
  const years = form.workExperienceYears ?? 0;
  const months = form.workExperienceMonths ?? 0;

  if (years === 0 && months === 0) return null;

  const catId = form.workProfessionCategoryId ?? 0;
  const profId = form.workIsOtherProfession
    ? 0
    : form.workProfessionId ?? 0;

  if (!form.workIsOtherProfession && profId <= 0) return null;

  if (
    form.workIsOtherProfession &&
    !form.workCustomProfessionName.trim()
  ) {
    return null;
  }

  let description = "";

  if (years > 0 && months > 0) {
    description = `${years} yil ${months} oy ish tajribasi`;
  } else if (years > 0) {
    description = `${years} yil ish tajribasi`;
  } else {
    description = `${months} oy ish tajribasi`;
  }

  return {
    profession_id: profId,
    profession_category_id: catId,
    duration_years: years,
    duration_months: months,
    description,
    ...(form.workIsOtherProfession &&
      form.workCustomProfessionName.trim()
      ? {
        custom_profession_name:
          form.workCustomProfessionName.trim(),
      }
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
    parts.push(`${d.salary_min} – ${d.salary_max} $`);
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

/** Kutilayotgan oylik (USD) — suriladigan diapazon */
const SALARY_USD_MIN_BOUND = 600;
const SALARY_USD_MAX_BOUND = 8000;
const SALARY_USD_STEP = 50;
const SALARY_USD_DEFAULT_MIN = 600;
const SALARY_USD_DEFAULT_MAX = 3500;

const TOTAL_SCREENS = 9;

const GRADUATION_YEAR_OPTIONS = (() => {
  const y = new Date().getFullYear();
  return Array.from({ length: 55 }, (_, i) => y - i);
})();
/** Backend SMS kodi uzunligi */
const OTP_SLOT_COUNT = 5;
/** Qayta yuborishgacha kutish (sekund) */
const SMS_RESEND_COUNTDOWN_SEC = 180;

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
      className="mb-3 rounded-xl px-3 py-2.5 text-center text-[14px] leading-snug"
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
  2: 12,
  3: 24,
  4: 36,
  5: 48,
  6: 60,
  7: 72,
  8: 86,
  9: 100,
};

function experienceRangeFromWorkEntries(entries: CandidateWorkExperienceBody[]): string {
  const maxY = Math.max(...entries.map((e) => e.duration_years), 1);
  return maxY >= 5 ? 'YEAR_5_PLUS' : 'YEAR_1_3';
}

function availabilityStatusFromForm(form: FormState): string {
  if (form.availability === 'now') return 'READY_NOW';
  if (form.availability === 'soon') return 'WITHIN_1_MONTH';
  return 'WITHIN_3_MONTHS';
}

/** Profil yaratish — faqat rozilik; marital/ta’lim keyinroq foydalanuvchidan */
const PROFILE_ENSURE_BASE = { data_consent: true } as const;

/** Tugallanmagan oliy, bakalavr va undan yuqori — viloyat → OTM tanlash */
const OTM_PICKER_EDUCATION_LEVELS = new Set([
  'INCOMPLETE_HIGHER',
  'BACHELOR',
  'MASTER',
  'PHD',
  'DSC',
]);

function educationLevelUsesOtmPicker(level: string): boolean {
  const code = normalizeEducationLevelForApi(level);
  return OTM_PICKER_EDUCATION_LEVELS.has(code);
}

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
        fontSize: 12,
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
      className="h-[3.25rem] min-h-[52px] w-full rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:active:scale-100"
      style={{
        fontSize: 17,
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
  desc?: string;
}) {
  const descTrim = desc?.trim();
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
        {descTrim ? (
          <p style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{descTrim}</p>
        ) : null}
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
    <div
      className="flex shrink-0 items-center gap-2 px-5 pb-2"
      style={{ paddingTop: 'max(var(--portal-top-inset, 12px), env(safe-area-inset-top, 0px))' }}
    >
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
    5: 'Ta’lim',
    6: 'Kasb tanlash',
    7: 'Til bilimi',
    8: 'Qiziqishlar',
    9: 'Hujjatlar',
  };
  return labels[screen] ?? '';
}

function ProgressBar({ screen }: { screen: Screen }) {
  const pct = PROGRESS_BY_SCREEN[screen] ?? 0;
  const showCaption = screen !== 4;
  return (
    <div className="shrink-0 px-5 pb-5">
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

function Screen1({
  onNext,
  lookupBusy = false,
  entryLabel,
}: {
  onNext: () => void;
  lookupBusy?: boolean;
  entryLabel?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <ScreenScroll
        className="flex flex-col items-center justify-start px-6 pb-4"
        style={{ paddingTop: 'max(var(--portal-top-inset, 12px), env(safe-area-inset-top, 0px))' }}
      >
        <div
          className="mb-3 flex items-center justify-center"

        >
          <img className="" src={FotonLogo} alt="The Kasb logotipi" style={{ objectFit: 'contain', width: 200 }} />
        </div>

        <h1
          className="mb-3 w-full text-center"
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.15,
            letterSpacing: '-0.8px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Xorijda yuqori maoshli ish toping
        </h1>
        <p className="mb-8 text-center" style={{ fontSize: 15, color: C.muted, lineHeight: 1.7 }}>
          Atigi 1 daqiqada ma&apos;lumotlaringizni kiriting — biz eng mos ishni topamiz
        </p>
        {entryLabel ? (
          <p className="mb-4 text-center text-[13px]" style={{ color: C.muted }}>
            {entryLabel}
          </p>
        ) : null}

        <div className="mb-8 flex w-full flex-col gap-[10px]">
          {[
            'Germaniya, Koreya, Polsha va boshqa mamlakatlar',
            '3000 – 7000 $ oylik maosh',
            'Rasmiy shartnoma va viza yordami',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <BlueDot />
              <span style={{ fontSize: 14, color: C.muted }}>{item}</span>
            </div>
          ))}
        </div>

        <div
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: C.blueGlow, border: `1px solid ${C.blue}22` }}
        >
          <PulseDot />
          <p style={{ fontSize: 14, color: C.muted }}>
            <span className="font-bold" style={{ color: C.text }}>
              127 ta
            </span>{' '}
            nomzod bugun ariza topshirdi
          </p>
        </div>
      </ScreenScroll>

      <ScreenFooter>
        <div className="flex flex-col gap-2 pt-2">
          {lookupBusy ? (
            <p className="mb-1 text-center text-[14px] leading-snug" style={{ color: C.muted }}>
              Mavjud akkaunt tekshirilmoqda…
            </p>
          ) : null}
          <PrimaryButton onClick={onNext} disabled={lookupBusy} loading={lookupBusy}>
            Boshlash — 1 daqiqa
          </PrimaryButton>

        </div>
      </ScreenFooter>
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <OnboardingHeader onBack={onBack} screen={2} />
      <ScreenScroll className="flex flex-col px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Telefon raqamingizni kiriting
        </h2>
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
      </ScreenScroll>
      <ScreenFooter>
        <InlineNoticeBar notice={notice} />
        <PrimaryButton onClick={onNext} disabled={!isValid} loading={busy}>
          SMS kod yuborish
        </PrimaryButton>
      </ScreenFooter>
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
  onResend, // now optional
}: {
  onNext: () => void;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy: boolean;
  notice: SmsInlineNotice;
  onResend?: () => Promise<void>; // optional
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(SMS_RESEND_COUNTDOWN_SEC);
  const [resendLoading, setResendLoading] = useState(false);

  // Timer countdown
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

  const resetOtpAndFocus = () => {
    setForm((f) => ({ ...f, otp: Array(OTP_SLOT_COUNT).fill('') }));
    inputRefs.current[0]?.focus();
  };

  const handleResend = async () => {
    if (resendLoading) return;
    setResendLoading(true);
    try {
      const phoneE164 = phoneE164FromNationalDigits(form.phoneNational);
      if (phoneE164) {
        await candidateSendOtp(phoneE164);
      }
      if (onResend) {
        await onResend(); // call parent's resend API if provided
      }
      // Always reset UI
      setTimer(SMS_RESEND_COUNTDOWN_SEC);
      resetOtpAndFocus();
    } catch (error) {
      console.error('Resend failed', error);
    } finally {
      setResendLoading(false);
    }
  };

  const allFilled = form.otp.every((d) => d !== '');
  const timerExpired = timer <= 0;
  const timerStr = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <OnboardingHeader onBack={onBack} screen={3} />
      <ScreenScroll className="flex flex-col px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          SMS kodni kiriting
        </h2>
        <div className="mb-6 mx-auto grid w-full max-w-[min(100%,320px)] grid-cols-5 gap-1.5 sm:mb-8 sm:max-w-[380px] sm:gap-2.5">
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

        {/* Show timer or resend prompt (only text, button will be in footer) */}
        <div className="text-center">
          {!timerExpired ? (
            <p className="tabular-nums" style={{ fontSize: 12, color: C.muted }}>
              Qayta yuborish: <span style={{ color: C.blue }}>{timerStr}</span>
            </p>
          ) : (
            <p style={{ fontSize: 12, color: C.muted }}>Kod kelmadi?</p>
          )}
        </div>
      </ScreenScroll>
      <ScreenFooter>
        <InlineNoticeBar notice={notice} />

        {/* Resend button – appears above Tasdiqlash when timer expired */}
        <div className="mb-2">
          {timerExpired && (
            <PrimaryButton onClick={handleResend} loading={resendLoading} disabled={resendLoading}>
              Qayta jo‘natish
            </PrimaryButton>
          )}
        </div>

        <PrimaryButton onClick={onNext} disabled={!allFilled || busy} loading={busy}>
          Tasdiqlash
        </PrimaryButton>
      </ScreenFooter>
    </div>
  );
}




const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const getDaysInMonth = (year: number, month: number) => {
  // month is 1-based (1..12)
  return new Date(year, month, 0).getDate();
};

export function Screen4Personal({
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

  // ---------- Date picker state ----------
  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [dateTouched, setDateTouched] = useState(false);
  const isInternalUpdate = useRef(false); // prevents update loops

  // Sync local state with form.profileDateBirth (external changes)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (form.profileDateBirth) {
      const parts = form.profileDateBirth.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        setYear(y);
        setMonth(m);
        setDay(d);
      } else {
        setYear('');
        setMonth('');
        setDay('');
      }
    } else {
      setYear('');
      setMonth('');
      setDay('');
      setDateTouched(false);
    }
  }, [form.profileDateBirth]);

  // Adjust day when month/year changes (if current day exceeds max days)
  useEffect(() => {
    if (year && month && day) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const d = parseInt(day, 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const maxDays = getDaysInMonth(y, m);
        if (d > maxDays) {
          setDay(''); // reset invalid day
        }
      }
    }
  }, [year, month, day]);

  // Update form when day/month/year change (if valid)
  useEffect(() => {
    if (year && month && day) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const d = parseInt(day, 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const maxDays = getDaysInMonth(y, m);
        if (d <= maxDays) {
          const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          if (form.profileDateBirth !== dateStr) {
            isInternalUpdate.current = true;
            setForm((f) => ({ ...f, profileDateBirth: dateStr }));
          }
          return;
        }
      }
    }
    // If date is incomplete or invalid, clear the form field
    if (form.profileDateBirth !== '') {
      isInternalUpdate.current = true;
      setForm((f) => ({ ...f, profileDateBirth: '' }));
    }
  }, [day, month, year, setForm, form.profileDateBirth]);

  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(form.profileDateBirth);
  const canContinue = fnOk && lnOk && dateOk;

  // Days list based on selected month/year
  const days = useMemo(() => {
    if (!year || !month) return Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (isNaN(y) || isNaN(m)) return Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const maxDays = getDaysInMonth(y, m);
    return Array.from({ length: maxDays }, (_, i) => (i + 1).toString());
  }, [year, month]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yrs = [];
    for (let y = currentYear; y >= 1940; y--) {
      yrs.push(y.toString());
    }
    return yrs;
  }, [currentYear]);

  // months as '01'..'12' for YYYY-MM-DD formatting
  const months = useMemo(() => MONTHS.map((_, idx) => (idx + 1).toString().padStart(2, '0')), []);

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateTouched(true);
    setDay(e.target.value);
  };
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateTouched(true);
    setMonth(e.target.value);
  };
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateTouched(true);
    setYear(e.target.value);
  };

  // ---------- Region & district logic ----------
  const [catalogRegions, setCatalogRegions] = useState<PublicRegion[]>([]);
  const [catalogDistricts, setCatalogDistricts] = useState<PublicDistrict[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const addressRegionId = resolvePublicRegionId(form.addressRegion);

  useEffect(() => {
    void ensurePublicRegionsLoaded()
      .then(setCatalogRegions)
      .catch(() => setCatalogRegions([]));
  }, []);

  useEffect(() => {
    if (!catalogRegions.length || !form.addressRegion.trim()) return;
    const id = resolvePublicRegionId(form.addressRegion);
    if (id != null && form.addressRegion !== String(id)) {
      setForm((f) => ({ ...f, addressRegion: String(id) }));
    }
  }, [catalogRegions, form.addressRegion, setForm]);

  useEffect(() => {
    if (addressRegionId == null) {
      setCatalogDistricts([]);
      return;
    }
    setDistrictsLoading(true);
    void ensurePublicDistrictsLoaded(addressRegionId)
      .then(setCatalogDistricts)
      .catch(() => setCatalogDistricts([]))
      .finally(() => setDistrictsLoading(false));
  }, [addressRegionId]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <OnboardingHeader onBack={onBack} screen={4} />
      <ScreenScroll className="flex min-w-0 flex-col px-5 pt-1">
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

        {/* Date picker – three selects with custom arrow */}
        <div className="mt-4 min-w-0">
          <SectionLabel>Tug'ilgan sana</SectionLabel>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="relative">
              <select
                value={day}
                onChange={handleDayChange}
                className="w-full box-border min-h-[52px] rounded-[14px] px-3 py-3 text-base outline-none appearance-none cursor-pointer"
                style={{
                  border: `1.5px solid ${day ? C.blue : C.border}`,
                  backgroundColor: C.card,
                  color: C.text,
                  fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
                }}
              >
                <option value="">Kun</option>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <select
                value={month}
                onChange={handleMonthChange}
                className="w-full box-border min-h-[52px] rounded-[14px] px-3 py-3 text-base outline-none appearance-none cursor-pointer"
                style={{
                  border: `1.5px solid ${month ? C.blue : C.border}`,
                  backgroundColor: C.card,
                  color: C.text,
                  fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
                }}
              >
                <option value="">Oy</option>
                {months.map((m) => {
                  const idx = parseInt(m, 10);
                  return (
                    <option key={m} value={m}>
                      {MONTHS[idx - 1]}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <select
                value={year}
                onChange={handleYearChange}
                className="w-full box-border min-h-[52px] rounded-[14px] px-3 py-3 text-base outline-none appearance-none cursor-pointer"
                style={{
                  border: `1.5px solid ${year ? C.blue : C.border}`,
                  backgroundColor: C.card,
                  color: C.text,
                  fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
                }}
              >
                <option value="">Yil</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          {dateTouched && !dateOk && (day || month || year) && (
            <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>
              Iltimos, to'liq va to'g'ri sanani tanlang
            </p>
          )}
        </div>

        {/* Address fields */}
        <div className="mt-4 min-w-0">
          <SectionLabel>Viloyat</SectionLabel>
          <select
            value={form.addressRegion}
            onChange={(e) => setForm((f) => ({ ...f, addressRegion: e.target.value, addressDistrict: '' }))}
            className="mt-2 box-border min-h-[52px] w-full min-w-0 max-w-full rounded-[14px] px-4 py-3 text-base outline-none transition-colors"
            style={{
              border: `1.5px solid ${form.addressRegion ? C.blue : C.border}`,
              backgroundColor: C.card,
              color: C.text,
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          >
            <option value="">Viloyatni tanlang</option>
            {catalogRegions.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.name_uz ?? r.name_ru ?? r.id}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 min-w-0">
          <SectionLabel>Tuman</SectionLabel>
          <select
            value={form.addressDistrict}
            onChange={(e) => setForm((f) => ({ ...f, addressDistrict: e.target.value }))}
            disabled={!form.addressRegion || districtsLoading}
            className="mt-2 box-border min-h-[52px] w-full min-w-0 max-w-full rounded-[14px] px-4 py-3 text-base outline-none transition-colors"
            style={{
              border: `1.5px solid ${form.addressDistrict ? C.blue : C.border}`,
              backgroundColor: C.card,
              color: C.text,
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          >
            <option value="">{districtsLoading ? 'Yuklanmoqda…' : 'Tumanni tanlang'}</option>
            {catalogDistricts.map((d) => (
              <option key={d.id} value={d.name_uz ?? d.name_ru ?? String(d.id)}>
                {d.name_uz ?? d.name_ru ?? d.id}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 min-w-0">
          <SectionLabel>MFY</SectionLabel>
          <input
            type="text"
            placeholder="Masalan: Furqat MFY"
            value={form.addressMFY}
            onChange={(e) => setForm((f) => ({ ...f, addressMFY: e.target.value }))}
            className="mt-2 box-border min-h-[52px] w-full min-w-0 max-w-full rounded-[14px] px-4 py-3 text-base outline-none transition-colors"
            style={{
              border: `1.5px solid ${form.addressMFY ? C.blue : C.border}`,
              backgroundColor: C.card,
              color: C.text,
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          />
        </div>

        <div className="mt-4 min-w-0">
          <SectionLabel>Manzil</SectionLabel>
          <input
            type="text"
            placeholder="Ko'cha, uy raqami"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="mt-2 box-border min-h-[52px] w-full min-w-0 max-w-full rounded-[14px] px-4 py-3 text-base outline-none transition-colors"
            style={{
              border: `1.5px solid ${form.address ? C.blue : C.border}`,
              backgroundColor: C.card,
              color: C.text,
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          />
        </div>
      </ScreenScroll>
      <ScreenFooter>
        <InlineNoticeBar notice={notice} />
        <PrimaryButton onClick={onNext} disabled={!canContinue || busy} loading={busy}>
          Keyingi
        </PrimaryButton>
      </ScreenFooter>
    </div>
  );
}


// Only PRIMARY and SECONDARY should NOT show the specialty field
const LEVELS_WITHOUT_SPECIALTY: readonly string[] = ["PRIMARY", "SECONDARY"];



function Screen5Education({
  onNext,
  onBack,
  form,
  setForm,
  busy = false,
}: {
  onNext: () => void | Promise<void>;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy?: boolean;
}) {
  type Panel = "level" | "region" | "university" | "details";

  const [panel, setPanel] = useState<Panel>("level");
  const [uniSearch, setUniSearch] = useState("");
  const [catalogRegions, setCatalogRegions] = useState<PublicRegion[]>([]);
  const [apiUniversities, setApiUniversities] = useState<PublicUniversity[]>([]);
  const [uniLoading, setUniLoading] = useState(false);

  useEffect(() => {
    void ensurePublicRegionsLoaded()
      .then(setCatalogRegions)
      .catch(() => setCatalogRegions([]));
  }, []);

  useEffect(() => {
    if (panel !== "university" || form.educationRegionId == null) {
      setApiUniversities([]);
      return;
    }
    setUniLoading(true);
    void fetchPublicUniversities({ region_id: form.educationRegionId })
      .then(setApiUniversities)
      .catch(() => setApiUniversities([]))
      .finally(() => setUniLoading(false));
  }, [panel, form.educationRegionId]);

  // Restore panel based on existing form data
  useEffect(() => {
    if (!form.educationLevel.trim()) {
      setPanel("level");
      return;
    }
    if (form.educationGraduationYear != null && form.educationInstitutionName.trim()) {
      setPanel("details");
      return;
    }
    if (form.educationInstitutionName.trim() || form.educationUniversityId != null) {
      setPanel("details");
      return;
    }
    if (form.educationRegionId != null && educationLevelUsesOtmPicker(form.educationLevel)) {
      setPanel("university");
      return;
    }
    if (educationLevelUsesOtmPicker(form.educationLevel)) {
      setPanel("region");
      return;
    }
    setPanel("details");
  }, []);

  const universities = useMemo(
    () => filterPublicUniversities(apiUniversities, uniSearch),
    [apiUniversities, uniSearch],
  );

  const handleTopBack = () => {
    if (panel === "level") {
      onBack();
      return;
    }
    if (panel === "region") {
      setPanel("level");
      return;
    }
    if (panel === "details" && form.educationLevel && !educationLevelUsesOtmPicker(form.educationLevel)) {
      setPanel("level");
      setForm((f) => ({
        ...f,
        educationInstitutionName: "",
        educationSpecialty: "",
        educationGraduationYear: null,
      }));
      return;
    }
    if (panel === "university") {
      setPanel("region");
      setUniSearch("");
      setForm((f) => ({
        ...f,
        educationRegionId: null,
        educationUniversityId: null,
        educationInstitutionName: "",
      }));
      return;
    }
    setPanel("university");
    setForm((f) => ({
      ...f,
      educationUniversityId: null,
      educationInstitutionName: "",
      educationSpecialty: "",
      educationGraduationYear: null,
    }));
  };

  const selectLevel = (level: string) => {
    setForm((f) => ({
      ...f,
      educationLevel: level,
      educationRegionId: null,
      educationUniversityId: null,
      educationInstitutionName: "",
      educationSpecialty: "",
      educationGraduationYear: null,
    }));
    setPanel(educationLevelUsesOtmPicker(level) ? "region" : "details");
  };

  const selectRegion = (region: PublicRegion) => {
    setForm((f) => ({
      ...f,
      educationRegionId: region.id,
      educationUniversityId: null,
      educationInstitutionName: "",
    }));
    setUniSearch("");
    setPanel("university");
  };

  const selectUniversity = (u: PublicUniversity) => {
    setForm((f) => ({
      ...f,
      educationUniversityId: u.id,
      educationInstitutionName: u.name ?? "",
      educationCountry: "UZB",
    }));
    setPanel("details");
  };

  const canFinish =
    !!form.educationLevel &&
    !!form.educationInstitutionName.trim() &&
    form.educationGraduationYear != null &&
    form.educationGraduationYear >= 1950;

  const fieldStyle: CSSProperties = {
    borderColor: C.border,
    backgroundColor: C.card2,
    color: C.text,
    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
  };
  const ctl =
    "mt-2 box-border min-h-[48px] w-full rounded-[14px] border px-3.5 py-2.5 text-[15px] outline-none focus:border-[#2980B9]";

  // Show specialty for all levels except PRIMARY and SECONDARY
  const showSpecialty = form.educationLevel && !LEVELS_WITHOUT_SPECIALTY.includes(form.educationLevel);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <OnboardingHeader onBack={handleTopBack} screen={5} />
      <ScreenScroll className="flex flex-col px-5">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap size={22} style={{ color: C.blueL }} strokeWidth={2} aria-hidden />
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: C.text,
              letterSpacing: "-0.5px",
              fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
            }}
          >
            {panel === "level"
              ? "Ta’lim darajasi"
              : panel === "region"
                ? "Viloyat"
                : panel === "university"
                  ? "OTM"
                  : "Ta’lim tafsilotlari"}
          </h2>
        </div>

        {panel !== "level" && form.educationLevel ? (
          <button
            type="button"
            onClick={() => setPanel("level")}
            className="mb-3 flex w-full items-center justify-between rounded-[12px] border px-3 py-2.5 text-left transition-all active:scale-[0.98]"
            style={{ borderColor: C.border, backgroundColor: C.card2 }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
              Ta’lim darajasi
            </span>
            <span className="text-[14px] font-semibold" style={{ color: C.blueL }}>
              {educationLevelUz[form.educationLevel] ?? form.educationLevel} · o‘zgartish
            </span>
          </button>
        ) : null}

        {panel === "level" ? (
          <div className="grid gap-2 pb-2">
            {EDUCATION_LEVEL_SELECT_ORDER.map((code) => (
              <OptionCard
                key={code}
                selected={form.educationLevel === code}
                onClick={() => selectLevel(code)}
                left={
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                    style={{ backgroundColor: C.card2, border: `1px solid ${C.border}`, color: C.blueL }}
                  >
                    {(educationLevelUz[code] ?? code).slice(0, 2).toUpperCase()}
                  </span>
                }
                title={educationLevelUz[code] ?? code}
              />
            ))}
          </div>
        ) : null}

        {panel === "region" && form.educationLevel && educationLevelUsesOtmPicker(form.educationLevel) ? (
          <div className="grid gap-2 pb-2">
            {catalogRegions.map((region) => (
              <OptionCard
                key={region.id}
                selected={form.educationRegionId === region.id}
                onClick={() => selectRegion(region)}
                left={
                  <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.muted }}>
                    {region.code ?? region.id}
                  </span>
                }
                title={region.name_uz ?? region.name_ru ?? String(region.id)}
              />
            ))}
          </div>
        ) : null}

        {panel === "university" && form.educationLevel && educationLevelUsesOtmPicker(form.educationLevel) ? (
          <div className="pb-2">
            <input
              type="search"
              placeholder="OTM qidirish…"
              value={uniSearch}
              onChange={(e) => setUniSearch(e.target.value)}
              className={ctl}
              style={fieldStyle}
            />
            <div className="mt-3 grid gap-2 pb-2">
              {uniLoading ? (
                <p className="flex items-center justify-center gap-2 py-6 text-[13px]" style={{ color: C.muted }}>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  OTM yuklanmoqda…
                </p>
              ) : universities.length === 0 ? (
                <p className="py-6 text-center text-[13px]" style={{ color: C.muted }}>
                  OTM topilmadi
                </p>
              ) : (
                universities.map((u) => (
                  <OptionCard
                    key={u.id}
                    selected={form.educationUniversityId === u.id}
                    onClick={() => selectUniversity(u)}
                    left={
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                        style={{
                          backgroundColor: u.type === "davlat" ? `${C.blue}22` : `${C.gold}22`,
                          color: u.type === "davlat" ? C.blueL : C.gold,
                        }}
                      >
                        {u.type === "davlat" ? "Davlat" : u.type === "nodavlat" ? "Nodavlat" : (u.type ?? "—")}
                      </span>
                    }
                    title={u.name ?? "—"}
                  />
                ))
              )}
            </div>
          </div>
        ) : null}

        {panel === "details" ? (
          <div className="pb-2">
            {form.educationLevel && educationLevelUsesOtmPicker(form.educationLevel) ? (
              <p
                className="mb-3 rounded-[12px] border px-3 py-2.5 text-[13px]"
                style={{ borderColor: C.border, color: C.text, backgroundColor: C.card2 }}
              >
                {form.educationInstitutionName || "—"}
              </p>
            ) : (
              <label className="mb-3 block">
                <SectionLabel>Ta’lim muassasasi</SectionLabel>
                <input
                  type="text"
                  className={ctl}
                  style={fieldStyle}
                  value={form.educationInstitutionName}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      educationInstitutionName: e.target.value,
                      educationCountry: "UZB",
                    }))
                  }
                  placeholder="Maktab, kollej yoki boshqa muassasa"
                />
              </label>
            )}

            {/* Specialty field – shown for all levels except PRIMARY and SECONDARY */}
            {showSpecialty && (
              <label className="block">
                <SectionLabel>Mutaxassislik</SectionLabel>
                <input
                  type="text"
                  className={ctl}
                  style={fieldStyle}
                  value={form.educationSpecialty}
                  onChange={(e) => setForm((f) => ({ ...f, educationSpecialty: e.target.value }))}
                  placeholder="Masalan: Iqtisodiyot"
                />
              </label>
            )}

            <label className={`block ${showSpecialty ? "mt-4" : ""}`}>
              <SectionLabel>Tugatgan yili</SectionLabel>
              <select
                className={ctl}
                style={fieldStyle}
                value={form.educationGraduationYear ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    educationGraduationYear: v ? Number(v) : null,
                  }));
                }}
              >
                <option value="">Tanlang</option>
                {GRADUATION_YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </ScreenScroll>
      <ScreenFooter>
        {panel === "details" ? (
          <PrimaryButton
            onClick={() => void Promise.resolve(onNext())}
            disabled={!canFinish || busy}
            loading={busy}
          >
            Keyingi
          </PrimaryButton>
        ) : (
          <div className="h-[52px]" aria-hidden />
        )}
      </ScreenFooter>
    </div>
  );
}




// Years range: 0 to 40
const YEAR_OPTIONS = Array.from({ length: 41 }, (_, i) => i);
// Months range: 0 to 11
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i);




export function Screen6Work({
  onNext,
  onBack,
  form,
  setForm,
  busy = false,
}: {
  onNext: (entries?: CandidateWorkExperienceBody[]) => void | Promise<void>;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy?: boolean;
}) {
  type Panel = "category" | "profession" | "otherDetail" | "experience";

  const [panel, setPanel] = useState<Panel>(() => {
    const years = form.workExperienceYears;
    const hasNamedProfession =
      form.workProfessionId != null && form.workProfessionId > 0;
    const hasOtherReady =
      form.workIsOtherProfession && form.workCustomProfessionName.trim().length > 0;
    if (years != null && (hasNamedProfession || hasOtherReady)) return "experience";
    if (form.workIsOtherProfession) return "otherDetail";
    if (form.workProfessionCategoryId != null) return "profession";
    return "category";
  });

  // Локальное состояние для выбора лет и месяцев
  const [expYears, setExpYears] = useState<number>(() => {
    if (form.workExperienceYears == null) return 0;
    return Math.floor(form.workExperienceYears);
  });
  const [expMonths, setExpMonths] = useState<number>(() => {
    if (form.workExperienceYears == null) return 0;
    const fractional = form.workExperienceYears - Math.floor(form.workExperienceYears);
    return Math.round(fractional * 12);
  });

  const [categories, setCategories] = useState<ProfessionCategoryDto[]>([]);
  const [professions, setProfessions] = useState<ProfessionDto[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [profsLoading, setProfsLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // Загрузка категорий
  useEffect(() => {
    let cancelled = false;
    setCatsLoading(true);
    setLoadErr(null);
    void candidateFetchProfessionCategories()
      .then((c) => {
        if (!cancelled) setCategories(c);
      })
      .catch((e) => {
        if (!cancelled) setLoadErr(candidatePortalError(e, "Kasb kategoriyalari yuklanmadi."));
      })
      .finally(() => {
        if (!cancelled) setCatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Загрузка профессий при смене категории
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
        if (!cancelled) setLoadErr(candidatePortalError(e, "Kasblar ro‘yxati yuklanmadi."));
      })
      .finally(() => {
        if (!cancelled) setProfsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.workProfessionCategoryId]);

  // Синхронизация локальных лет/месяцев с общим полем в form (дробное)
  useEffect(() => {
    setForm((f) => ({
      ...f,
      workExperienceYears: expYears,
      workExperienceMonths: expMonths,
    }));
  }, [expYears, expMonths, setForm]);

  // Навигация "назад"
  const handleTopBack = () => {
    if (panel === "category") {
      onBack();
      return;
    }
    if (panel === "profession") {
      setPanel("category");
      setProfessions([]);
      setForm((f) => ({
        ...f,
        workProfessionCategoryId: null,
        workProfessionId: null,
        workIsOtherProfession: false,
        workCustomProfessionName: "",
        workExperienceYears: null,
      }));
      setExpYears(0);
      setExpMonths(0);
      return;
    }
    if (panel === "otherDetail") {
      setPanel("profession");
      setForm((f) => ({
        ...f,
        workIsOtherProfession: false,
        workCustomProfessionName: "",
        workProfessionId: null,
        workExperienceYears: null,
      }));
      setExpYears(0);
      setExpMonths(0);
      return;
    }
    // из experience → назад к profession/otherDetail
    setPanel(form.workIsOtherProfession ? "otherDetail" : "profession");
    setForm((f) => ({ ...f, workExperienceYears: null }));
    setExpYears(0);
    setExpMonths(0);
  };

  const selectCategory = (catId: number) => {
    setForm((f) => ({
      ...f,
      workProfessionCategoryId: catId,
      workProfessionId: null,
      workIsOtherProfession: false,
      workCustomProfessionName: "",
      workExperienceYears: null,
    }));
    setExpYears(0);
    setExpMonths(0);
    setPanel("profession");
  };

  const selectProfessionRow = (p: ProfessionDto) => {
    setForm((f) => ({
      ...f,
      workProfessionId: p.id,
      workProfessionCategoryId: p.category_id,
      workIsOtherProfession: false,
      workCustomProfessionName: "",
      workExperienceYears: null,
    }));
    setExpYears(0);
    setExpMonths(0);
    setPanel("experience");
  };

  const selectOtherProfession = () => {
    setForm((f) => ({
      ...f,
      workProfessionId: 0,
      workIsOtherProfession: true,
      workCustomProfessionName: "",
      workExperienceYears: null,
    }));
    setExpYears(0);
    setExpMonths(0);
    setPanel("otherDetail");
  };

  const otherNameOk = form.workCustomProfessionName.trim().length > 0;
  const hasProfessionChoice =
    (form.workProfessionId != null && form.workProfessionId > 0) ||
    (form.workIsOtherProfession && otherNameOk);
  const canFinishExperience = hasProfessionChoice && form.workExperienceYears != null;

  // Добавить ещё одно место работы (с сохранением текущего)
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
      workCustomProfessionName: "",
      workExperienceYears: null,
    }));
    setExpYears(0);
    setExpMonths(0);
    setPanel("category");
    setProfessions([]);
  };

  // Перейти к следующему шагу, передав все записи
  const goNextWithWorkExperiences = () => {
    const addition = buildWorkExperienceBody(form);
    const merged: CandidateWorkExperienceBody[] = addition
      ? [...form.workExperienceEntries, addition]
      : [...form.workExperienceEntries];
    if (merged.length === 0) {
      toast.error("Kamida bitta ish tajribasini tanlang.");
      return;
    }
    setForm((f) => ({
      ...f,
      workExperienceEntries: merged,
      workProfessionCategoryId: null,
      workProfessionId: null,
      workIsOtherProfession: false,
      workCustomProfessionName: "",
      workExperienceYears: null,
    }));
    void Promise.resolve(onNext(merged));
  };

  const primaryDisabled =
    panel === "otherDetail" ? !otherNameOk : panel === "experience" ? false : true;

  const primaryAction = () => {
    if (panel === "otherDetail" && otherNameOk) {
      setPanel("experience");
      return;
    }
  };

  // Форматирование для отображения
  const formatExperience = (
    years: number | null,
    months: number | null
  ) => {
    const y = years ?? 0;
    const m = months ?? 0;

    if (y === 0 && m === 0) return "";

    if (y > 0 && m > 0) {
      return `${y} yil ${m} oy`;
    }

    if (y > 0) {
      return `${y} yil`;
    }

    return `${m} oy`;
  };
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <OnboardingHeader onBack={handleTopBack} screen={6} />
      <ScreenScroll className="flex min-w-0 flex-col px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            letterSpacing: "-0.5px",
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          {panel === "category"
            ? "Ish tajribangiz"
            : panel === "profession"
              ? "Aniq yoʻnalishingiz"
              : panel === "otherDetail"
                ? "Kasb nomi"
                : "Ish tajribangiz"}
        </h2>

        {loadErr ? (
          <p
            className="mb-3 rounded-xl px-3 py-2.5 text-center text-[13px]"
            style={{ backgroundColor: `${C.red}18`, color: C.text }}
          >
            {loadErr}
          </p>
        ) : null}

        {/* Выбор категории */}
        {panel === "category" &&
          (catsLoading ? (
            <div className="flex flex-col items-center justify-start gap-3 py-12">
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
                  title={c.name_uz || c.name_ru || "Kategoriya"}
                  desc={c.name_ru && c.name_uz !== c.name_ru ? c.name_ru : "Tanlash"}
                />
              ))}
            </div>
          ))}

        {/* Выбор профессии */}
        {panel === "profession" &&
          (profsLoading ? (
            <div className="flex flex-col items-center justify-start gap-3 py-12">
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
                  title={p.name_uz || p.name_ru || "Kasb"}
                  desc={p.name_ru && p.name_uz !== p.name_ru ? p.name_ru : "Tanlash"}
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
          ))}

        {/* Ввод названия "другой" профессии */}
        {panel === "otherDetail" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              autoFocus
              placeholder="Masalan: CNC operator"
              value={form.workCustomProfessionName}
              onChange={(e) =>
                setForm((f) => ({ ...f, workCustomProfessionName: e.target.value }))
              }
              className="box-border min-h-[52px] w-full min-w-0 max-w-full rounded-[14px] px-4 py-3 text-base outline-none"
              style={{
                border: `1.5px solid ${otherNameOk ? C.blue : C.border}`,
                backgroundColor: C.card,
                color: C.text,
                fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
              }}
            />
          </motion.div>
        )}

        {/* Выбор стажа (годы + месяцы) */}
        {panel === "experience" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="pb-2"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={expYears}
                  onChange={(e) => setExpYears(Number(e.target.value))}
                  className="w-full box-border min-h-[52px] rounded-[14px] px-3 py-3 text-base outline-none appearance-none cursor-pointer"
                  style={{
                    border: `1.5px solid ${expYears !== undefined ? C.blue : C.border}`,
                    backgroundColor: C.card,
                    color: C.text,
                    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
                  }}
                >
                  <option value={0}>Yil</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y} {y === 1 ? "yil" : "yil"}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={expMonths}
                  onChange={(e) => setExpMonths(Number(e.target.value))}
                  className="w-full box-border min-h-[52px] rounded-[14px] px-3 py-3 text-base outline-none appearance-none cursor-pointer"
                  style={{
                    border: `1.5px solid ${expMonths !== undefined ? C.blue : C.border}`,
                    backgroundColor: C.card,
                    color: C.text,
                    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
                  }}
                >
                  <option value={0}>Oy</option>
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} {m === 1 ? "oy" : "oy"}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {form.workExperienceYears != null && (
              <p className="mt-3 text-center text-[13px]" style={{ color: C.blueL }}>
                Tanlangan tajriba:   {formatExperience(
                  form.workExperienceYears,
                  form.workExperienceMonths
                )}
              </p>
            )}
          </motion.div>
        )}
      </ScreenScroll>

      {/* Футер с действиями */}
      {panel === "otherDetail" ? (
        <ScreenFooter>
          <PrimaryButton onClick={primaryAction} disabled={primaryDisabled}>
            Davom etish
          </PrimaryButton>
        </ScreenFooter>
      ) : panel === "experience" ? (
        <ScreenFooter>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={addAnotherWork}
              disabled={!canFinishExperience}
              className="h-14 w-full rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100"
              style={{
                fontSize: 15,
                letterSpacing: "-0.2px",
                backgroundColor: C.card,
                color: C.text,
                border: `1.5px solid ${C.border}`,
                fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
              }}
            >
              Yana ish qo‘shish
            </button>
            <PrimaryButton
              onClick={goNextWithWorkExperiences}
              disabled={(!canFinishExperience && form.workExperienceEntries.length === 0) || busy}
              loading={busy}
            >
              Keyingi
            </PrimaryButton>
          </div>
        </ScreenFooter>
      ) : (
        <div
          className="shrink-0"
          style={{ paddingBottom: "var(--portal-footer-extra, 0px)" }}
          aria-hidden
        />
      )}
    </div>
  );
}


function LanguageCertificateFileInput({
  inputId,
  file,
  onChange,
}: {
  inputId: string;
  file: File | null | undefined;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="mt-2">
      <input
        id={inputId}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <label
        htmlFor={inputId}
        className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-[12px] border px-3 py-2.5 text-center text-[13px] font-semibold transition-all active:scale-[0.98]"
        style={{ borderColor: C.gold, backgroundColor: `${C.gold}18`, color: C.gold }}
      >
        {file ? 'Boshqa sertifikat tanlash' : 'Sertifikat faylini yuklash'}
      </label>
      {file ? (
        <p className="mt-1.5 truncate text-[12px]" style={{ color: C.muted }}>
          Tanlangan: {file.name}
        </p>
      ) : (
        <p className="mt-1.5 text-[11px]" style={{ color: C.muted }}>
          Rasm yoki PDF
        </p>
      )}
    </div>
  );
}

function LanguageCertificateToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-2.5 flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 transition-all active:scale-[0.98]"
      style={{
        border: `1.5px solid ${active ? C.gold : C.border}`,
        backgroundColor: active ? `${C.gold}22` : C.card,
      }}
      aria-pressed={active}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: active ? `${C.gold}33` : C.card2,
          color: active ? C.gold : C.muted,
        }}
      >
        <Award className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[13px] font-semibold" style={{ color: active ? C.text : C.muted }}>
          Sertifikatim bor
        </span>
        {active ? (
          <span className="text-[11px] font-medium" style={{ color: C.gold }}>
            Belgilandi
          </span>
        ) : null}
      </span>
      <span
        className="relative flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors"
        style={{ backgroundColor: active ? C.gold : C.border }}
        aria-hidden
      >
        <span
          className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
          style={{ transform: active ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </span>
    </button>
  );
}

function Screen6({
  onNext,
  onBack,
  form,
  setForm,
  busy = false,
}: {
  onNext: () => void | Promise<void>;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy?: boolean;
}) {
  const [showOtherLangPanel, setShowOtherLangPanel] = useState(false);
  const [otherLangDraft, setOtherLangDraft] = useState('');
  const [otherLangLevel, setOtherLangLevel] = useState<CefrLevel>('B1');
  const [otherLangCertificate, setOtherLangCertificate] = useState(false);
  const [otherLangCertFile, setOtherLangCertFile] = useState<File | null>(null);

  const langLevel = (name: string) => form.languageSelections.find((s) => s.name === name)?.level ?? null;

  const setPresetLangLevel = (name: string, level: CefrLevel) => {
    setForm((f) => {
      if (f.declaresNoLanguage) {
        return {
          ...f,
          declaresNoLanguage: false,
          languageSelections: [{ name, level, hasCertificate: false, certificateFile: null }],
        };
      }
      const i = f.languageSelections.findIndex((s) => s.name === name);
      const next = [...f.languageSelections];
      if (i >= 0) {
        if (next[i].level === level) next.splice(i, 1);
        else next[i] = { name, level, hasCertificate: next[i].hasCertificate, certificateFile: next[i].certificateFile };
      } else {
        next.push({ name, level, hasCertificate: false, certificateFile: null });
      }
      return { ...f, languageSelections: next, declaresNoLanguage: false };
    });
  };

  const toggleCertificate = (name: string) => {
    setForm((f) => ({
      ...f,
      languageSelections: f.languageSelections.map((s) => {
        if (s.name !== name) return s;
        const nextCert = !s.hasCertificate;
        return { ...s, hasCertificate: nextCert, certificateFile: nextCert ? s.certificateFile : null };
      }),
    }));
  };

  const setLanguageCertificateFile = (name: string, file: File | null) => {
    setForm((f) => ({
      ...f,
      languageSelections: f.languageSelections.map((s) =>
        s.name === name ? { ...s, certificateFile: file } : s,
      ),
    }));
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
    if (otherLangCertificate && !otherLangCertFile) {
      toast.error('Boshqa til uchun sertifikat faylini yuklang.');
      return;
    }
    const name = normalizeCustomLangLabel(raw) ?? raw;
    const certFile = otherLangCertificate ? otherLangCertFile : null;
    setForm((f) => {
      if (f.declaresNoLanguage) {
        return {
          ...f,
          declaresNoLanguage: false,
          languageSelections: [
            { name, level: otherLangLevel, hasCertificate: otherLangCertificate, certificateFile: certFile },
          ],
        };
      }
      if (f.languageSelections.some((s) => s.name.toLowerCase() === name.toLowerCase())) return f;
      return {
        ...f,
        languageSelections: [
          ...f.languageSelections,
          { name, level: otherLangLevel, hasCertificate: otherLangCertificate, certificateFile: certFile },
        ],
      };
    });
    setOtherLangDraft('');
    setOtherLangCertFile(null);
    setOtherLangCertificate(false);
    setShowOtherLangPanel(false);
  };

  const removeSelection = (name: string) => {
    setForm((f) => ({ ...f, languageSelections: f.languageSelections.filter((s) => s.name !== name) }));
  };

  const customSelections = form.languageSelections.filter(
    (s) => !(PRESET_LANGUAGE_LABELS as readonly string[]).includes(s.name),
  );

  const langsNeedingCert = form.languageSelections.filter((s) => s.hasCertificate);
  const langsCertMissing = langsNeedingCert.filter((s) => !s.certificateFile);
  const langsOk =
    (form.declaresNoLanguage || form.languageSelections.length > 0) && langsCertMissing.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <OnboardingHeader onBack={onBack} screen={7} />
      <ScreenScroll className="flex flex-col px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Til bilimi
        </h2>
        <div className="mb-4 flex flex-col gap-4 pb-2">
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
              {langLevel(lang) ? (
                <>
                  <LanguageCertificateToggle
                    active={!!form.languageSelections.find((s) => s.name === lang)?.hasCertificate}
                    onToggle={() => toggleCertificate(lang)}
                  />
                  {form.languageSelections.find((s) => s.name === lang)?.hasCertificate ? (
                    <LanguageCertificateFileInput
                      inputId={`lang-cert-${lang.replace(/\s+/g, '-')}`}
                      file={form.languageSelections.find((s) => s.name === lang)?.certificateFile}
                      onChange={(file) => setLanguageCertificateFile(lang, file)}
                    />
                  ) : null}
                </>
              ) : null}
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
              <LanguageCertificateToggle
                active={otherLangCertificate}
                onToggle={() => {
                  setOtherLangCertificate((v) => {
                    const next = !v;
                    if (!next) setOtherLangCertFile(null);
                    return next;
                  });
                }}
              />
              {otherLangCertificate ? (
                <LanguageCertificateFileInput
                  inputId="lang-cert-other-draft"
                  file={otherLangCertFile}
                  onChange={setOtherLangCertFile}
                />
              ) : null}
              <button
                type="button"
                onClick={addOtherLanguage}
                disabled={!otherLangDraft.trim()}
                className="mt-3 w-full rounded-[12px] py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40"
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
          <div className="mb-4 flex flex-col gap-2">
            {customSelections.map((s) => (
              <div
                key={`${s.name}-${s.level}`}
                className="rounded-[14px] px-3 py-2.5"
                style={{ border: `1px solid ${C.border}`, backgroundColor: C.card2 }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium" style={{ fontSize: 13, color: C.text }}>
                    {s.name} · {s.level}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeSelection(s.name)}
                    className="rounded-lg px-2 py-1 text-[12px] font-semibold"
                    style={{ color: C.muted }}
                    title="Olib tashlash"
                  >
                    Olib tashlash
                  </button>
                </div>
                <LanguageCertificateToggle
                  active={s.hasCertificate}
                  onToggle={() => toggleCertificate(s.name)}
                />
                {s.hasCertificate ? (
                  <LanguageCertificateFileInput
                    inputId={`lang-cert-custom-${s.name.replace(/\s+/g, '-')}`}
                    file={s.certificateFile}
                    onChange={(file) => setLanguageCertificateFile(s.name, file)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </ScreenScroll>
      <ScreenFooter>
        <PrimaryButton onClick={() => void Promise.resolve(onNext())} disabled={!langsOk || busy} loading={busy}>
          Keyingi
        </PrimaryButton>
      </ScreenFooter>
    </div>
  );
}












// ─── Types ──────────────────────────────────────────────────────────────

type DetectionStatus = 'loading' | 'no_face' | 'ready' | 'error';

type StatusConfig = {
  border: string;
  text: string;
  dot: string;
  hint: string | null;
};

const STATUS_CONFIG: Record<DetectionStatus, StatusConfig> = {
  loading: {
    border: 'border-white/10',
    text: 'text-[#93A3BE]',
    dot: 'bg-white/30',
    hint: null,
  },
  no_face: {
    border: 'border-amber-400/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    hint: "→ Yuzingiz kadrga to'liq kirishi kerak",
  },
  ready: {
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    hint: null,
  },
  error: {
    border: 'border-red-500/30',
    text: 'text-red-300',
    dot: 'bg-red-400',
    hint: null,
  },
};

const STATUS_MSG: Record<DetectionStatus, string> = {
  loading: "Detektor yuklanmoqda…",
  no_face: "Yuz aniqlanmadi — kameraga to'g'ri qarab turing",
  ready: "Yuz aniqlandi — suratga olishingiz mumkin",
  error: "Detektor ishlamayapti",
};

const MIN_FACE_AREA_RATIO = 0.15;
const CENTER_TOLERANCE = 0.25;

// ─── Component Props ──────────────────────────────────────────────────

interface FaceCaptureScreenProps {
  onBack: () => void;
  onSuccess: (file: File) => Promise<void>;
  busy: boolean;
}

// ─── Component ──────────────────────────────────────────────────────

const FaceCaptureScreen: React.FC<FaceCaptureScreenProps> = ({
  onBack,
  onSuccess,
  busy,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const mountedRef = useRef<boolean>(true);
  const animationRef = useRef<number | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);

  const [status, setStatus] = useState<DetectionStatus>('loading');
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [captureBusy, setCaptureBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // ─── Initialize MediaPipe FaceLandmarker ─────────────────────────

  useEffect(() => {
    let isMounted = mountedRef.current;

    const initLandmarker = async () => {
      try {
        setError(null);
        setStatus('loading');
        setModelsLoaded(false);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        // ✅ Используем FaceLandmarker – его модель стабильно доступна
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          },
          runningMode: 'VIDEO',
          numFaces: 1, // нам нужно только одно лицо
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
        });

        if (!isMounted) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setModelsLoaded(true);
        setStatus('no_face');
      } catch (err) {
        console.error('[FaceCapture] Landmarker initialization error:', err);
        if (isMounted) {
          setError('Detektorni ishga tushirib bo‘lmadi. Qayta urinib ko‘ring.');
          setStatus('error');
          setModelsLoaded(false);
        }
      }
    };

    initLandmarker();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [retryCount]);

  // ─── Detection Loop (requestAnimationFrame) ─────────────────────

  useEffect(() => {
    if (!modelsLoaded || status === 'error') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let previousStatus: DetectionStatus | null = null;

    const detectLoop = () => {
      if (!mountedRef.current || !landmarkerRef.current) {
        animationRef.current = null;
        return;
      }

      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) {
        animationRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      try {
        const result: FaceLandmarkerResult = landmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );

        let newStatus: DetectionStatus = 'no_face';
        const faces = result.faceLandmarks || [];

        if (faces.length === 1) {
          // FaceLandmarker даёт 468 точек, вычисляем bounding box по минимальным/максимальным координатам
          const landmarks = faces[0];
          const xs = landmarks.map((p) => p.x);
          const ys = landmarks.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          const width = maxX - minX;
          const height = maxY - minY;
          const area = width * height; // в относительных координатах (0..1)

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;

          const isCentered =
            Math.abs(centerX - 0.5) < CENTER_TOLERANCE &&
            Math.abs(centerY - 0.5) < CENTER_TOLERANCE;

          if (area >= MIN_FACE_AREA_RATIO && isCentered) {
            newStatus = 'ready';
          }
        }

        if (newStatus !== previousStatus) {
          previousStatus = newStatus;
          setStatus(newStatus);
        }

        animationRef.current = requestAnimationFrame(detectLoop);
      } catch (err) {
        console.warn('[FaceCapture] Detection error:', err);
        animationRef.current = requestAnimationFrame(detectLoop);
      }
    };

    animationRef.current = requestAnimationFrame(detectLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [modelsLoaded, status === 'error']);

  // ─── Capture Photo ────────────────────────────────────────────────

  const capturePhoto = useCallback(async () => {
    if (
      !webcamRef.current ||
      status !== 'ready' ||
      captureBusy ||
      busy ||
      !mountedRef.current
    ) {
      return;
    }

    setCaptureBusy(true);
    setError(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Screenshot bo‘sh qaytdi');
      }

      const blob = await fetch(imageSrc).then((res) => res.blob());
      const file = new File([blob], 'face-photo.jpg', { type: 'image/jpeg' });
      await onSuccess(file);
    } catch (err) {
      console.error('[FaceCapture] capturePhoto error:', err);
      setError('Surat olishda xato yuz berdi. Qayta urinib ko‘ring.');
    } finally {
      if (mountedRef.current) {
        setCaptureBusy(false);
      }
    }
  }, [status, captureBusy, busy, onSuccess]);

  // ─── Retry ─────────────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }
    setError(null);
    setStatus('loading');
    setModelsLoaded(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  // ─── JSX ───────────────────────────────────────────────────────────

  const cfg = STATUS_CONFIG[status];
  const isReady = status === 'ready';
  const isLoading = captureBusy || busy;
  const showLoadingOverlay = !modelsLoaded && status !== 'error';
  const showErrorOverlay = status === 'error';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#030715]">
      <OnboardingHeader onBack={onBack} screen={9} />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        <div className="rounded-[24px] border border-white/10 bg-[#091223] px-4 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7FC3FF]">
            Pasport yuklandi
          </p>
          <h1 className="mb-1 text-lg font-semibold text-white">
            Yuz suratini oling
          </h1>
          <p className="text-[13px] leading-[1.6] text-[#B8C7E0]">
            Kameraga to‘g‘ri qarab turing. Yuzingiz to‘liq ko‘rinishi kerak.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black">
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user', width: 640, height: 853 }}
            className="aspect-[3/4] w-full object-cover"
            onUserMediaError={() =>
              setError('Kameraga ruxsat berilmagan yoki kamera topilmadi')
            }
          />

          {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
            <div
              key={pos}
              className={[
                'pointer-events-none absolute h-7 w-7',
                pos === 'tl'
                  ? 'left-3 top-3 border-l-2 border-t-2 rounded-tl-md'
                  : '',
                pos === 'tr'
                  ? 'right-3 top-3 border-r-2 border-t-2 rounded-tr-md'
                  : '',
                pos === 'bl'
                  ? 'bottom-3 left-3 border-b-2 border-l-2 rounded-bl-md'
                  : '',
                pos === 'br'
                  ? 'bottom-3 right-3 border-b-2 border-r-2 rounded-br-md'
                  : '',
                isReady ? 'border-emerald-400' : 'border-[#7FC3FF]/60',
              ].join(' ')}
              style={{ transition: 'border-color 0.3s ease' }}
            />
          ))}

          {showLoadingOverlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[#7FC3FF]" />
              <p className="text-sm font-medium text-white/60">
                Modellar yuklanmoqda…
              </p>
            </div>
          )}

          {showErrorOverlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6">
              <p className="text-sm font-semibold text-red-300">
                Detektor yuklanmadi
              </p>
              <button
                onClick={handleRetry}
                className="rounded-[12px] bg-white/10 px-5 py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform"
              >
                Qayta urinish
              </button>
            </div>
          )}
        </div>

        <div
          className={`rounded-[20px] border ${cfg.border} bg-[#081123] px-4 py-3 transition-all duration-300`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={[
                'h-2 w-2 flex-shrink-0 rounded-full',
                cfg.dot,
                isReady ? 'animate-pulse' : '',
              ].join(' ')}
            />
            <p className={`text-sm font-medium ${cfg.text}`}>
              {STATUS_MSG[status]}
            </p>
          </div>
          {cfg.hint && (
            <p className="mt-1.5 pl-[18px] text-xs text-[#93A3BE]">
              {cfg.hint}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#030715] px-4 pb-6 pt-4">
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-[14px] bg-red-500/10 px-3 py-2.5">
            <span className="mt-0.5 flex-shrink-0 text-sm text-red-400">
              ⚠
            </span>
            <p className="text-sm text-red-100">{error}</p>
          </div>
        )}
        <PrimaryButton
          onClick={capturePhoto}
          disabled={!isReady || isLoading}
          loading={isLoading}
        >
          {isLoading ? 'Yuklanmoqda…' : 'Suratga olish va tasdiqlash'}
        </PrimaryButton>
      </div>
    </div>
  );
};



// Screen7Documents
// ─────────────────────────────────────────────────────────────────────────────
function Screen7Documents({
  onNext,
  onBack,
  form,
  setForm,
  busy,
}: {
  onNext: () => void | Promise<void>;
  onBack: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  busy: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceUploadBusy, setFaceUploadBusy] = useState(false);

  const requiredMissing = DOCUMENT_TYPES.filter((d) => d.required && !form.documents[d.type]);
  const langsNeedingCert = form.languageSelections.filter((s) => s.hasCertificate);
  const langsCertMissing = langsNeedingCert.filter((s) => !s.certificateFile);
  const canContinue = requiredMissing.length === 0 && langsCertMissing.length === 0 && !busy;

  const processFacePhoto = async (file: File) => {
    setFaceUploadBusy(true);
    try {
      await candidateProcessPassportPhoto(file);
    } catch (err) {
      console.error(err);
      setError("Yuz suratini qayta ishlashda xato. Qayta urinib ko'ring.");
      throw err;
    } finally {
      setFaceUploadBusy(false);
    }
  };

  const handleSubmit = () => {
    if (requiredMissing.length > 0) {
      setError(`Majburiy hujjatlar: ${requiredMissing.map((d) => d.label).join(', ')}`);
      return;
    }
    if (langsCertMissing.length > 0) {
      setError('Til sertifikatlarini yuklang');
      return;
    }
    setError(null);
    setShowFaceCapture(true);
  };

  const handleFaceSuccess = async (file: File) => {
    await processFacePhoto(file);
    await onNext();
  };

  if (showFaceCapture) {
    return (
      <FaceCaptureScreen
        onBack={() => setShowFaceCapture(false)}
        onSuccess={handleFaceSuccess}
        busy={faceUploadBusy || busy}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <OnboardingHeader onBack={onBack} screen={9} />
      <ScreenScroll className="flex flex-col px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Hujjatlar
        </h2>

        <div className="mb-4 flex flex-col gap-4 pb-4">
          {/* Обязательные документы */}
          {DOCUMENT_TYPES.filter((d) => d.required).map((doc) => {
            const selectedFile = form.documents[doc.type];
            const inputId = `doc-file-${doc.type}`;
            return (
              <div
                key={doc.type}
                className="rounded-[16px] border p-4"
                style={{ borderColor: C.border, backgroundColor: C.card2 }}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-semibold" style={{ color: C.text }}>
                    {doc.label}
                  </span>
                  <span
                    className="text-[11px] font-semibold uppercase"
                    style={{ color: C.blue }}
                  >
                    Majburiy
                  </span>
                </div>
                <input
                  id={inputId}
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      documents: { ...f.documents, [doc.type]: e.target.files?.[0] ?? null },
                    }))
                  }
                />
                <label
                  htmlFor={inputId}
                  className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-[14px] border px-4 py-3 text-center text-sm font-semibold transition-all active:scale-[0.98]"
                  style={{
                    borderColor: C.blue,
                    backgroundColor: selectedFile ? C.blueSelected : C.card,
                    color: C.blueL,
                  }}
                >
                  {selectedFile ? 'Boshqa fayl tanlash' : 'Fayl tanlash'}
                </label>
                <p className="mt-2 text-[12px]" style={{ color: C.muted }}>
                  {selectedFile
                    ? `Tanlangan: ${selectedFile.name}`
                    : 'Rasm yoki PDF (maks. 10MB)'}
                </p>
              </div>
            );
          })}

          {/* Необязательные документы */}
          {DOCUMENT_TYPES.filter((d) => !d.required).map((doc) => {
            const selectedFile = form.documents[doc.type];
            const inputId = `doc-file-${doc.type}`;
            return (
              <div
                key={doc.type}
                className="rounded-[16px] border p-4"
                style={{ borderColor: C.border, backgroundColor: C.card2 }}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-semibold" style={{ color: C.text }}>
                    {doc.label}
                  </span>
                  <span
                    className="text-[11px] font-semibold uppercase"
                    style={{ color: C.muted }}
                  >
                    Ixtiyoriy
                  </span>
                </div>
                <input
                  id={inputId}
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      documents: { ...f.documents, [doc.type]: e.target.files?.[0] ?? null },
                    }))
                  }
                />
                <label
                  htmlFor={inputId}
                  className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-[14px] border px-4 py-3 text-center text-sm font-semibold transition-all active:scale-[0.98]"
                  style={{
                    borderColor: C.border,
                    backgroundColor: C.card,
                    color: C.text,
                  }}
                >
                  {selectedFile ? 'Boshqa fayl tanlash' : 'Fayl tanlash'}
                </label>
                <p className="mt-2 text-[12px]" style={{ color: C.muted }}>
                  {selectedFile
                    ? `Tanlangan: ${selectedFile.name}`
                    : 'Rasm yoki PDF (maks. 10MB)'}
                </p>
              </div>
            );
          })}

          {/* Языковые сертификаты */}
          {langsNeedingCert.length > 0 && (
            <div
              className="rounded-[16px] border p-4"
              style={{ borderColor: C.border, backgroundColor: C.card2 }}
            >
              <p className="mb-3 font-semibold" style={{ color: C.text }}>
                Til sertifikatlari
              </p>
              <div className="flex flex-col gap-3">
                {langsNeedingCert.map((s) => (
                  <div key={`doc-lang-${s.name}`}>
                    <p className="mb-1 text-[13px] font-medium" style={{ color: C.text }}>
                      {s.name} · {s.level}
                    </p>
                    <LanguageCertificateFileInput
                      inputId={`doc-step-lang-cert-${s.name.replace(/\s+/g, '-')}`}
                      file={s.certificateFile}
                      onChange={(file) =>
                        setForm((f) => ({
                          ...f,
                          languageSelections: f.languageSelections.map((ls) =>
                            ls.name === s.name ? { ...ls, certificateFile: file } : ls,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
            {error}
          </p>
        )}
      </ScreenScroll>

      <ScreenFooter>
        <PrimaryButton onClick={handleSubmit} disabled={!canContinue} loading={busy}>
          Yakunlash
        </PrimaryButton>
      </ScreenFooter>
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

  const span = SALARY_USD_MAX_BOUND - SALARY_USD_MIN_BOUND;
  const leftPct = ((form.desiredSalaryMin - SALARY_USD_MIN_BOUND) / span) * 100;
  const rightPct = ((form.desiredSalaryMax - SALARY_USD_MIN_BOUND) / span) * 100;
  const widthPct = Math.max(0, rightPct - leftPct);

  const valueFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return SALARY_USD_MIN_BOUND;
    const r = el.getBoundingClientRect();
    const t = r.width <= 0 ? 0 : Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const raw = SALARY_USD_MIN_BOUND + t * span;
    const stepped = Math.round(raw / SALARY_USD_STEP) * SALARY_USD_STEP;
    return Math.max(SALARY_USD_MIN_BOUND, Math.min(SALARY_USD_MAX_BOUND, stepped));
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
    const stepped = Math.round(v / SALARY_USD_STEP) * SALARY_USD_STEP;
    if (which === 'min') {
      setForm((f) => {
        const cap = f.desiredSalaryMax - SALARY_USD_STEP;
        const next = Math.min(Math.max(SALARY_USD_MIN_BOUND, stepped), cap);
        return { ...f, desiredSalaryMin: next };
      });
    } else {
      setForm((f) => {
        const floor = f.desiredSalaryMin + SALARY_USD_STEP;
        const next = Math.max(Math.min(SALARY_USD_MAX_BOUND, stepped), floor);
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
      <SectionLabel>Kutilayotgan oylik (AQSh dollari)</SectionLabel>
      <div className="mb-1 mt-2 flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: C.muted }}>
            Minimum
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: C.blueL }}>
            {form.desiredSalaryMin.toLocaleString('en-US')} $
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: C.muted }}>
            Maksimum
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: C.blueL }}>
            {form.desiredSalaryMax.toLocaleString('en-US')} $
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
          aria-label={`Minimal oylik: ${form.desiredSalaryMin} dollar`}
          className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: `${leftPct}%`, ...thumbStyle }}
        />
        <button
          type="button"
          data-salary-thumb="max"
          aria-label={`Maksimal oylik: ${form.desiredSalaryMax} dollar`}
          className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: `${rightPct}%`, ...thumbStyle }}
        />
      </div>
      <p className="text-[11px]" style={{ color: C.muted }}>
        Oraliq: {SALARY_USD_MIN_BOUND.toLocaleString('uz-UZ')} – {SALARY_USD_MAX_BOUND.toLocaleString('uz-UZ')} $ · qadam{' '}
        {SALARY_USD_STEP.toLocaleString('uz-UZ')} $
      </p>
    </div>
  );
}

function Screen8({
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
  const [destinationCountries, setDestinationCountries] = useState<DestinationCountryDto[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [destinationError, setDestinationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingCountries(true);
    setDestinationError(null);

    void candidateFetchDestinationCountries()
      .then((list) => {
        if (!cancelled) setDestinationCountries(list);
      })
      .catch((e) => {
        if (!cancelled) setDestinationError(candidatePortalError(e, 'Qiziqishlar ro‘yxati yuklanmadi.'));
      })
      .finally(() => {
        if (!cancelled) setLoadingCountries(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCountry = (id: string) => {
    setForm((f) => {
      if (f.countries.includes(id)) {
        return { ...f, countries: f.countries.filter((value) => value !== id) };
      }
      if (f.countries.length >= MAX_TARGET_COUNTRIES) {
        toast.error(`Eng ko‘pi bilan ${MAX_TARGET_COUNTRIES} ta davlat tanlash mumkin.`);
        return f;
      }
      return { ...f, countries: [...f.countries, id] };
    });
  };

  const countryTitle = (country: DestinationCountryDto) => {
    return (
      country.name_uz || country.name_ru || country.country_code || country.id || 'Davlat'
    );
  };

  const countriesOk = form.countries.length > 0;
  const canSubmit = !!form.availability && countriesOk;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <OnboardingHeader onBack={onBack} screen={8} />
      <ScreenScroll className="flex flex-col px-5">
        <h2
          className="mb-1.5"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            letterSpacing: '-0.5px',
            fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui",
          }}
        >
          Qaysi davlatda ishlamoqchisiz?
        </h2>
        <div className="mt-2">
          <SectionLabel>Qiziqishlar</SectionLabel>
          {form.countries.length > 0 ? (
            <p className="mt-1 text-[12px] font-medium tabular-nums" style={{ color: C.blueL }}>
              Tanlangan: {form.countries.length} / {MAX_TARGET_COUNTRIES}
            </p>
          ) : null}
        </div>
        {loadingCountries ? (
          <div className="flex flex-col items-center justify-start py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: C.blueL }} />
            <p className="mt-3 text-sm" style={{ color: C.muted }}>
              Davlatlar ro‘yxati yuklanmoqda…
            </p>
          </div>
        ) : destinationError ? (
          <div className="rounded-[14px] border border-red-500 bg-[#4B1F1F] px-4 py-3 text-sm" style={{ color: C.text }}>
            {destinationError}
          </div>
        ) : (
          <div className="grid gap-2.5 pb-3">
            {destinationCountries.map((country) => {
              const selected = form.countries.includes(country.id);
              const atLimit = form.countries.length >= MAX_TARGET_COUNTRIES && !selected;
              const flag = countryFlagEmoji(country.country_code);
              return (
                <OptionCard
                  key={country.id}
                  selected={selected}
                  onClick={() => {
                    if (atLimit) {
                      toast.error(`Eng ko‘pi bilan ${MAX_TARGET_COUNTRIES} ta davlat tanlash mumkin.`);
                      return;
                    }
                    toggleCountry(country.id);
                  }}
                  left={<span className="shrink-0 text-lg">{flag}</span>}
                  title={countryTitle(country)}
                  desc={country.note || country.language_req || 'Vakansiyalar qidiriladi'}
                />
              );
            })}
          </div>
        )}

        <div className="mb-5 h-px w-full" style={{ backgroundColor: C.border }} aria-hidden />

        <SectionLabel>Qachon migratsiya qilishga tayyorsiz?</SectionLabel>
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
      </ScreenScroll>
      <ScreenFooter>
        <PrimaryButton onClick={onNext} disabled={!canSubmit || loadingCountries} loading={busy}>
          Keyingi
        </PrimaryButton>
      </ScreenFooter>
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
  if (!raw || !raw.trim()) return FIELD_EMPTY;
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

/** `null` yoki bo‘sh string — default enum qo‘llanmasin */
function pickProfileEnum(obj: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!obj) return '';
  for (const k of keys) {
    if (!(k in obj)) continue;
    const v = obj[k];
    if (v == null) return '';
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function educationSelectValueFromProfile(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  const u = t.toUpperCase();
  if ((EDUCATION_LEVEL_SELECT_ORDER as readonly string[]).includes(u)) return u;
  return t;
}

function pickTargetCountryCodeFromItem(o: Record<string, unknown>): string {
  const direct = pickStr(o, 'country_code', 'countryCode', 'code');
  if (direct) return direct.toUpperCase();
  const dest = o.destination_country ?? o.destinationCountry;
  if (dest && typeof dest === 'object' && !Array.isArray(dest)) {
    return pickStr(dest as Record<string, unknown>, 'country_code', 'countryCode').toUpperCase();
  }
  return '';
}

function parseTargetCountryRows(
  tc: unknown,
): Array<{ code: string; pr: number }> {
  if (!Array.isArray(tc)) return [];
  type Row = { code: string; pr: number };
  const rows: Row[] = [];
  for (const item of tc) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      const code = pickTargetCountryCodeFromItem(o);
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
  if (!u) return FIELD_EMPTY;
  const flag = countryFlagEmoji(u);
  const name = countryNameUz(u);
  return name ? `${flag} ${name}` : flag;
}

function profileStatusLabelUz(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return FIELD_EMPTY;
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

/** Profil / summary dan viloyat nomi — `region_name`, `region_id`, manzil select */
function regionDisplayFromProfile(profile: Record<string, unknown> | null): string {
  if (!profile) return '';
  const direct = pickStr(
    profile,
    'region_name_uz',
    'regionNameUz',
    'region_name',
    'regionName',
  );
  if (direct) return direct;

  const regionField = pickStr(profile, 'region');
  if (regionField && !/^\d+$/.test(regionField)) return regionField;

  const addressRegion = pickStr(profile, 'addressRegion', 'address_region');
  const regionId =
    normalizeCandidateRegionId(pickNum(profile, 'region_id', 'regionId')) ??
    normalizeCandidateRegionId(pickStr(profile, 'region_id', 'regionId'));

  const fromInputs = candidateRegionFieldsFromInputs({
    regionId,
    regionLabelUz: direct || regionField,
    addressRegion,
  });
  if (fromInputs?.region_name_uz) return fromInputs.region_name_uz;

  if (addressRegion) {
    const fromAddress = resolvePublicRegionNameUz(addressRegion).trim();
    if (fromAddress) return fromAddress;
  }
  if (regionId != null) {
    const fromId = resolvePublicRegionNameUz(regionId).trim();
    if (fromId) return fromId;
  }
  return '';
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
  const hasRegion = !!regionDisplayFromProfile(profile);
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
    { key: 'countries', label: 'Qiziqishlar (davlatlar)', ok: countriesOk },
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
      labelUz: 'Qiziqishlar',
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
  if (!s) return FIELD_EMPTY;
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
  return parts.join(' ') || FIELD_EMPTY;
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
  const cur = formatSalaryCurrencyLabel(String(v.salary_currency ?? v.salaryCurrency ?? 'USD'));
  if (typeof min === 'number' && typeof max === 'number') return `${min.toLocaleString('uz-UZ')} – ${max.toLocaleString('uz-UZ')} ${cur}/oy`;
  if (typeof min === 'number') return `${min.toLocaleString('uz-UZ')}+ ${cur}/oy`;
  return FIELD_EMPTY;
}

function vacancyTitle(v: PublicVacancyRow): string {
  return String(v.title ?? v.employer_name ?? v.employerName ?? 'Vakansiya');
}

function vacancyCountryCode(v: PublicVacancyRow): string {
  const c = v.country_code ?? v.countryCode;
  return typeof c === 'string' ? c : '';
}

function targetCountriesSummary(profile: Record<string, unknown> | null): string {
  if (!profile) return FIELD_EMPTY;
  const tc = profile.target_countries ?? profile.targetCountries;
  const rows = parseTargetCountryRows(tc);
  if (rows.length) {
    const parts = rows.map((r) => {
      const name = countryNameUz(r.code);
      const flag = countryFlagEmoji(r.code);
      return name ? `${flag} ${name}` : flag;
    });
    return parts.join(', ') || FIELD_EMPTY;
  }
  const single = pickStr(profile, 'target_country_code', 'targetCountryCode', 'primary_target_country');
  if (single) {
    const u = single.toUpperCase();
    const name = countryNameUz(u);
    const flag = countryFlagEmoji(u);
    return name ? `${flag} ${name}` : flag;
  }
  return FIELD_EMPTY;
}

function targetCountryRows(profile: Record<string, unknown> | null): Array<{ code: string; pr: number }> {
  if (!profile) return [];
  const tc = profile.target_countries ?? profile.targetCountries;
  return parseTargetCountryRows(tc);
}

function languagesSummary(profile: Record<string, unknown> | null): string {
  if (!profile) return FIELD_EMPTY;
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
    return parts.filter(Boolean).join(' · ') || FIELD_EMPTY;
  }
  const flat = pickStr(profile, 'languages');
  if (flat.includes(',')) {
    const parts = flat
      .split(',')
      .map((x) => uzOrCode(adminLanguageUz, x.trim().toUpperCase()))
      .filter(Boolean);
    return parts.length ? parts.join(' · ') : FIELD_EMPTY;
  }
  return FIELD_EMPTY;
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
      <span className="shrink-0" style={{ fontSize: 13, color: C.muted }}>
        {label}
      </span>
      <span
        className="min-w-0 break-words sm:max-w-[70%] sm:text-right"
        style={{ fontSize: 15, fontWeight: 600, color: C.text }}
      >
        {displayField(value)}
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
  const { totalRounded } = useMemo(() => summarizeProfileCompletion(profile), [profile]);
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
        </div>
        <div className="text-right">
          <p className="text-[12px] font-semibold tabular-nums" style={{ color: C.text }}>
            {reqDone}/{required.length}
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
    </div>
  );
}

function ProfileFileActions({
  fileUrl,
  fileName,
  onDelete,
  deleting,
  allowPreview,
}: {
  fileUrl: string;
  fileName?: string;
  onDelete?: () => void | Promise<void>;
  deleting?: boolean;
  /** Masalan PHOTO — rasm bo‘lsa ko‘rishga urinish */
  allowPreview?: boolean;
}) {
  const resolved = resolveCandidateFileUrl(fileUrl);
  const canPreview =
    !!resolved && (allowPreview === true || canPreviewCandidateFile(resolved, fileName));

  const handleView = () => {
    if (!resolved) {
      toast.error('Fayl manzili topilmadi.');
      return;
    }
    if (!canPreview) {
      toast.error('Bu faylni ko‘rib bo‘lmaydi.');
      return;
    }
    window.open(resolved, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {fileUrl ? (
        <button
          type="button"
          onClick={handleView}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95 disabled:opacity-50"
          style={{ borderColor: C.border, color: canPreview ? C.blueL : C.muted }}
          aria-label="Ko‘rish"
        >
          <Eye size={18} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          onClick={() => void onDelete()}
          disabled={deleting}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95 disabled:opacity-50"
          style={{ borderColor: `${C.red}66`, color: C.red }}
          aria-label="O‘chirish"
        >
          <Trash2 size={18} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

type ProfileDocType =
  | 'PASSPORT'
  | 'DIPLOMA'
  | 'CERTIFICATE'
  | 'PHOTO'
  | 'WORK_PERMIT'
  | 'OTHER';

const PROFILE_DOCUMENT_SLOTS: Array<{ type: ProfileDocType; label: string }> = [
  { type: 'PASSPORT', label: documentTypeUz.PASSPORT },
  { type: 'PHOTO', label: documentTypeUz.PHOTO },
  { type: 'DIPLOMA', label: documentTypeUz.DIPLOMA },
  { type: 'CERTIFICATE', label: documentTypeUz.CERTIFICATE },
  { type: 'WORK_PERMIT', label: documentTypeUz.WORK_PERMIT },
  { type: 'OTHER', label: documentTypeUz.OTHER },
];

function ProfileDocumentUploadSlot({
  docType,
  label,
  onUploaded,
}: {
  docType: ProfileDocType;
  label: string;
  onUploaded: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const inputId = `profile-doc-reupload-${docType}`;

  const upload = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      await candidateUploadDocument(file, docType);
      toast.success('Hujjat yuklandi.');
      onUploaded();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Hujjatni yuklashda xato.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-dashed px-3 py-2.5"
      style={{ borderColor: C.border, backgroundColor: C.card2 }}
    >
      <p className="mb-2 text-[13px] font-semibold" style={{ color: C.text }}>
        {label}
      </p>
      <input
        id={inputId}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = '';
          void upload(f);
        }}
      />
      <label
        htmlFor={inputId}
        className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-[12px] border px-3 py-2.5 text-center text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
        style={{
          borderColor: C.blue,
          backgroundColor: C.blueSelected,
          color: C.blueL,
          pointerEvents: busy ? 'none' : undefined,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? 'Yuklanmoqda…' : 'Fayl yuklash'}
      </label>
      <p className="mt-1.5 text-[11px]" style={{ color: C.muted }}>
        Rasm yoki PDF
      </p>
    </div>
  );
}

/** Profil — qiziqishlar, tajriba, tillar va h.k. */
function ProfileDetailSections({
  profile,
  onRefresh,
}: {
  profile: Record<string, unknown> | null;
  onRefresh?: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!profile) return null;
  const tcRows = targetCountryRows(profile);
  const weList = workExperiencesArray(profile);
  const langsArr = profile.languages ?? profile.candidate_languages ?? profile.candidateLanguages;
  const educations = profile.educations;
  const documents = profile.documents;
  const skills = profile.skills;

  const presentDocTypes = new Set<string>();
  if (Array.isArray(documents)) {
    for (const doc of documents) {
      if (!doc || typeof doc !== 'object') continue;
      const t = pickStr(doc as Record<string, unknown>, 'document_type', 'documentType').toUpperCase();
      if (t) presentDocTypes.add(t);
    }
  }
  const missingDocSlots = PROFILE_DOCUMENT_SLOTS.filter((d) => !presentDocTypes.has(d.type));

  const deleteDocument = async (docId: string) => {
    setDeletingId(docId);
    try {
      await candidateDeleteDocument(docId);
      toast.success('Hujjat o‘chirildi.');
      onRefresh?.();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Hujjatni o‘chirishda xato.'));
    } finally {
      setDeletingId(null);
    }
  };

  const sectionTitle = (title: string) => (
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
      {title}
    </p>
  );

  const card = (children: ReactNode) => (
    <div
      className="mt-4 rounded-[18px] border p-4"
      style={{ backgroundColor: C.card, borderColor: C.border }}
    >
      {children}
    </div>
  );

  return (
    <>
      {card(
        <>
          {sectionTitle('Qiziqishlar')}
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
              {FIELD_EMPTY}
            </p>
          )}
        </>,
      )}
      {card(
        <>
          {sectionTitle('Ish tajribasi')}
          {weList.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {weList.map((row, i) => {
                if (!row || typeof row !== 'object') return null;
                const o = row as Record<string, unknown>;
                const desc = pickStr(o, 'description');
                const dur = formatWorkExperienceDuration(o);
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
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
              {FIELD_EMPTY}
            </p>
          )}
        </>,
      )}
      {card(
        <>
          {sectionTitle('Tillar')}
          {Array.isArray(langsArr) && langsArr.length > 0 ? (
            <div className="flex flex-col gap-2">
              {langsArr.map((item, i) => {
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
                const certUrl = pickStr(
                  o,
                  'certificate_file_url',
                  'certificateFileUrl',
                  'certificate_url',
                  'certificateUrl',
                );
                return (
                  <div
                    key={pickStr(o, 'id') || `lang-${i}`}
                    className="flex flex-col gap-2 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: C.border, backgroundColor: C.card2 }}
                  >
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</p>
                      {levelUz ? (
                        <p className="text-[12px]" style={{ color: C.muted }}>
                          Daraja: {levelUz}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px]" style={{ color: cert ? C.gold : C.muted }}>
                        {cert
                          ? certUrl
                            ? 'Sertifikat yuklangan'
                            : 'Sertifikat kerak — hujjatlar qadamida yuklang'
                          : 'Sertifikat yo‘q'}
                      </p>
                    </div>
                    {cert && certUrl ? (
                      <ProfileFileActions fileUrl={certUrl} fileName={pickStr(o, 'certificate_file_name', 'fileName')} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
              {FIELD_EMPTY}
            </p>
          )}
        </>,
      )}
      {card(
        <>
          {sectionTitle('Ta’lim')}
          {Array.isArray(educations) && educations.length > 0 ? (
            <div className="flex flex-col gap-3">
              {educations.map((ed, i) => {
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
              {FIELD_EMPTY}
            </p>
          )}
        </>,
      )}
      {card(
        <>
          {sectionTitle('Hujjatlar')}
          {Array.isArray(documents) && documents.length > 0 ? (
            <div className="mb-3 flex flex-col gap-2">
              {documents.map((doc, i) => {
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
                const docId = pickStr(D, 'id');
                return (
                  <div
                    key={`doc-${i}`}
                    className="flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: C.border, backgroundColor: C.card2 }}
                  >
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{line}</p>
                      {fname ? (
                        <p className="truncate text-[12px]" style={{ color: C.muted }}>
                          {fname}
                        </p>
                      ) : null}
                      <p className="text-[11px]" style={{ color: verified ? C.green : C.muted }}>
                        {verified ? 'Tasdiqlangan' : 'Tekshiruvda / tasdiqlanmagan'}
                      </p>
                    </div>
                    {url || docId ? (
                      <ProfileFileActions
                        fileUrl={url}
                        fileName={fname}
                        allowPreview={dtype === 'PHOTO'}
                        onDelete={docId ? () => deleteDocument(docId) : undefined}
                        deleting={docId ? deletingId === docId : false}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mb-3 text-[13px] leading-relaxed" style={{ color: C.muted }}>
              {FIELD_EMPTY}
            </p>
          )}
          {missingDocSlots.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-medium" style={{ color: C.muted }}>
                Yuklash uchun turini tanlang
              </p>
              {missingDocSlots.map((slot) => (
                <ProfileDocumentUploadSlot
                  key={`upload-${slot.type}`}
                  docType={slot.type}
                  label={slot.label}
                  onUploaded={() => onRefresh?.()}
                />
              ))}
            </div>
          ) : null}
        </>,
      )}
      {card(
        <>
          {sectionTitle('Ko‘nikmalar')}
          {Array.isArray(skills) && skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((sk, i) => {
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
              {FIELD_EMPTY}
            </p>
          )}
        </>,
      )}
    </>
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
  const [marital, setMarital] = useState('');
  const [edu, setEdu] = useState('');
  const [avail, setAvail] = useState('');
  const [exp, setExp] = useState('');
  const [salMin, setSalMin] = useState(SALARY_USD_DEFAULT_MIN);
  const [salMax, setSalMax] = useState(SALARY_USD_DEFAULT_MAX);
  const [consent, setConsent] = useState(true);
  const [regionSelect, setRegionSelect] = useState<number | ''>('');
  const [regionOptions, setRegionOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [customProf, setCustomProf] = useState('');
  const [photoDeleting, setPhotoDeleting] = useState(false);

  useEffect(() => {
    void ensurePublicRegionsLoaded()
      .then((list) =>
        setRegionOptions(
          list.map((r) => ({
            id: r.id,
            label: r.name_uz ?? r.name_ru ?? String(r.id),
          })),
        ),
      )
      .catch(() => setRegionOptions([]));
  }, []);

  const applyServerToDraft = useCallback(() => {
    if (!profile) return;
    setMarital(pickProfileEnum(profile, 'marital_status', 'maritalStatus'));
    setEdu(educationSelectValueFromProfile(pickProfileEnum(profile, 'education_level', 'educationLevel')));
    setAvail(pickProfileEnum(profile, 'availability_status', 'availabilityStatus'));
    setExp(pickProfileEnum(profile, 'experience_range', 'experienceRange'));
    setSalMin(pickNum(profile, 'desired_salary_min', 'desiredSalaryMin') ?? SALARY_USD_DEFAULT_MIN);
    setSalMax(pickNum(profile, 'desired_salary_max', 'desiredSalaryMax') ?? SALARY_USD_DEFAULT_MAX);
    setConsent(profile.data_consent === true || profile.dataConsent === true);
    let rid =
      normalizeCandidateRegionId(pickNum(profile, 'region_id', 'regionId')) ??
      normalizeCandidateRegionId(pickStr(profile, 'region_id', 'regionId'));
    if (rid == null) {
      const fromAddr = candidateRegionFieldsFromInputs({
        addressRegion: pickStr(profile, 'addressRegion', 'address_region'),
        regionLabelUz: pickStr(profile, 'region_name_uz', 'regionNameUz', 'region_name', 'regionName', 'region'),
      });
      rid = fromAddr?.region_id;
    }
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
  const phoneLocal = displayField(pickStr(profile, 'phone_number', 'phoneNumber', 'phone', 'mobile'));
  const birthLocal = formatProfileDateOnly(
    pickStr(profile, 'date_birth', 'dateBirth', 'birth_date', 'birthDate'),
  );
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

  const photoDoc = (() => {
    const docs = profile.documents;
    if (!Array.isArray(docs)) return null;
    for (const d of docs) {
      if (!d || typeof d !== 'object') continue;
      const o = d as Record<string, unknown>;
      if (pickStr(o, 'document_type', 'documentType').toUpperCase() === 'PHOTO') return o;
    }
    return null;
  })();
  const photoUrl = photoDoc ? pickStr(photoDoc, 'file_url', 'fileUrl') : '';
  const photoFname = photoDoc ? pickStr(photoDoc, 'file_name', 'fileName') : '';
  const photoDocId = photoDoc ? pickStr(photoDoc, 'id') : '';
  const photoResolved = photoUrl ? resolveCandidateFileUrl(photoUrl) : '';
  const photoCanShow =
    !!photoResolved && canPreviewCandidateFile(photoResolved, photoFname);

  const deleteProfilePhoto = async () => {
    if (!photoDocId) return;
    setPhotoDeleting(true);
    try {
      await candidateDeleteDocument(photoDocId);
      toast.success('Profil rasmi o‘chirildi.');
      onSaved();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Rasmni o‘chirishda xato.'));
    } finally {
      setPhotoDeleting(false);
    }
  };

  const save = async () => {
    if (salMin > salMax) {
      toast.error('Minimal maosh maksimaldan katta bo‘lmasligi kerak.');
      return;
    }
    setBusy(true);
    try {
      const body: CandidateProfileUpdateBody = {
        data_consent: consent,
        desired_salary_min: salMin,
        desired_salary_max: salMax,
        salary_currency: CANDIDATE_SALARY_CURRENCY,
      };
      if (marital.trim()) body.marital_status = marital.trim();
      if (edu.trim()) body.education_level = normalizeEducationLevelForApi(edu);
      if (avail.trim()) body.availability_status = avail.trim();
      if (exp.trim()) body.experience_range = exp.trim();
      if (regionSelect !== '') {
        const rid = normalizeCandidateRegionId(regionSelect);
        if (rid == null) {
          toast.error('Hududni ro‘yxatdan tanlang.');
          setBusy(false);
          return;
        }
        const selected = regionOptions.find((r) => r.id === rid);
        const locationFields = candidateLocationFieldsFromForm({
          regionId: rid,
          regionLabelUz: selected?.label,
          addressRegion: pickStr(profile, 'addressRegion', 'address_region'),
          addressDistrict: pickStr(profile, 'addressDistrict', 'address_district'),
          addressMFY: pickStr(profile, 'addressMFY', 'address_mfy', 'mfy_name_uz'),
          address: pickStr(profile, 'address', 'address_uz', 'address_line'),
        });
        Object.assign(body, locationFields);
      } else {
        body.region_id = '';
        body.region_name_uz = '';
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
          </div>
        </div>
      </div>

      {photoUrl || photoDocId ? (
        <div
          className="mb-4 flex items-center gap-3 rounded-xl border p-3"
          style={{ borderColor: C.border, backgroundColor: C.card2 }}
        >
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ backgroundColor: C.blue, border: `1px solid ${C.border}` }}
          >
            {photoCanShow ? (
              <img src={photoResolved} alt="" className="h-full w-full object-cover" />
            ) : (
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {initialsFromName(displayNameLocal)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold" style={{ color: C.text }}>
              Profil rasmi
            </p>
            {photoFname ? (
              <p className="truncate text-[11px]" style={{ color: C.muted }}>
                {photoFname}
              </p>
            ) : null}
          </div>
          <ProfileFileActions
            fileUrl={photoUrl}
            fileName={photoFname}
            allowPreview
            onDelete={photoDocId ? () => void deleteProfilePhoto() : undefined}
            deleting={photoDeleting}
          />
        </div>
      ) : null}

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
        <label className="block">
          <span className="mb-0.5 block text-[12px] font-medium" style={{ color: C.muted }}>
            Oilaviy holat
          </span>
          <select className={ctl} style={fieldStyle} value={marital} onChange={(e) => setMarital(e.target.value)}>
            <option value="">{FIELD_EMPTY}</option>
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
            <option value="">{FIELD_EMPTY}</option>
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
            <option value="">{FIELD_EMPTY}</option>
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
            <option value="">{FIELD_EMPTY}</option>
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
              min={SALARY_USD_MIN_BOUND}
              max={SALARY_USD_MAX_BOUND}
              step={SALARY_USD_STEP}
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
              min={SALARY_USD_MIN_BOUND}
              max={SALARY_USD_MAX_BOUND}
              step={SALARY_USD_STEP}
              onChange={(e) => setSalMax(Number(e.target.value) || 0)}
            />
          </label>
        </div>
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
            <option value="">{FIELD_EMPTY}</option>
            {regionOptions.map((r) => (
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

      <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3" style={{ borderColor: C.border }}>
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

      <ProfileDetailSections profile={profile} onRefresh={onSaved} />

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
            Saqlash
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
    const cached = getCachedCandidateSummary();
    if (cached) {
      setProfile(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setLoadErr(null);
    setSoftWarn(null);
    try {
      const [me, vac] = await Promise.all([
        candidateFetchMeSummary().catch(() => candidateFetchProfileMe()),
        candidateFetchVacancies({}),
      ]);
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
  const salaryCur = formatSalaryCurrencyLabel(pickStr(profile, 'salary_currency', 'salaryCurrency') || 'USD');
  const salaryTxt =
    salaryMin != null && salaryMax != null
      ? `${salaryMin.toLocaleString('uz-UZ')} – ${salaryMax.toLocaleString('uz-UZ')} ${salaryCur}`
      : salaryMin != null
        ? `${salaryMin.toLocaleString('uz-UZ')}+ ${salaryCur}`
        : FIELD_EMPTY;
  const availability = pickStr(profile, 'availability_status', 'availabilityStatus');
  const experience = pickStr(profile, 'experience_range', 'experienceRange');
  const edu = pickStr(profile, 'education_level', 'educationLevel');
  const created = pickStr(profile, 'created_at', 'createdAt', 'created');
  const updated = pickStr(profile, 'updated_at', 'updatedAt', 'updated');
  const createdFmt = formatPortalDateTime(created);
  const updatedFmt = formatPortalDateTime(updated);
  const region = regionDisplayFromProfile(profile);
  const marital = pickProfileEnum(profile, 'marital_status', 'maritalStatus');
  const maritalUz = marital ? uzOrCode(maritalStatusUz, marital) : '';
  const consentRaw = profile?.data_consent ?? profile?.dataConsent;
  const consentTxt =
    typeof consentRaw === 'boolean' ? (consentRaw ? 'Berilgan' : FIELD_EMPTY) : FIELD_EMPTY;
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
  const langsArr = profile?.languages ?? profile?.candidate_languages ?? profile?.candidateLanguages;
  const hasLangsArr = Array.isArray(langsArr) && langsArr.length > 0;
  const hasRegionField = !!region;

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

  const hasCountries = tcRows.length > 0;
  const hasLangs = hasLangsArr;
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
          const bits = [dur !== FIELD_EMPTY ? dur : '', d].filter(Boolean);
          return bits.join(' — ') || `Qator ${i + 1}`;
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
              [hasCountries, '✓ Qiziqishlar', '+ Qiziqishlar'],
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
          <ProfileInfoRow label="Telefon" value={displayField(phone)} />
          <ProfileInfoRow label="Tug‘ilgan sana" value={dateBirthFmt} />
          <ProfileInfoRow label="Oilaviy holat" value={displayField(maritalUz)} />
          <ProfileInfoRow label="Hudud" value={displayField(region)} />
          <ProfileInfoRow label="Kasb / ish tajribasi" value={displayField(profession)} />
          <ProfileInfoRow label="Ish tajribasi (bandlar)" value={displayField(workExpSummary)} />
          <ProfileInfoRow label="Ta’lim darajasi" value={displayField(eduUz)} />
          <ProfileInfoRow label="Ish tajribasi (oraliq)" value={displayField(experienceUz)} />
          <ProfileInfoRow label="Ishga tayyorgarlik" value={displayField(availabilityUz)} />
          <ProfileInfoRow label="Tillar" value={langs} />
          <ProfileInfoRow label="Kutilayotgan maosh" value={salaryTxt} />
          <ProfileInfoRow label="Qiziqishlar" value={countries} />
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
        <ProfileCompletenessPanel profile={profile} />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col" style={{ backgroundColor: C.bg }}>
      <div
        className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 pb-3 sm:px-4"
        style={{
          backgroundColor: C.card,
          borderBottom: `1px solid ${C.border}`,
          paddingTop: 'max(var(--portal-top-inset, 12px), env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="truncate"
            style={{
              fontSize: 15,
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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: C.blue }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{initials}</span>
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
              <span style={{ fontSize: 12, fontWeight: 500, color: active ? C.blue : C.muted }}>{item.label}</span>
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
  const [tgBootstrapBusy, setTgBootstrapBusy] = useState(false);
  const telegramUiInitedRef = useRef(false);
  const entryContextLabel = useMemo(
    () => telegramEntryContextLabel(getTelegramEntryContext()),
    [],
  );
  const [screen, setScreen] = useState<Screen>(1);
  const portalChrome = usePortalChromeInsets(view === 'onboarding');
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    if (view !== 'onboarding') return;
    document.querySelectorAll('.kasb-portal-screen-scroll').forEach((el) => {
      el.scrollTop = 0;
    });
  }, [screen, view]);
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
    desiredSalaryMin: SALARY_USD_DEFAULT_MIN,
    desiredSalaryMax: SALARY_USD_DEFAULT_MAX,
    profileFirstName: '',
    profileLastName: '',
    profileGender: 'ERKAK',
    profileDateBirth: '2000-01-01',
    addressRegion: '',
    addressDistrict: '',
    addressMFY: '',
    address: '',
    educationLevel: '',
    educationRegionId: null,
    educationUniversityId: null,
    educationInstitutionName: '',
    educationSpecialty: '',
    educationGraduationYear: null,
    educationCountry: 'UZB',
    documents: {},
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
  }, [
    form.profileFirstName,
    form.profileLastName,
    form.profileGender,
    form.profileDateBirth,
    form.addressRegion,
    form.addressDistrict,
    form.addressMFY,
    form.address,
  ]);

  const clearTelegramUrlParams = useCallback(() => {
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
  }, [setSearchParams]);

  useLayoutEffect(() => {
    let cancelled = false;
    setTgBootstrapBusy(true);
    void (async () => {
      try {
        if (isTelegramMiniApp()) initTelegramMiniApp();
        const tgCid = isTelegramMiniApp()
          ? (trimmedTg || miniAppChatId || readTelegramMiniAppChatId()).trim()
          : '';
        const dest = await bootstrapCandidatePortalSession({ telegramChatId: tgCid });
        if (!cancelled && dest === 'home') {
          setHomeInitialTab(3);
          setView('home');
          clearTelegramUrlParams();
        }
      } finally {
        if (!cancelled) {
          setSessionBootstrapped(true);
          setTgBootstrapBusy(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trimmedTg, miniAppChatId, clearTelegramUrlParams]);

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

  const goNext = () => setScreen((s) => (Math.min(s + 1, 9) as Screen));
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
      const userId = await candidateUpdateMyUser({
        firstName: form.profileFirstName.trim(),
        lastName: form.profileLastName.trim(),
        genderType: form.profileGender,
        dateBirth: form.profileDateBirth,
        phoneNumber: phoneE164,
        addressRegion: form.addressRegion.trim() || null,
        addressDistrict: form.addressDistrict.trim() || null,
        addressMFY: form.addressMFY.trim() || null,
        address: form.address.trim() || null,
        telegramChatId,
      });
      const locationFields = candidateLocationFieldsFromForm({
        addressRegion: form.addressRegion,
        addressDistrict: form.addressDistrict,
        addressMFY: form.addressMFY,
        address: form.address,
      });
      await linkCandidateProfileAfterUserEdit(userId, {
        ...PROFILE_ENSURE_BASE,
        ...locationFields,
      });
      if (
        locationFields.region_id != null ||
        locationFields.region_name_uz ||
        locationFields.district_name_uz
      ) {
        await candidateUpdateProfile(locationFields);
      }
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

  async function saveEducationAndNext() {
    if (!form.educationLevel) {
      toast.error('Ta’lim darajasini tanlang.');
      return;
    }
    if (!form.educationInstitutionName.trim()) {
      toast.error(
        educationLevelUsesOtmPicker(form.educationLevel)
          ? 'OTM yoki muassasani tanlang.'
          : 'Ta’lim muassasasini kiriting.',
      );
      return;
    }
    if (form.educationGraduationYear == null || form.educationGraduationYear < 1950) {
      toast.error('Tugatgan yilni tanlang.');
      return;
    }

    setBusy(true);
    try {
      await ensureCandidateProfile({
        ...PROFILE_ENSURE_BASE,
        education_level: normalizeEducationLevelForApi(form.educationLevel),
      });
      await candidateAddEducation({
        level: form.educationLevel,
        institution_name: form.educationInstitutionName.trim(),
        graduation_year: form.educationGraduationYear,
        country: form.educationCountry,
        ...(form.educationSpecialty.trim() ? { specialty: form.educationSpecialty.trim() } : {}),
      });
      await candidateUpdateProfile({
        education_level: normalizeEducationLevelForApi(form.educationLevel),
        data_consent: true,
      });
      goNext();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Ta’lim ma’lumotlarini saqlashda xato.'));
    } finally {
      setBusy(false);
    }
  }

  async function saveWorkAndNext(entriesOverride?: CandidateWorkExperienceBody[]) {
    const entries = entriesOverride ?? form.workExperienceEntries;
    if (!entries.length) {
      toast.error('Kamida bitta ish tajribasini kiriting.');
      return;
    }
    const lead = entries[0]!;
    const customName = lead.custom_profession_name?.trim() ?? '';
    if (lead.profession_category_id == null || lead.profession_category_id <= 0) {
      toast.error('Kasb toifasi aniqlanmadi.');
      return;
    }
    if ((lead.profession_id == null || lead.profession_id <= 0) && !customName) {
      toast.error('Kasb tanlanmagan yoki maxsus nomi kiritilmagan.');
      return;
    }

    setBusy(true);
    try {
      await ensureCandidateProfile({ ...PROFILE_ENSURE_BASE });
      await candidateAddWorkExperience(entries);
      await candidateUpdateProfile({
        data_consent: true,
        experience_range: experienceRangeFromWorkEntries(entries),
        profession_id: lead.profession_id,
        profession_category_id: lead.profession_category_id,
        ...(customName ? { custom_profession_name: customName } : {}),
      });
      goNext();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Ish tajribasini saqlashda xato.'));
    } finally {
      setBusy(false);
    }
  }

  async function saveLanguagesAndNext() {
    if (!form.declaresNoLanguage && form.languageSelections.length === 0) {
      toast.error('Kamida bitta til tanlang yoki «Til bilmayman» ni belgilang.');
      return;
    }
    setBusy(true);
    try {
      await ensureCandidateProfile({ ...PROFILE_ENSURE_BASE });
      if (!form.declaresNoLanguage) {
        for (const sel of form.languageSelections) {
          if (sel.hasCertificate && !sel.certificateFile) {
            toast.error(`${sel.name} uchun sertifikat faylini yuklang.`);
            setBusy(false);
            return;
          }
        }
        for (const sel of form.languageSelections) {
          const lang = toCandidateLanguageEnum(sel.name);
          if (!lang) continue;
          await candidateAddLanguage({
            language: lang,
            level: sel.level,
            has_certificate: sel.hasCertificate === true,
            certificateFile: sel.hasCertificate ? sel.certificateFile : null,
          });
        }
      }
      goNext();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Til ma’lumotlarini saqlashda xato.'));
    } finally {
      setBusy(false);
    }
  }

  async function saveCountriesAndNext() {
    if (!form.countries.length) {
      toast.error('Kamida bitta qiziqish (davlat) tanlang.');
      return;
    }
    if (form.countries.length > MAX_TARGET_COUNTRIES) {
      toast.error(`Eng ko‘pi bilan ${MAX_TARGET_COUNTRIES} ta davlat tanlash mumkin.`);
      return;
    }
    if (!form.availability) {
      toast.error('Bandlik tayyorgarligini tanlang.');
      return;
    }

    setBusy(true);
    try {
      await ensureCandidateProfile({ ...PROFILE_ENSURE_BASE });
      for (let i = 0; i < form.countries.length; i++) {
        const destination_country_id = form.countries[i]!;
        await candidateAddTargetCountry({ destination_country_id, priority: i + 1 });
      }
      const entries = form.workExperienceEntries;
      await candidateUpdateProfile({
        data_consent: true,
        availability_status: availabilityStatusFromForm(form),
        desired_salary_min: form.desiredSalaryMin,
        desired_salary_max: form.desiredSalaryMax,
        salary_currency: CANDIDATE_SALARY_CURRENCY,
        ...(entries.length > 0
          ? { experience_range: experienceRangeFromWorkEntries(entries) }
          : {}),
      });
      goNext();
    } catch (e) {
      toast.error(candidatePortalError(e, 'Qiziqishlarni saqlashda xato.'));
    } finally {
      setBusy(false);
    }
  }

  async function finishDocumentsAndGoHome() {
    const requiredMissing = DOCUMENT_TYPES.filter((d) => d.required && !form.documents[d.type]);
    if (requiredMissing.length > 0) {
      toast.error(`Majburiy hujjatlar: ${requiredMissing.map((d) => d.label).join(', ')}`);
      return;
    }
    const filesToUpload = DOCUMENT_TYPES.filter((d) => !!form.documents[d.type]);
    if (filesToUpload.length === 0) {
      toast.error('Hech qanday hujjat tanlanmadi.');
      return;
    }

    setBusy(true);
    try {
      await ensureCandidateProfile({ ...PROFILE_ENSURE_BASE });
      for (const doc of filesToUpload) {
        const file = form.documents[doc.type];
        if (!file) continue;
        await candidateUploadDocument(file, doc.type);
      }
      if (!form.declaresNoLanguage) {
        for (const sel of form.languageSelections) {
          if (!sel.hasCertificate || !sel.certificateFile) continue;
          const language = toCandidateLanguageEnum(sel.name);
          if (!language) continue;
          await candidateUploadDocument(sel.certificateFile, 'CERTIFICATE', { language });
        }
      }
      await candidateSubmitProfile();
      setHomeInitialTab(3);
      setView('home');
    } catch (e) {
      toast.error(candidatePortalError(e, 'Hujjatlar yoki arizani yuborishda xato.'));
    } finally {
      setBusy(false);
    }
  }

  const screenMap: Record<Screen, React.ReactNode> = {
    1: (
      <Screen1
        onNext={() => setScreen(2)}
        lookupBusy={tgBootstrapBusy && view === 'onboarding' && screen === 1}
        entryLabel={entryContextLabel}
      />
    ),
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
    5: (
      <Screen5Education
        onNext={() => saveEducationAndNext()}
        onBack={goBack}
        form={form}
        setForm={setForm}
        busy={busy}
      />
    ),
    6: (
      <Screen6Work
        onNext={(entries) => saveWorkAndNext(entries)}
        onBack={goBack}
        form={form}
        setForm={setForm}
        busy={busy}
      />
    ),
    7: (
      <Screen6
        onNext={() => saveLanguagesAndNext()}
        onBack={goBack}
        form={form}
        setForm={setForm}
        busy={busy}
      />
    ),
    8: (
      <Screen8
        onNext={() => void saveCountriesAndNext()}
        onBack={goBack}
        form={form}
        setForm={setForm}
        busy={busy}
      />
    ),
    9: (
      <Screen7Documents
        onNext={() => void finishDocumentsAndGoHome()}
        onBack={goBack}
        form={form}
        setForm={setForm}
        busy={busy}
      />
    ),
  };

  const portalBody = !sessionBootstrapped ? (
    <div className="flex h-full min-h-0 w-full items-center justify-center">
      <Loader2 className="h-11 w-11 animate-spin" style={{ color: C.blueL }} strokeWidth={2} aria-hidden />
    </div>
  ) : (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {view === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="absolute inset-0 flex min-h-0 flex-col"
          >
            <HomeScreen initialTab={homeInitialTab} />
          </motion.div>
        ) : (
          <motion.div
            key={`onboarding-${screen}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="absolute inset-0 flex min-h-0 flex-col overflow-hidden"
            style={{ backgroundColor: C.bg }}
          >
            {screenMap[screen]}
          </motion.div>
        )}
      </AnimatePresence>

      {view === 'onboarding' ? (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-10"
          style={{ paddingBottom: 'var(--portal-bottom-inset, 12px)' }}
        >
          <div className="flex items-center justify-center gap-1.5 py-2">
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
    </>
  );

  return (
    <PortalChromeContext.Provider value={portalChrome}>
      <CandidatePortalShell chrome={portalChrome}>{portalBody}</CandidatePortalShell>
    </PortalChromeContext.Provider>
  );
}
