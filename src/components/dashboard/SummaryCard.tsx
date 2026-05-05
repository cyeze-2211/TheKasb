import type { ReactNode } from 'react';

type Props = {
  title: string;
  value: number;
  subtitle?: string;
  badge?: string;
  accent: 'blue' | 'yellow' | 'green' | 'red' | 'purple';
  icon: ReactNode;
};

const ACCENT: Record<Props['accent'], { border: string; glow: string; tint: string }> = {
  blue: { border: '#3B82F6', glow: 'rgba(59,130,246,0.18)', tint: 'rgba(59,130,246,0.12)' },
  yellow: { border: '#F59E0B', glow: 'rgba(245,158,11,0.18)', tint: 'rgba(245,158,11,0.12)' },
  green: { border: '#10B981', glow: 'rgba(16,185,129,0.18)', tint: 'rgba(16,185,129,0.12)' },
  red: { border: '#EF4444', glow: 'rgba(239,68,68,0.18)', tint: 'rgba(239,68,68,0.12)' },
  purple: { border: '#8B5CF6', glow: 'rgba(139,92,246,0.18)', tint: 'rgba(139,92,246,0.12)' },
};

function MiniTrend({ color }: { color: string }) {
  return (
    <svg width="58" height="20" viewBox="0 0 58 20" fill="none" aria-hidden>
      <path
        d="M2 16 C 10 6, 18 18, 28 8 C 36 1, 44 14, 56 4"
        stroke={color}
        strokeOpacity="0.9"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M2 16 C 10 6, 18 18, 28 8 C 36 1, 44 14, 56 4"
        stroke={color}
        strokeOpacity="0.18"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SummaryCard({ title, value, subtitle, badge, accent, icon }: Props) {
  const a = ACCENT[accent];
  return (
    <div
      className="kasb-dash-card group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div
        className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full blur-2xl"
        style={{ background: a.glow }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
        style={{ background: a.border }}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <p
              className="mono text-[40px] font-bold leading-none tracking-tight text-white"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {value.toLocaleString('ru-RU')}
            </p>
            {badge ? (
              <span
                className="truncate rounded-full px-2 py-1 text-[11px] font-medium"
                style={{ background: a.tint, color: '#fff' }}
                title={badge}
              >
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="mt-2 text-sm text-white/60">{subtitle}</p> : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)' }}
            aria-hidden
          >
            <div className="text-white/85">{icon}</div>
          </div>
          <div className="opacity-70 transition-opacity duration-300 group-hover:opacity-95">
            <MiniTrend color={a.border} />
          </div>
        </div>
      </div>
    </div>
  );
}

