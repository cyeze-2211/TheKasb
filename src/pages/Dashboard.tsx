import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router';
import { useAuth } from '../app/auth/AuthContext';
import { fetchCandidatesList, pickStr } from '../app/api/candidates';
import { useDashboard } from '../hooks/useDashboard';
import type { DashboardData } from '../types/dashboard';

const STATUS_PIE_META = [
  { key: 'PENDING' as const, id: 'st-p', name: 'Kutmoqda', color: '#f59e0b' },
  { key: 'DRAFT' as const, id: 'st-d', name: 'Qoralama', color: '#6366f1' },
  { key: 'ACTIVE' as const, id: 'st-a', name: 'Faol', color: '#10b981' },
  { key: 'SUSPENDED' as const, id: 'st-s', name: 'To‘xtatilgan', color: '#ef4444' },
  { key: 'PLACED' as const, id: 'st-pl', name: 'Joylashtirilgan', color: '#06b6d4' },
];

const LANG_UI: Record<string, { label: string; flag: string }> = {
  RUSSIAN: { label: 'Rus tili', flag: '🇷🇺' },
  ENGLISH: { label: 'Ingliz tili', flag: '🇬🇧' },
  GERMAN: { label: 'Nemis tili', flag: '🇩🇪' },
  KOREAN: { label: 'Koreya tili', flag: '🇰🇷' },
  TURKISH: { label: 'Turk tili', flag: '🇹🇷' },
  POLISH: { label: 'Polyak tili', flag: '🇵🇱' },
  OTHER: { label: 'Boshqa', flag: '🌐' },
};

const COUNTRY_NAME: Record<string, string> = {
  KR: 'Koreya',
  PL: 'Polsha',
  DE: 'Germaniya',
  IL: 'Isroil',
  CZ: 'Chexiya',
  TR: 'Turkiya',
  UZ: 'O‘zbekiston',
};

function flagEmoji(code: string): string {
  const cc = code.toUpperCase();
  if (cc.length !== 2) return '🏳️';
  return String.fromCodePoint(...cc.split('').map((c) => 127397 + c.charCodeAt(0)));
}

function AnimatedNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(value) || value <= 0) {
      setCount(Math.max(0, Math.floor(value)));
      return;
    }
    const duration = 1200;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = window.setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        window.clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => window.clearInterval(timer);
  }, [value]);

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString('ru-RU')}</span>;
}

function sparklineFromFlow(flow: DashboardData['candidateFlow']): { value: number }[] {
  const sorted = [...flow].sort((a, b) => a.date.localeCompare(b.date));
  const pts = sorted.slice(-12).map((d) => ({ value: d.newCandidates + d.activatedCount }));
  if (pts.length >= 2) return pts;
  const v = Math.max(0, sorted[sorted.length - 1]?.newCandidates ?? 0, 1);
  return Array.from({ length: 10 }, (_, i) => ({ value: Math.max(1, Math.round(v * (0.55 + (i / 9) * 0.45))) }));
}

type RangeKey = '7' | '30' | '90';

function takeFlowRange(flow: DashboardData['candidateFlow'], range: RangeKey): DashboardData['candidateFlow'] {
  const sorted = [...flow].sort((a, b) => a.date.localeCompare(b.date));
  const n = range === '7' ? 7 : range === '30' ? 30 : 90;
  return sorted.slice(Math.max(0, sorted.length - n));
}

function formatChartDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
}

function flowToAreaRows(flow: DashboardData['candidateFlow'], range: RangeKey) {
  return takeFlowRange(flow, range).map((row) => ({
    id: row.date,
    date: formatChartDay(row.date),
    newRegistrations: row.newCandidates,
    approved: row.activatedCount,
  }));
}

type ActivityRow = {
  id: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  event: string;
  actor: string;
};

