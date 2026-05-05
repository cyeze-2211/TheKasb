import { Activity, AlertTriangle, Briefcase, FileText, Users } from 'lucide-react';
import { CandidateFlowChart } from '../components/dashboard/CandidateFlowChart';
import { LanguageSkills } from '../components/dashboard/LanguageSkills';
import { QuickActions } from '../components/dashboard/QuickActions';
import { StatusDonutChart } from '../components/dashboard/StatusDonutChart';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { TopCountries } from '../components/dashboard/TopCountries';
import { TopProfessions } from '../components/dashboard/TopProfessions';
import { useDashboard } from '../hooks/useDashboard';

function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border p-5 ${className}`}
      style={{ background: 'var(--kasb-dash-card)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="mt-3 h-8 w-40 rounded bg-white/10" />
      <div className="mt-3 h-3 w-56 rounded bg-white/10" />
    </div>
  );
}

function PanelSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-2xl border p-5"
      style={{ background: 'var(--kasb-dash-card)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="h-3 w-40 rounded bg-white/10" />
      <div className="mt-2 h-3 w-56 rounded bg-white/10" />
      <div className="mt-5 w-full rounded-xl bg-white/10" style={{ height }} />
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error, lastUpdatedAt, refetch } = useDashboard();

  return (
    <div
      className="kasb-dash-shell h-full w-full overflow-y-auto p-6"
      style={{
        color: '#fff',
      }}
    >
      <div className="mx-auto max-w-[1280px] space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Boshqaruv paneli</h1>
            <p className="mt-1 text-sm text-white/55">Umumiy statistika va real vaqt monitoring</p>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdatedAt ? (
              <span className="text-xs text-white/45">
                Yangilandi: {new Date(lastUpdatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl border px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.04]"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              disabled={loading}
            >
              Yangilash
            </button>
          </div>
        </div>

        {error && !loading ? (
          <div
            className="rounded-2xl border p-5"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Ma'lumot yuklanmadi</p>
                <p className="mt-1 text-xs text-white/70">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-xl border px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/[0.04]"
                style={{ borderColor: 'rgba(255,255,255,0.14)' }}
              >
                Qayta urinish
              </button>
            </div>
          </div>
        ) : null}

        {/* ROW 1: Summary cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {loading || !data ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <SummaryCard
                title="Jami nomzodlar"
                value={data.summary.totalCandidates}
                accent="blue"
                icon={<Users size={18} />}
              />
              <SummaryCard
                title="Faol vakansiyalar"
                value={data.summary.activeVacancies}
                badge={`${data.summary.urgentVacancies} ta 🔴 SHOSHILINCH`}
                accent="yellow"
                icon={<Briefcase size={18} />}
              />
              <SummaryCard
                title="Bugun arizalar"
                value={data.summary.todayApplications}
                subtitle={`↑ ${data.summary.todayVsYesterdayPercent}% kechagidan`}
                accent="green"
                icon={<FileText size={18} />}
              />
              <SummaryCard
                title="Tasdiqlash kutmoqda"
                value={data.summary.pendingApproval}
                subtitle={`⚠ ${data.summary.overdueApprovalCount} ta kechikkan (3+ kun)`}
                accent="red"
                icon={<AlertTriangle size={18} />}
              />
              <SummaryCard
                title="OTP / Faollik"
                value={data.summary.activeUsersLast24h}
                subtitle="Aktiv foydalanuvchilar"
                accent="purple"
                icon={<Activity size={18} />}
              />
            </>
          )}
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-20">
          <div className="lg:col-span-11">
            {loading || !data ? <PanelSkeleton height={280} /> : <CandidateFlowChart data={data.candidateFlow} />}
          </div>
          <div className="lg:col-span-5">
            {loading || !data ? (
              <PanelSkeleton height={230} />
            ) : (
              <StatusDonutChart
                distribution={data.statusDistribution}
                totalCandidates={data.summary.totalCandidates}
              />
            )}
          </div>
          <div className="lg:col-span-4">
            {loading || !data ? <PanelSkeleton height={230} /> : <TopCountries countries={data.topCountries} />}
          </div>
        </div>

        {/* ROW 3 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-20">
          <div className="lg:col-span-5">
            {loading || !data ? <PanelSkeleton height={220} /> : <LanguageSkills items={data.languageSkills} />}
          </div>
          <div className="lg:col-span-9">
            {loading || !data ? <PanelSkeleton height={260} /> : <TopProfessions items={data.topProfessions} />}
          </div>
          <div className="lg:col-span-6">
            {loading || !data ? (
              <PanelSkeleton height={340} />
            ) : (
              <QuickActions summary={data.summary} todayGoal={data.todayGoal} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

