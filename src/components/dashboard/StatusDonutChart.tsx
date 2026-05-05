import { Pie, PieChart, ResponsiveContainer, Cell, Label } from 'recharts';
import type { DashboardData } from '../../types/dashboard';

const STATUS_META = [
  { key: 'PENDING', label: 'Kutmoqda', color: '#f59e0b' },
  { key: 'ACTIVE', label: 'Tasdiqlangan', color: '#10b981' },
  { key: 'DRAFT', label: 'Qoralama', color: '#6366f1' },
  { key: 'SUSPENDED', label: "To'xtatilgan", color: '#ef4444' },
  { key: 'PLACED', label: 'Joylashtirilgan', color: '#06b6d4' },
] as const;

type Key = (typeof STATUS_META)[number]['key'];

export function StatusDonutChart({
  distribution,
  totalCandidates,
}: {
  distribution: DashboardData['statusDistribution'];
  totalCandidates: number;
}) {
  const data = STATUS_META.map((s) => ({
    name: s.label,
    key: s.key,
    value: distribution[s.key as Key] ?? 0,
    color: s.color,
  }));

  return (
    <div
      className="kasb-dash-card rounded-2xl p-5"
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">Holat taqsimoti</h3>
        <p className="mt-1 text-xs text-white/55">Nomzodlar statuslari bo‘yicha</p>
      </div>

      <div className="h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
              <Label
                value={totalCandidates.toLocaleString('ru-RU')}
                position="center"
                fill="rgba(255,255,255,0.95)"
                fontSize={18}
                fontWeight={700}
                dy={-6}
              />
              <Label
                value="Jami nomzod"
                position="center"
                fill="rgba(255,255,255,0.55)"
                fontSize={11}
                fontWeight={600}
                dy={14}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 space-y-2">
        {data.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} aria-hidden />
              <span className="text-white/70">{d.name}</span>
            </div>
            <span className="mono text-white/85" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {d.value.toLocaleString('ru-RU')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

