import { Globe, Languages } from 'lucide-react';
import { cn } from './ui/utils';

export type LanguageIconProps = {
  /** Til kodi (masalan ENGLISH, DE, OTHER) — `OTHER` yoki bo‘sh bo‘lsa globus. */
  code?: string;
  className?: string;
  /** Lucide `size` (px). */
  size?: number;
};

/**
 * Admin UI — tillar uchun yagona ikonka: aniq til → `Languages`, umumiy / boshqa → `Globe`.
 */
export function LanguageIcon({ code, className, size = 18 }: LanguageIconProps) {
  const k = (code || '').trim().toUpperCase();
  const useGlobe = !k || k === 'OTHER';
  const Icon = useGlobe ? Globe : Languages;
  return (
    <Icon
      className={cn('shrink-0 text-primary', className)}
      size={size}
      strokeWidth={2}
      aria-hidden
    />
  );
}
