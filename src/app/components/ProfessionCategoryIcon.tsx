import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Banknote,
  Bed,
  Briefcase,
  Building2,
  Car,
  Cpu,
  Dumbbell,
  Factory,
  Fish,
  GraduationCap,
  HardHat,
  HeartPulse,
  Hotel,
  Landmark,
  Laptop,
  LayoutGrid,
  Music,
  Palette,
  Plane,
  Scissors,
  ShoppingBag,
  Sparkles,
  Sprout,
  Stethoscope,
  Store,
  Truck,
  UtensilsCrossed,
  Wheat,
  Wrench,
  Zap,
} from 'lucide-react';

/** API `icon` maydoni: masalan `"medical"`, `"construction"` (kichik/katta harf, tire/qavs — normalize qilinadi) */
function normalizeIconKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_');
}

/**
 * Backend slug → Lucide. Noma’lum slug uchun `LayoutGrid`.
 * Yangi slug qo‘shish: shu yerga kalit qo‘shing.
 */
const ICON_BY_SLUG: Record<string, LucideIcon> = {
  medical: Stethoscope,
  medicine: Stethoscope,
  healthcare: HeartPulse,
  health: HeartPulse,
  hospital: Building2,
  nurse: Stethoscope,

  construction: HardHat,
  building: HardHat,
  repair: Wrench,

  cooking: UtensilsCrossed,
  kitchen: UtensilsCrossed,
  food: UtensilsCrossed,
  restaurant: UtensilsCrossed,
  chef: UtensilsCrossed,

  agriculture: Wheat,
  farming: Wheat,
  farm: Sprout,
  crop: Wheat,

  transport: Truck,
  logistics: Truck,
  delivery: Truck,
  driver: Car,

  cleaning: Sparkles,
  housekeeping: Sparkles,
  janitor: Sparkles,

  industry: Factory,
  manufacturing: Factory,
  factory: Factory,

  beauty: Scissors,
  salon: Scissors,
  cosmetics: Sparkles,

  it: Laptop,
  tech: Laptop,
  technology: Cpu,
  software: Cpu,

  education: GraduationCap,
  school: GraduationCap,

  finance: Banknote,
  banking: Landmark,

  retail: ShoppingBag,
  shop: Store,
  sales: Store,

  hotel: Hotel,
  hospitality: Bed,

  sport: Dumbbell,
  fitness: Dumbbell,

  music: Music,
  art: Palette,
  design: Palette,

  aviation: Plane,
  travel: Plane,

  fishing: Fish,
  energy: Zap,

  childcare: Baby,
  default: LayoutGrid,
};

/** Admin forma: tezkor ikonka tanlash (slug `ICON_BY_SLUG` bilan mos) */
export const PROFESSION_CATEGORY_ICON_PRESETS = [
  'construction',
  'medical',
  'it',
  'transport',
  'cooking',
  'education',
  'finance',
  'retail',
  'hotel',
  'agriculture',
  'industry',
  'beauty',
  'sport',
  'cleaning',
  'aviation',
  'default',
] as const;

export function resolveProfessionCategoryIcon(slug: string): LucideIcon {
  const key = normalizeIconKey(slug);
  if (!key) return LayoutGrid;
  if (ICON_BY_SLUG[key]) return ICON_BY_SLUG[key];

  // Masalan `truck` → `Truck` (Lucide nomi bilan mos kelganda)
  const pascal = key
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  const dynamic = lucideIcons[pascal];
  if (dynamic) return dynamic;

  return LayoutGrid;
}

/** Slug → PascalCase bo‘yicha topish (masalan truck → Truck) */
const lucideIcons: Record<string, LucideIcon> = {
  Baby,
  Banknote,
  Bed,
  Briefcase,
  Building2,
  Car,
  Cpu,
  Dumbbell,
  Factory,
  Fish,
  GraduationCap,
  HardHat,
  HeartPulse,
  Hotel,
  Landmark,
  Laptop,
  LayoutGrid,
  Music,
  Palette,
  Plane,
  Scissors,
  ShoppingBag,
  Sparkles,
  Sprout,
  Stethoscope,
  Store,
  Truck,
  UtensilsCrossed,
  Wheat,
  Wrench,
  Zap,
};

type Props = {
  name: string;
  className?: string;
  strokeWidth?: number;
};

/**
 * URL yoki path bo‘lsa rasm; aks holda `name` slug bo‘yicha Lucide ikonka.
 */
export function ProfessionCategoryIcon({ name, className = 'h-6 w-6', strokeWidth = 2 }: Props) {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    const Fallback = LayoutGrid;
    return <Fallback className={`${className} shrink-0 opacity-40`} strokeWidth={strokeWidth} aria-hidden />;
  }
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return (
      <img
        src={trimmed}
        alt=""
        className="h-6 w-6 shrink-0 rounded-md object-cover ring-1 ring-border/60"
        loading="lazy"
      />
    );
  }
  const Icon = resolveProfessionCategoryIcon(trimmed);
  return <Icon className={`${className} shrink-0 text-text-muted`} strokeWidth={strokeWidth} aria-hidden />;
}

/** API `icon` maydoni uchun qisqa nom (oldingi `CategoryIcon` chaqiriqlari bilan mos) */
export function CategoryIcon({
  icon,
  className,
  strokeWidth,
}: {
  icon: string;
  className?: string;
  strokeWidth?: number;
}) {
  return <ProfessionCategoryIcon name={icon} className={className} strokeWidth={strokeWidth} />;
}
