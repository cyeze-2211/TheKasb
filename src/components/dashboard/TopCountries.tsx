import type { DashboardData } from '../../types/dashboard';

const COUNTRY_NAME: Record<string, string> = {
  KR: 'Koreya',
  PL: 'Polsha',
  DE: 'Germaniya',
  IL: 'Isroil',
  CZ: 'Chexiya',
  TR: 'Turkiya',
};

function flagEmoji(code: string): string {
  const cc = code.toUpperCase();
  if (cc.length !== 2) return '🏳️';
  const points = cc.split('').map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...points);
}

export function TopCountries({ countries }: { countries: DashboardData['topCountries'] }) {
  const top5 = [...countries].sort((a, b) => b.count - a.count).slice(0, 5);
  const max = Math.max(1, ...top5.map((c) => c.count));

  return (
    <div
      className="kasb-dash-card rounded-2xl p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Top 5 Maqsad Mamlakatlar</h3>
        <p className="mt-1 text-xs text-white/55">Eng ko‘p uchraydigan yo‘nalishlar</p>
      </div>

      <div className="space-y-3">
        {top5.map((c) => {
          const pct = Math.round((c.count / max) * 100);
          const name = COUNTRY_NAME[c.countryCode?.toUpperCase()] ?? c.countryCode;
          return (
            <div key={c.countryCode} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-base" aria-hidden>
                    {flagEmoji(c.countryCode)}
                  </span>
                  <span className="truncate text-sm text-white/75">{name}</span>
                </div>
                <span className="mono text-sm font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {c.count.toLocaleString('ru-RU')}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background:
                      'linear-gradient(90deg, rgba(139,92,246,0.95), rgba(59,130,246,0.85))',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

