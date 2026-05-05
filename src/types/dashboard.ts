export interface DashboardResponse {
  success: boolean;
  message: string;
  object: DashboardData;
}

export interface DashboardData {
  summary: {
    totalCandidates: number;
    activeVacancies: number;
    urgentVacancies: number;
    todayApplications: number;
    todayVsYesterdayPercent: number;
    pendingApproval: number;
    overdueApprovalCount: number;
    activeUsersLast24h: number;
  };
  candidateFlow: Array<{
    date: string; // "2026-05-05"
    newCandidates: number;
    activatedCount: number;
  }>;
  statusDistribution: {
    DRAFT: number;
    PENDING: number;
    ACTIVE: number;
    SUSPENDED: number;
    PLACED: number;
  };
  topCountries: Array<{
    countryCode: string; // "KR", "PL", "DE"
    count: number;
  }>;
  languageSkills: Array<{
    language: string; // "RUSSIAN", "ENGLISH"
    count: number;
  }>;
  topProfessions: Array<{
    professionId: number;
    nameUz: string;
    total: number;
    trendPercent: number; // positive = o'sish, negative = kamayish
  }>;
  vacancyStatusDistribution: {
    DRAFT: number;
    ACTIVE: number;
    PAUSED: number;
    CLOSED: number;
    FILLED: number;
  };
  todayGoal: {
    target: number;
    completed: number;
    label: string;
  };
}

