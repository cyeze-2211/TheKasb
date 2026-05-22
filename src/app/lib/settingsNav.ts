import type { LucideIcon } from 'lucide-react';
import { Archive, Files } from 'lucide-react';

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
];

export function settingsPageTitle(pathname: string): string {
  if (pathname.includes('/deleted-users')) return 'O‘chirilgan foydalanuvchilar';
  if (pathname.includes('/files')) return 'Fayllar';
  return 'Sozlamalar';
}
