import type { DashboardData } from '../../types/dashboard';

function Trend({ value }: { value: number }) {
  const v = Number(value) || 0;
  if (v > 0) {
    return <span className="text-emerald-400">↑{Math.round(v)}%</span>;
  }
  if (v < 0) {
    return <span className="text-red-400">↓{Math.round(Math.abs(v))}%</span>;
  }
  return <span className="text-white/45">→0%</span>;
}

export function TopProfessions({ items }: { items: DashboardData['topProfessions'] }) {
  const top = [...items].sort((a, b) => b.total - a.total).slice(0, 8);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'var(--kasb-dash-card)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Eng ko'p so'ralgan kasblar</h3>
        <p className="mt-1 text-xs text-white/55">Top 8 kasb</p>
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-[46px_1fr_96px_80px] bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
          <div>#</div>
          <div>Kasb</div>
          <div className="text-right">Soni</div>
          <div className="text-right">Trend</div>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {top.map((p, idx) => (
            <div
              key={p.professionId}
              className="grid grid-cols-[46px_1fr_96px_80px] items-center px-4 py-3 text-sm hover:bg-white/[0.02]"
            >
              <div className="mono text-white/55">{idx + 1}</div>
              <div className="min-w-0 truncate text-white/80">{p.nameUz}</div>
              <div className="mono text-right font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {p.total.toLocaleString('ru-RU')}
              </div>
              <div className="mono text-right text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <Trend value={p.trendPercent} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