function KPICard({
  title,
  value,
  subtitle,
  accentColor,
  sparklineData,
  hasGlow,
}: {
  title: string;
  value: number;
  subtitle: string;
  accentColor: string;
  sparklineData: { value: number }[];
  hasGlow?: boolean;
}) {
  const gradientId = `grad-${title.replace(/\s+/g, '-').slice(0, 24)}-${accentColor.replace('#', '')}`;

  return (
    <div
      className={`relative rounded-lg p-5 transition-all hover:shadow-lg ${hasGlow ? 'ring-1 ring-red-500/30' : ''}`}
      style={{
        backgroundColor: 'var(--dashboard-card)',
        borderLeft: `3px solid ${accentColor}`,
        border: '1px solid var(--dashboard-card-border)',
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</div>
          <div className="mb-1 text-4xl font-bold text-white">
            <AnimatedNumber value={value} />
          </div>
          <div className="text-sm text-gray-400">{subtitle}</div>
        </div>
        <div className="h-12 w-16 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={accentColor}
                fill={`url(#${gradientId})`}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg p-6 ${className}`}
      style={{
        backgroundColor: 'var(--dashboard-card)',
        border: '1px solid var(--dashboard-card-border)',
      }}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, lastUpdatedAt, refetch } = useDashboard();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [flowRange, setFlowRange] = useState<RangeKey>('30');
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  useEffect(() => {
    const t = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      const page = await fetchCandidatesList({ page: 0, size: 10, sort: 'createdAt,desc' });
      const rows: ActivityRow[] = page.content.map((row, i) => {
        const created = pickStr(row, 'createdAt', 'created_at', 'registeredAt');
        let time = '—';
        if (created) {
          try {
            time = new Date(created).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
          } catch {
            time = '—';
          }
        }
        const phone = pickStr(row, 'phone_number', 'phoneNumber', 'phone', 'mobile');
        const name = pickStr(row, 'full_name', 'fullName', 'name', 'firstName', 'first_name');
        const st = pickStr(row, 'profile_status', 'profileStatus', 'status');
        return {
          id: `${i}-${phone || i}`,
          time,
          type: st === 'ACTIVE' ? 'success' : st === 'SUSPENDED' ? 'danger' : 'info',
          event: name ? `${name} — ${st || 'nomzod'}` : `Yangi nomzod (${st || '—'})`,
          actor: phone || '—',
        };
      });
      setActivity(rows);
    } catch {
      setActivity([]);
    }
  }, []);

  useEffect(() => {
    if (!loading && data) void loadActivity();
  }, [loading, data, loadActivity]);

  const formatHeaderTime = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}  |  ${date.toLocaleTimeString('en-GB')}`;
  };

  const pieData = useMemo(() => {
    if (!data) return [];
    const d = data.statusDistribution;
    return STATUS_PIE_META.map((s) => ({
      ...s,
      value: d[s.key] ?? 0,
    })).filter((x) => x.value > 0);
  }, [data]);

  const areaRows = useMemo(() => (data ? flowToAreaRows(data.candidateFlow, flowRange) : []), [data, flowRange]);

  const countriesWithPct = useMemo(() => {
    if (!data?.topCountries.length) return [];
    const sorted = [...data.topCountries].sort((a, b) => b.count - a.count).slice(0, 5);
    const max = Math.max(1, ...sorted.map((c) => c.count));
    return sorted.map((c) => ({
      id: c.countryCode,
      flag: flagEmoji(c.countryCode),
      country: COUNTRY_NAME[c.countryCode.toUpperCase()] ?? c.countryCode,
      count: c.count,
      percentage: Math.round((c.count / max) * 100),
    }));
  }, [data]);

  const languagesUi = useMemo(() => {
    if (!data?.languageSkills.length) return [];
    return [...data.languageSkills]
      .sort((a, b) => b.count - a.count)
      .map((l, idx) => {
        const m = LANG_UI[l.language?.toUpperCase()] ?? { label: l.language, flag: '🌐' };
        return { id: `${l.language}-${idx}`, ...m, count: l.count };
      });
  }, [data]);

  const professionsUi = useMemo(() => {
    if (!data?.topProfessions.length) return [];
    return [...data.topProfessions]
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((p, idx) => ({
        id: String(p.professionId),
        rank: idx + 1,
        name: p.nameUz,
        count: p.total,
        trend: p.trendPercent,
      }));
  }, [data]);

  const spark = useMemo(() => (data ? sparklineFromFlow(data.candidateFlow) : []), [data]);

  const pendingCustom = data?.summary.pendingCustomProfessions ?? 0;
  const todayPct =
    data && data.todayGoal.target > 0
      ? Math.min(100, Math.round((data.todayGoal.completed / data.todayGoal.target) * 100))
      : 0;

  return (
    <div className="min-h-full w-full" style={{ backgroundColor: 'var(--dashboard-bg)', color: '#fff' }}>
      {/* Header strip (sidebar AppLayout da) */}
      <div
        className="flex h-[4.5rem] shrink-0 items-center border-b px-6 md:px-8"
        style={{ borderColor: 'var(--dashboard-card-border)' }}
      >
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold text-white">KASB Platform</div>
          <div className="text-xs text-gray-400">Admin Control Center</div>
        </div>
        <div className="hidden flex-1 text-center sm:block">
          <div className="mono text-sm text-gray-400">{formatHeaderTime(currentTime)}</div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4 md:gap-6">
 
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-sm text-green-400">Tizim ishlayapti</span>
          </div>
          <button type="button" className="text-sm text-gray-400 hover:text-white">
            <Bell className="mr-1 inline h-4 w-4 align-text-bottom" strokeWidth={2} />
            <span className="text-xs">Bildirishnomalar</span>
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="truncate text-sm text-white">{user?.displayName ?? 'Admin'}</span>
            <span className="whitespace-nowrap rounded border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
              {user?.roleLabel ?? 'ADMIN'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6 md:p-8">
        {error && !loading ? (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {error}{' '}
            <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
              Qayta
            </button>
          </div>
        ) : null}

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {loading || !data ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-lg"
                style={{ backgroundColor: 'var(--dashboard-card)' }}
              />
            ))
          ) : (
            <>
              <KPICard
                title="JAMI NOMZODLAR"
                value={data.summary.totalCandidates}
                subtitle="Ro'yxatdagi nomzodlar"
                accentColor="#3B82F6"
                sparklineData={spark}
              />
              <KPICard
                title="FAOL VAKANSIYALAR"
                value={data.summary.activeVacancies}
                subtitle={`${data.summary.urgentVacancies.toLocaleString('ru-RU')} ta 🔴 SHOSHILINCH`}
                accentColor="#F59E0B"
                sparklineData={spark}
              />
              <KPICard
                title="BUGUN ARIZALAR"
                value={data.summary.todayApplications}
                subtitle={
                  data.summary.todayVsYesterdayPercent >= 0
                    ? `↑ ${data.summary.todayVsYesterdayPercent}% kechagidan`
                    : `↓ ${Math.abs(data.summary.todayVsYesterdayPercent)}% kechagidan`
                }
                accentColor="#10B981"
                sparklineData={spark}
              />
              <KPICard
                title="TASDIQLASH KUTMOQDA"
                value={data.summary.pendingApproval}
                subtitle={`⚠ ${data.summary.overdueApprovalCount.toLocaleString('ru-RU')} ta kechikkan (3+ kun)`}
                accentColor="#EF4444"
                sparklineData={spark}
                hasGlow={data.summary.overdueApprovalCount > 0}
              />
              <KPICard
                title="OTP / FAOLLIK"
                value={data.summary.activeUsersLast24h}
                subtitle="Aktiv foydalanuvchilar"
                accentColor="#8B5CF6"
                sparklineData={spark}
              />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Panel className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-white">
                Nomzodlar oqimi — {flowRange === '7' ? '7 kun' : flowRange === '30' ? '30 kun' : '3 oy'}
              </h3>
              <div className="flex gap-2">
                {(['7', '30', '90'] as RangeKey[]).map((k) => {
                  const active = flowRange === k;
                  const label = k === '7' ? '7 kun' : k === '30' ? '30 kun' : '3 oy';
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFlowRange(k)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        active
                          ? 'border-blue-500/30 bg-blue-500/20 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {loading || !data ? (
              <div className="h-[250px] animate-pulse rounded bg-white/5" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={areaRows}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} stroke="#1F2937" />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} stroke="#1F2937" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #1F2937',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="newRegistrations"
                    stroke="#3B82F6"
                    fill="url(#colorNew)"
                    strokeWidth={2}
                    name="Yangi"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="approved"
                    stroke="#10B981"
                    fill="url(#colorApproved)"
                    strokeWidth={2}
                    name="Tasdiqlangan"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel>
            <h3 className="mb-4 font-semibold text-white">Holat taqsimoti</h3>
            {loading || !data ? (
              <div className="h-[250px] animate-pulse rounded bg-white/5" />
            ) : pieData.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-gray-500">
                Taqsimot ma&apos;lumoti yo&apos;q
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="45%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fill: '#fff', fontSize: 22, fontWeight: 700 }}
                  >
                    {data.summary.totalCandidates.toLocaleString('ru-RU')}
                  </text>
                  <text
                    x="50%"
                    y="55%"
                    textAnchor="middle"
                    style={{ fill: '#9ca3af', fontSize: 11 }}
                  >
                    Jami nomzod
                  </text>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel>
            <h3 className="mb-4 font-semibold text-white">Top 5 Maqsad Mamlakatlar</h3>
            <div className="space-y-3">
              {loading || !data ? (
                <div className="h-40 animate-pulse rounded bg-white/5" />
              ) : countriesWithPct.length === 0 ? (
                <p className="text-sm text-gray-500">Hozircha ma&apos;lumot yo&apos;q</p>
              ) : (
                countriesWithPct.map((country) => (
                  <div key={country.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-gray-300">
                        <span className="text-base">{country.flag}</span>
                        {country.country}
                      </span>
                      <span className="text-gray-400">{country.count.toLocaleString('ru-RU')}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${country.percentage}%`,
                          background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel>
            <h3 className="mb-4 font-semibold text-white">Til bilimlari</h3>
            <div className="space-y-2">
              {loading || !data ? (
                <div className="h-48 animate-pulse rounded bg-white/5" />
              ) : languagesUi.length === 0 ? (
                <p className="text-sm text-gray-500">Ma&apos;lumot yo&apos;q</p>
              ) : (
                languagesUi.map((lang) => (
                  <div
                    key={lang.id}
                    className="flex items-center justify-between rounded p-2 hover:bg-gray-800/50"
                  >
                    <span className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-lg">{lang.flag}</span>
                      {lang.label}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {lang.count.toLocaleString('ru-RU')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-4 font-semibold text-white">Eng ko&apos;p so&apos;ralgan kasblar</h3>
            <div className="space-y-2">
              {loading || !data ? (
                <div className="h-56 animate-pulse rounded bg-white/5" />
              ) : professionsUi.length === 0 ? (
                <p className="text-sm text-gray-500">Ma&apos;lumot yo&apos;q</p>
              ) : (
                professionsUi.map((prof) => (
                  <div key={prof.id} className="flex items-center gap-3">
                    <span className="w-6 font-mono text-xs text-gray-500">#{prof.rank}</span>
                    <span className="flex-1 truncate text-sm text-gray-300">{prof.name}</span>
                    <span className="text-xs text-gray-400">{prof.count.toLocaleString('ru-RU')}</span>
                    <span
                      className={`flex items-center gap-0.5 text-xs ${
                        prof.trend > 0 ? 'text-green-400' : prof.trend < 0 ? 'text-red-400' : 'text-gray-500'
                      }`}
                    >
                      {prof.trend > 0 ? <TrendingUp size={10} /> : prof.trend < 0 ? <TrendingDown size={10} /> : null}
                      {prof.trend !== 0 ? `${Math.abs(Math.round(prof.trend))}%` : '—'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-4 font-semibold text-white">Tezkor harakatlar</h3>
            <div className="space-y-3">
              <Link
                to="/admin/candidates"
                className="block rounded-lg border border-red-500/20 bg-red-500/10 p-3 transition-colors hover:border-red-500/40"
              >
                <div className="mb-1 text-sm text-red-400">
                  ⚡{' '}
                  {data
                    ? `${data.summary.pendingApproval.toLocaleString('ru-RU')} ta profil kutmoqda`
                    : '…'}
                </div>
                <div className="text-xs text-gray-400">Ko&apos;rib chiqishni boshlash →</div>
              </Link>
              <Link
                to="/admin/custom-professions"
                className="block rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 transition-colors hover:border-amber-500/40"
              >
                <div className="mb-1 text-sm text-amber-400">
                  🔧{' '}
                  {data
                    ? `${pendingCustom.toLocaleString('ru-RU')} ta yangi maxsus kasb`
                    : '…'}
                </div>
                <div className="text-xs text-gray-400">Rasmiylashtirish kerak</div>
              </Link>
              <Link
                to="/admin/vacancies/create"
                className="block rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 transition-colors hover:border-blue-500/40"
              >
                <div className="text-sm text-blue-400">📋 + Yangi vakansiya yaratish</div>
              </Link>
            </div>

            <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--dashboard-card-border)' }}>
              <div className="mb-2 text-xs text-gray-400">
                {data?.todayGoal.label ?? 'Bugungi maqsad'}
              </div>
              <div className="mb-1 text-sm text-white">
                Tasdiqlash rejasi:{' '}
                {data
                  ? `${data.todayGoal.completed}/${data.todayGoal.target}`
                  : '—'}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${todayPct}%` }} />
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Bugun{' '}
                {data ? data.todayGoal.completed.toLocaleString('ru-RU') : '—'} ta profil tasdiqlandi
              </div>
            </div>
          </Panel>
        </div>

        {/* Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Oxirgi faoliyat</h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-xs text-red-400">JONLI</span>
              </div>
            </div>
            <div className="space-y-2">
              {activity.length === 0 ? (
                <p className="text-sm text-gray-500">Yuklanmoqda yoki yozuvlar yo&apos;q…</p>
              ) : (
                activity.map((a) => {
                  const dot: Record<ActivityRow['type'], string> = {
                    success: 'bg-green-500',
                    info: 'bg-blue-500',
                    warning: 'bg-amber-500',
                    danger: 'bg-red-500',
                  };
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded px-3 py-2 hover:bg-gray-800/50"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${dot[a.type]}`} />
                      <span className="mono w-12 text-xs text-gray-400">{a.time}</span>
                      <span className="flex-1 text-sm text-gray-300">{a.event}</span>
                      <span className="text-xs text-gray-500">{a.actor}</span>
                    </div>
                  );
                })
              )}
            </div>
            <Link to="/admin/candidates" className="mt-4 block w-full text-center text-sm text-blue-400 hover:text-blue-300">
              Ko&apos;proq ko&apos;rish →
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
