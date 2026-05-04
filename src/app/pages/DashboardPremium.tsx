import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bell } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import {
  candidateStatusDistribution,
  last30DaysData,
  topCountries,
  topProfessions,
  languageDistribution,
  recentActivity
} from '../data/mockData';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';

function AnimatedNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString('ru-RU')}</span>;
}

function KPICard({ title, value, subtitle, accentColor, sparklineData, hasGlow }: any) {
  const gradientId = `gradient-${title.replace(/\s+/g, '-')}`;

  return (
    <div
      className={`relative rounded-2xl p-5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.05] transition-all duration-300 hover:-translate-y-0.5 hover:ring-white/[0.09] hover:shadow-[0_28px_56px_-16px_rgba(0,0,0,0.65)] ${hasGlow ? 'ring-red-500/35 shadow-red-950/20' : ''}`}
      style={{
        backgroundColor: 'var(--dashboard-card)',
        border: '1px solid var(--dashboard-card-border)',
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px -16px rgba(0,0,0,0.55)`,
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">{title}</div>
          <div className="text-4xl font-bold text-white mb-1">
            <AnimatedNumber value={value} />
          </div>
          <div className="text-sm text-gray-400">{subtitle}</div>
        </div>
        {sparklineData && (
          <div className="w-16 h-12">
            <ResponsiveContainer width="100%" height="100%" key={`container-${gradientId}`}>
              <AreaChart data={sparklineData} id={`sparkline-${gradientId}`}>
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
        )}
      </div>
    </div>
  );
}

export function DashboardPremium() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} | ${date.toLocaleTimeString('en-GB')}`;
  };

  const sparklineDataPositive = [
    { value: 120 }, { value: 145 }, { value: 132 }, { value: 167 }, { value: 189 },
    { value: 178 }, { value: 198 }, { value: 212 }, { value: 234 }, { value: 256 }
  ];

  const displayName = user?.displayName ?? 'Sardor A.';
  const roleLabel = user?.roleLabel ?? 'SUPER ADMIN';

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--dashboard-bg)' }}>
      <div
        className="sticky top-0 z-10 border-b bg-[color-mix(in_oklab,var(--dashboard-bg)_82%,transparent)] px-4 py-4 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-8"
        style={{ borderColor: 'var(--dashboard-card-border)' }}
      >
        <div className="mx-auto flex max-w-[1920px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              The Kasb
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              KASB Platform
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">Admin Control Center</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-center">
            <time
              dateTime={currentTime.toISOString()}
              className="rounded-xl border px-4 py-2 font-mono text-xs text-slate-200 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.06] sm:text-sm"
              style={{
                borderColor: 'var(--dashboard-card-border)',
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            >
              {formatTime(currentTime)}
            </time>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-3 sm:gap-4 lg:justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-emerald-300/95 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/20 sm:text-sm"
              style={{ borderColor: 'rgba(16,185,129,0.35)', backgroundColor: 'rgba(16,185,129,0.08)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Tizim ishlayapti
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs text-slate-300 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.04] transition-all duration-200 hover:border-slate-500 hover:bg-white/5 hover:text-white hover:ring-white/10 sm:text-sm"
              style={{ borderColor: 'var(--dashboard-card-border)' }}
            >
              <Bell size={16} className="text-slate-400" />
              <span>3 xabar</span>
            </button>

            <div className="flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]"
              style={{ borderColor: 'var(--dashboard-card-border)', backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <span className="truncate text-sm font-medium text-white">{displayName}</span>
              <span className="flex-shrink-0 rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 sm:text-xs">
                ⭐ {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-4 sm:space-y-8 sm:p-8 md:p-10">
        {/* SECTION 1: Hero KPI Strip */}
        <div className="grid grid-cols-5 gap-4">
          <KPICard
            title="JAMI NOMZODLAR"
            value={10847}
            subtitle="Ro'yxatdagi nomzodlar"
            accentColor="#3B82F6"
            sparklineData={sparklineDataPositive}
          />
          <KPICard
            title="FAOL VAKANSIYALAR"
            value={103}
            subtitle="18 ta 🔴 SHOSHILINCH"
            accentColor="#F59E0B"
            sparklineData={sparklineDataPositive}
          />
          <KPICard
            title="BUGUN ARIZALAR"
            value={47}
            subtitle="↑ 23% kechagidan"
            accentColor="#10B981"
            sparklineData={sparklineDataPositive}
          />
          <KPICard
            title="TASDIQLASH KUTMOQDA"
            value={847}
            subtitle="⚠ 23 ta kechikkan (3+ kun)"
            accentColor="#EF4444"
            sparklineData={sparklineDataPositive}
            hasGlow={true}
          />
          <KPICard
            title="OTP / FAOLLIK"
            value={312}
            subtitle="Aktiv foydalanuvchilar"
            accentColor="#8B5CF6"
            sparklineData={sparklineDataPositive}
          />
        </div>

        {/* SECTION 2: Main Charts Row */}
        <div className="grid grid-cols-4 gap-6">
          {/* Left: 30-day Area Chart */}
          <div
            className="col-span-2 rounded-2xl p-6 ring-1 ring-white/[0.06] transition-all duration-300 hover:ring-white/[0.09]"
            style={{
              backgroundColor: 'var(--dashboard-card)',
              border: '1px solid var(--dashboard-card-border)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 50px -20px rgba(0,0,0,0.55)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Nomzodlar oqimi — 30 kun</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">7 kun</button>
                <button className="px-3 py-1 rounded-full text-xs text-gray-400 hover:text-white">30 kun</button>
                <button className="px-3 py-1 rounded-full text-xs text-gray-400 hover:text-white">3 oy</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250} key="container-main-30-day">
              <AreaChart data={last30DaysData} id="main-30-day-chart">
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
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  isAnimationActive={false}
                />
                <Area type="monotone" dataKey="newRegistrations" stroke="#3B82F6" fill="url(#colorNew)" strokeWidth={2} name="Yangi" isAnimationActive={false} />
                <Area type="monotone" dataKey="approved" stroke="#10B981" fill="url(#colorApproved)" strokeWidth={2} name="Tasdiqlangan" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Middle: Donut Chart */}
          <div
            className="rounded-2xl p-6 ring-1 ring-white/[0.06] transition-all duration-300 hover:ring-white/[0.09]"
            style={{
              backgroundColor: 'var(--dashboard-card)',
              border: '1px solid var(--dashboard-card-border)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 50px -20px rgba(0,0,0,0.55)',
            }}
          >
            <h3 className="text-white font-semibold mb-4">Holat taqsimoti</h3>
            <ResponsiveContainer width="100%" height={250} key="container-status-pie">
              <PieChart id="status-distribution-pie">
                <Pie
                  data={candidateStatusDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive={false}
                >
                  {candidateStatusDistribution.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-white">
                  10,847
                </text>
                <text x="50%" y="55%" textAnchor="middle" className="text-xs fill-gray-400">
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
          </div>

          {/* Right: Top Countries */}
          <div
            className="rounded-2xl p-6 ring-1 ring-white/[0.06] transition-all duration-300 hover:ring-white/[0.09]"
            style={{
              backgroundColor: 'var(--dashboard-card)',
              border: '1px solid var(--dashboard-card-border)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 50px -20px rgba(0,0,0,0.55)',
            }}
          >
            <h3 className="text-white font-semibold mb-4">Top 5 Maqsad Mamlakatlar</h3>
            <div className="space-y-3">
              {topCountries.map((country) => (
                <div key={country.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 flex items-center gap-2">
                      <span className="text-base">{country.flag}</span>
                      {country.country}
                    </span>
                    <span className="text-gray-400">{country.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${country.percentage}%`,
                        background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: Middle Analytics Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Languages */}
          <div
            className="rounded-2xl p-6 ring-1 ring-white/[0.06] transition-all duration-300 hover:ring-white/[0.09]"
            style={{
              backgroundColor: 'var(--dashboard-card)',
              border: '1px solid var(--dashboard-card-border)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 50px -20px rgba(0,0,0,0.55)',
            }}
          >
            <h3 className="text-white font-semibold mb-4">Til bilimlari</h3>
            <div className="space-y-2">
              {languageDistribution.map((lang) => (
                <div key={lang.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-800/50">
                  <span className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    {lang.language}
                  </span>
                  <span className="text-sm font-semibold text-white">{lang.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Professions Ranking */}
          <div
            className="rounded-2xl p-6 ring-1 ring-white/[0.06] transition-all duration-300 hover:ring-white/[0.09]"
            style={{
              backgroundColor: 'var(--dashboard-card)',
              border: '1px solid var(--dashboard-card-border)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 50px -20px rgba(0,0,0,0.55)',
            }}
          >
            <h3 className="text-white font-semibold mb-4">Eng ko'p so'ralgan kasblar</h3>
            <div className="space-y-2">
              {topProfessions.map((prof) => (
                <div key={prof.id} className="flex items-center gap-3">
                  <span className="text-gray-500 font-mono text-xs w-6">#{prof.rank}</span>
                  <span className="flex-1 text-sm text-gray-300">{prof.name}</span>
                  <span className="text-xs text-gray-400">{prof.count.toLocaleString()}</span>
                  <span className={`text-xs flex items-center gap-0.5 ${prof.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {prof.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(prof.trend)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="rounded-2xl p-6 ring-1 ring-white/[0.06] transition-all duration-300 hover:ring-white/[0.09]"
            style={{
              backgroundColor: 'var(--dashboard-card)',
              border: '1px solid var(--dashboard-card-border)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 50px -20px rgba(0,0,0,0.55)',
            }}
          >
            <h3 className="text-white font-semibold mb-4">Tezkor harakatlar</h3>
            <div className="space-y-3">
              <Link to="/admin/candidates" className="block p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors">
                <div className="text-sm text-red-400 mb-1">⚡ 847 ta profil kutmoqda</div>
                <div className="text-xs text-gray-400">Ko'rib chiqishni boshlash →</div>
              </Link>
              <Link to="/admin/custom-professions" className="block p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                <div className="text-sm text-amber-400 mb-1">🔧 23 ta yangi maxsus kasb</div>
                <div className="text-xs text-gray-400">Rasmiylashtirish kerak</div>
              </Link>
              <Link to="/admin/vacancies/create" className="block p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                <div className="text-sm text-blue-400">📋 + Yangi vakansiya yaratish</div>
              </Link>
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--dashboard-card-border)' }}>
              <div className="text-xs text-gray-400 mb-2">Bugungi maqsad</div>
              <div className="text-sm text-white mb-1">Tasdiqlash rejtasi: 47/100</div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '47%' }} />
              </div>
              <div className="text-xs text-gray-400 mt-1">Bugun 47 ta profil tasdiqlandi</div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Bottom Row - Activity Feed */}
        <div className="grid grid-cols-3 gap-6">
          <div
            className="col-span-2 rounded-2xl p-6 ring-1 ring-white/[0.06] transition-all duration-300 hover:ring-white/[0.09]"
            style={{
              backgroundColor: 'var(--dashboard-card)',
              border: '1px solid var(--dashboard-card-border)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 50px -20px rgba(0,0,0,0.55)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Oxirgi faoliyat</h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs text-red-400">JONLI</span>
              </div>
            </div>
            <div className="space-y-2">
              {recentActivity.map((activity) => {
                const dotColors: any = {
                  success: 'bg-green-500',
                  info: 'bg-blue-500',
                  warning: 'bg-amber-500',
                  danger: 'bg-red-500'
                };
                return (
                  <div key={activity.id} className="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-800/50">
                    <span className={`w-2 h-2 rounded-full ${dotColors[activity.type]}`}></span>
                    <span className="text-xs mono text-gray-400 w-12">{activity.time}</span>
                    <span className="flex-1 text-sm text-gray-300">{activity.event}</span>
                    <span className="text-xs text-gray-500">{activity.actor}</span>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-4 text-sm text-blue-400 hover:text-blue-300">Ko'proq ko'rish →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
