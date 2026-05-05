import type { DashboardData } from '../../types/dashboard';

const LANG_META: Record<string, { label: string; flag: string }> = {
  RUSSIAN: { label: 'Rus tili', flag: '🇷🇺' },
  ENGLISH: { label: 'Ingliz tili', flag: '🇬🇧' },
  GERMAN: { label: 'Nemis tili', flag: '🇩🇪' },
  KOREAN: { label: 'Koreya tili', flag: '🇰🇷' },
  TURKISH: { label: 'Turk tili', flag: '🇹🇷' },
  POLISH: { label: 'Polyak tili', flag: '🇵🇱' },
};

export function LanguageSkills({ items }: { items: DashboardData['languageSkills'] }) {
  const list = [...items].sort((a, b) => b.count - a.count);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'var(--kasb-dash-card)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Til bilimlari</h3>
        <p className="mt-1 text-xs text-white/55">Nomzodlar bo‘yicha</p>
      </div>

      <div className="space-y-2.5">
        {list.map((l) => {
          const m = LANG_META[l.language?.toUpperCase()] ?? { label: l.language, flag: '🌐' };
          return (
            <div key={l.language} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span aria-hidden>{m.flag}</span>
                <span className="truncate text-sm text-white/75">{m.label}</span>
              </div>
              <span className="mono text-sm font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {l.count.toLocaleString('ru-RU')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

