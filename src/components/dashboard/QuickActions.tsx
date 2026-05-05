import { useNavigate } from 'react-router';
import type { DashboardData } from '../../types/dashboard';

function ActionCard({
  title,
  subtitle,
  onClick,
  tint,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
  tint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
      style={{
        background: tint,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs text-white/65">{subtitle}</div>
    </button>
  );
}

export function QuickActions({
  summary,
  todayGoal,
}: {
  summary: DashboardData['summary'];
  todayGoal: DashboardData['todayGoal'];
}) {
  const navigate = useNavigate();
  const pct = todayGoal.target > 0 ? Math.min(100, Math.round((todayGoal.completed / todayGoal.target) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div
        className="kasb-dash-card rounded-2xl p-5"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Tezkor harakatlar</h3>
          <p className="mt-1 text-xs text-white/55">Tez kirish</p>
        </div>

        <div className="space-y-3">
          <ActionCard
            title={`🔴 ${summary.pendingApproval.toLocaleString('ru-RU')} ta profil kutmoqda`}
            subtitle="Ko'rib chiqishni boshlash →"
            tint="rgba(239,68,68,0.10)"
            onClick={() => navigate('/admin/candidates')}
          />
          <ActionCard
            title={`🟡 ${summary.urgentVacancies.toLocaleString('ru-RU')} ta yangi maxsus kasb`}
            subtitle="Rasmiylashtirish kerak"
            tint="rgba(245,158,11,0.10)"
            onClick={() => navigate('/admin/custom-professions')}
          />
          <ActionCard
            title="🔵 + Yangi vakansiya yaratish"
            subtitle="Vakansiyalar bo‘limiga o‘tish →"
            tint="rgba(59,130,246,0.10)"
            onClick={() => navigate('/admin/vacancies/create')}
          />
        </div>
      </div>

      <div className="kasb-dash-card rounded-2xl p-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          {todayGoal.label}
        </div>
        <div className="mono text-sm font-semibold text-white/85" style={{ fontVariantNumeric: 'tabular-nums' }}>
          Bugungi maqsad: {todayGoal.completed}/{todayGoal.target}
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10B981, #34D399)' }}
          />
        </div>

        <p className="mt-3 text-xs text-white/55">Bugun {todayGoal.completed} ta profil tasdiqlandi</p>
      </div>
    </div>
  );
}

