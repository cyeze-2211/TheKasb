import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardData } from '../../types/dashboard';

type RangeKey = '7' | '30' | '90';

const RANGE_LABEL: Record<RangeKey, string> = {
  '7': '7 kun',
  '30': '30 kun',
  '90': '3 oy',
};

function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
}

function takeLastByRange(flow: DashboardData['candidateFlow'], range: RangeKey) {
  const sorted = [...flow].sort((a, b) => a.date.localeCompare(b.date));
  const n = range === '7' ? 7 : range === '30' ? 30 : 90;
  return sorted.slice(Math.max(0, sorted.length - n));
}

export function CandidateFlowChart({ data }: { data: DashboardData['candidateFlow'] }) {
  const [range, setRange] = useState<RangeKey>('30');

  const filtered = useMemo(() => takeLastByRange(data, range), [data, range]);
  const titleRange = range === '7' ? '7 kun' : range === '30' ? '30 kun' : '3 oy';

  return (
    <div
      className="kasb-dash-card rounded-2xl p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Nomzodlar oqimi — {titleRange}</h3>
          <p className="mt-1 text-xs text-white/55">Yangi va tasdiqlangan nomzodlar dinamikasi</p>
        </div>

        <div
          className="flex items-center gap-1 rounded-xl border p-1"
          style={{ borderColor: 'rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.02)' }}
        >
          {(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => {
            const active = k === range;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setRange(k)}
                className="h-8 rounded-lg px-3 text-xs font-medium transition-colors"
                style={{
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
                }}
              >
                {RANGE_LABEL[k]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ left: 4, right: 10, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDayMonth}
              tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              minTickGap={18}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeDasharray: '4 4' }}
              contentStyle={{
                background: 'rgba(14,18,30,0.96)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                boxShadow: '0 18px 40px -16px rgba(0,0,0,0.65)',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              itemStyle={{ color: 'rgba(255,255,255,0.9)' }}
              labelFormatter={(l) => formatDayMonth(String(l))}
              formatter={(v: unknown, name: unknown) => {
                const label = name === 'newCandidates' ? 'Yangi' : 'Tasdiqlangan';
                const num = typeof v === 'number' ? v : Number(v);
                return [Number.isFinite(num) ? num : v, label];
              }}
            />
            <Line
              type="monotone"
              dataKey="newCandidates"
              name="Yangi"
              stroke="#3B82F6"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#3B82F6', fill: '#0f1117' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="activatedCount"
              name="Tasdiqlangan"
              stroke="#10B981"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#10B981', fill: '#0f1117' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

