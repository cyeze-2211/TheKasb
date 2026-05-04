import { useMemo } from 'react';
import { TrendingUp, Users, FileText, Clock, Smartphone } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardStats, candidateStatusDistribution, weeklyRegistrations, mockCandidates } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router';

function KPICard({ icon: Icon, title, value, subtitle, trend, bgColor }: any) {
  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center`}>
              <Icon size={20} className="text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {value.toLocaleString('ru-RU')}
          </div>
          <div className="text-sm text-text-muted">{subtitle}</div>
        </div>
        {trend > 0 && (
          <div className="flex items-center gap-1 text-success text-sm font-medium">
            <TrendingUp size={14} />
            {trend}%
          </div>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const pieCells = useMemo(() =>
    candidateStatusDistribution.map((entry) => (
      <Cell key={entry.id} fill={entry.color} />
    )),
    []
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="mb-1">Dashboard</h1>
        <p className="text-text-muted text-sm">Umumiy statistika va hisobotlar</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <KPICard
          icon={Users}
          title="Jami Nomzodlar"
          value={dashboardStats.totalCandidates.value}
          subtitle={`+${dashboardStats.totalCandidates.change} ${dashboardStats.totalCandidates.label}`}
          trend={dashboardStats.totalCandidates.trend}
          bgColor="bg-primary"
        />
        <KPICard
          icon={FileText}
          title="Faol Vakansiyalar"
          value={dashboardStats.activeVacancies.value}
          subtitle={`${dashboardStats.activeVacancies.change} ${dashboardStats.activeVacancies.label}`}
          trend={dashboardStats.activeVacancies.trend}
          bgColor="bg-warning"
        />
        <KPICard
          icon={Clock}
          title="Kutilayotgan profillar"
          value={dashboardStats.pendingProfiles.value}
          subtitle={dashboardStats.pendingProfiles.label}
          trend={0}
          bgColor="bg-orange-500"
        />
        <KPICard
          icon={Smartphone}
          title="Bugun kirganlar"
          value={dashboardStats.todayLogins.value}
          subtitle={dashboardStats.todayLogins.label}
          trend={dashboardStats.todayLogins.trend}
          bgColor="bg-success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-5 gap-6">
        {/* Donut Chart */}
        <div className="col-span-3 bg-surface rounded-lg border border-border p-6 shadow-sm">
          <h2 className="mb-4">Nomzodlar holati</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={candidateStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                isAnimationActive={false}
                animationBegin={0}
                animationDuration={0}
              >
                {pieCells}
              </Pie>
              <Tooltip isAnimationActive={false} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value, entry: any, index: number) => {
                  const item = candidateStatusDistribution.find(d => d.name === value);
                  const total = candidateStatusDistribution.reduce((sum, d) => sum + d.value, 0);
                  const percent = ((item!.value / total) * 100).toFixed(1);
                  const labels: any = {
                    PENDING: 'Kutilmoqda',
                    REVIEWING: 'Ko\'rib chiqilmoqda',
                    APPROVED: 'Tasdiqlangan',
                    REJECTED: 'Rad etilgan'
                  };
                  return `${labels[value]}: ${item!.value.toLocaleString()} (${percent}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart */}
        <div className="col-span-2 bg-surface rounded-lg border border-border p-6 shadow-sm">
          <h2 className="mb-4">Haftalik ro'yxatdan o'tish</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyRegistrations}>
              <defs>
                <linearGradient id="colorValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
              <Tooltip isAnimationActive={false} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2563EB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValueGradient)"
                isAnimationActive={false}
                animationBegin={0}
                animationDuration={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Candidates Table */}
      <div className="bg-surface rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="m-0">Oxirgi ro'yxatdan o'tganlar</h2>
          <Link to="/admin/candidates" className="text-sm text-primary hover:text-primary-dark font-medium">
            Barchasini ko'rish →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Ism</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Telefon</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Viloyat</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Holat</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockCandidates.slice(0, 7).map((candidate) => (
                <tr key={candidate.id} className="hover:bg-muted/30">
                  <td className="px-6 py-3 text-sm font-medium text-text-primary">{candidate.name}</td>
                  <td className="px-6 py-3 text-sm mono text-text-muted">{candidate.phone}</td>
                  <td className="px-6 py-3 text-sm text-text-muted">{candidate.region}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={candidate.status} type="profile" />
                  </td>
                  <td className="px-6 py-3 text-sm text-text-muted">{candidate.registeredAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
