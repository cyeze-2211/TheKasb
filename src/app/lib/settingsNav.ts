import type { LucideIcon } from 'lucide-react';
import { Archive, Files, GraduationCap, MapPin } from 'lucide-react';

export type SettingsNavItem = {
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const SETTINGS_BASE = '/admin/settings';

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    path: `${SETTINGS_BASE}/files`,
    label: 'Fayllar',
    description: 'Yuklash, ro‘yxat va o‘chirish',
    icon: Files,
  },
  {
    path: `${SETTINGS_BASE}/deleted-users`,
    label: 'O‘chirilgan foydalanuvchilar',
    description: 'Soft-delete va tiklash',
    icon: Archive,
  },
  {
    path: `${SETTINGS_BASE}/regions`,
    label: 'Viloyatlar',
    description: 'Hududlar katalogi (CRUD)',
    icon: MapPin,
  },
  {
    path: `${SETTINGS_BASE}/universities`,
    label: 'Universitetlar',
    description: 'OTM ro‘yxati — viloyat va tur bo‘yicha',
    icon: GraduationCap,
  },
];

export function settingsPageTitle(pathname: string): string {
  if (/\/regions\/\d+/.test(pathname)) return 'Tumanlar';
  if (pathname.includes('/universities')) return 'Universitetlar';
  if (pathname.includes('/regions')) return 'Viloyatlar';
  if (pathname.includes('/deleted-users')) return 'O‘chirilgan foydalanuvchilar';
  if (pathname.includes('/files')) return 'Fayllar';
  return 'Sozlamalar';
}

export function isSettingsHubPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '');
  return p === SETTINGS_BASE;
}
