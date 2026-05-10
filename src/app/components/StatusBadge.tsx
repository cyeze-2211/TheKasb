import {
  Archive,
  CheckCircle2,
  CircleDot,
  Clock,
  Eye,
  FileEdit,
  Shield,
  Star,
  User,
  Briefcase,
  XCircle,
} from 'lucide-react';
import { ProfileStatus, VacancyStatus, UserRole } from '../data/mockData';
import { accountTypeUz } from '../lib/adminUiUz';

const iconSm = 'h-3.5 w-3.5 flex-shrink-0';

const badgeShell =
  'inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] px-2.5 py-1 text-xs font-semibold shadow-[var(--elite-shadow-xs)] backdrop-blur-[2px] ring-1 ring-white/40 transition-[box-shadow,transform] duration-200 hover:shadow-[var(--elite-shadow-sm)]';

interface StatusBadgeProps {
  status: ProfileStatus | VacancyStatus;
  type: 'profile' | 'vacancy';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  if (type === 'profile') {
    const config = {
      PENDING: {
        label: 'Kutilmoqda',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Icon: Clock,
      },
      REVIEWING: {
        label: "Ko'rib chiqilmoqda",
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        Icon: Eye,
      },
      APPROVED: {
        label: 'Tasdiqlangan',
        color: 'bg-green-100 text-green-700 border-green-200',
        Icon: CheckCircle2,
      },
      REJECTED: {
        label: 'Rad etilgan',
        color: 'bg-red-100 text-red-700 border-red-200',
        Icon: XCircle,
      },
    };
    const c = config[status as ProfileStatus];
    const Icon = c.Icon;
    return (
      <span className={`${badgeShell} ${c.color}`}>
        <Icon className={iconSm} strokeWidth={2} aria-hidden />
        {c.label}
      </span>
    );
  }

  const config = {
    DRAFT: {
      label: 'Qoralama',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      Icon: FileEdit,
    },
    ACTIVE: {
      label: 'Faol',
      color: 'bg-green-100 text-green-700 border-green-200',
      Icon: CircleDot,
    },
    CLOSED: {
      label: 'Yopiq',
      color: 'bg-red-100 text-red-700 border-red-200',
      Icon: XCircle,
    },
    ARCHIVED: {
      label: 'Arxiv',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      Icon: Archive,
    },
  };
  const c = config[status as VacancyStatus];
  const Icon = c.Icon;
  return (
    <span className={`${badgeShell} ${c.color}`}>
      <Icon className={iconSm} strokeWidth={2} aria-hidden />
      {c.label}
    </span>
  );
}

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = {
    CANDIDATE: {
      label: accountTypeUz.CANDIDATE,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      Icon: User,
    },
    ADMIN: {
      label: accountTypeUz.ADMIN,
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      Icon: Shield,
    },
    SUPER_ADMIN: {
      label: accountTypeUz.SUPER_ADMIN,
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      Icon: Star,
    },
    AGENT: {
      label: accountTypeUz.AGENT,
      color: 'bg-teal-100 text-teal-700 border-teal-200',
      Icon: Briefcase,
    },
  };
  const c = config[role];
  const Icon = c.Icon;
  return (
    <span className={`${badgeShell} ${c.color}`}>
      <Icon className={iconSm} strokeWidth={2} aria-hidden />
      {c.label}
    </span>
  );
}
