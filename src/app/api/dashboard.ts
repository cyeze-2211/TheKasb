import type { DashboardData } from '../../types/dashboard';
import { api } from './client';
import { assertApiSuccess } from './users';
import { fetchCandidatesList, pickNum, pickStr } from './candidates';
import { fetchVacanciesList } from './vacancies';
import { fetchCustomProfessionsList } from './customProfessions';

const DASHBOARD_PATHS = ['/v1/admin/dashboard/stats', '/v1/admin/dashboard'] as const;

let dashboardFetchInFlight: Promise<DashboardData> | null = null;

function isEnvelopeFailure(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  return (data as Record<string, unknown>).success === false;
}

const EMPTY_STATUS: DashboardData['statusDistribution'] = {
  DRAFT: 0,
  PENDING: 0,
  ACTIVE: 0,
  SUSPENDED: 0,
  PLACED: 0,
};

function extractPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.success === true && o.object && typeof o.object === 'object') return o.object;
  if ('summary' in o && typeof (o as DashboardData).summary === 'object') return o;
  if (o.data && typeof o.data === 'object' && 'summary' in (o.data as object)) return o.data;
  return null;
}

function isDashboardShape(x: unknown): x is DashboardData {
  if (!x || typeof x !== 'object') return false;
  const s = (x as DashboardData).summary;
  return !!s && typeof s === 'object' && typeof s.totalCandidates === 'number';
}

function normalizeDashboard(d: DashboardData): DashboardData {
  const s = d.summary;
  return {
    ...d,
    summary: {
      ...s,
      pendingCustomProfessions: s.pendingCustomProfessions ?? 0,
    },
    candidateFlow: Array.isArray(d.candidateFlow) ? d.candidateFlow : [],
    statusDistribution: { ...EMPTY_STATUS, ...d.statusDistribution },
    topCountries: Array.isArray(d.topCountries) ? d.topCountries : [],
    languageSkills: Array.isArray(d.languageSkills) ? d.languageSkills : [],
    topProfessions: Array.isArray(d.topProfessions) ? d.topProfessions : [],
    vacancyStatusDistribution: d.vacancyStatusDistribution ?? {
      DRAFT: 0,
      ACTIVE: 0,
      PAUSED: 0,
      CLOSED: 0,
      FILLED: 0,
    },
    todayGoal: d.todayGoal ?? {
      target: 100,
      completed: 0,
      label: 'Bugungi maqsad',
    },
    recentCandidates: Array.isArray(d.recentCandidates) ? d.recentCandidates : undefined,
  };
}

function createdDayIso(row: Record<string, unknown>): string | null {
  const raw =
    row.createdAt ?? row.created_at ?? row.registeredAt ?? row.registered_at ?? row.createdDate;
  if (raw == null) return null;
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function fillLast30Days(
  m: Map<string, { newCandidates: number; activatedCount: number }>,
): DashboardData['candidateFlow'] {
  const out: DashboardData['candidateFlow'] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const v = m.get(key) ?? { newCandidates: 0, activatedCount: 0 };
    out.push({ date: key, ...v });
  }
  return out;
}

function aggregateCountries(rows: Record<string, unknown>[]): DashboardData['topCountries'] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = row.target_country_codes ?? row.targetCountryCodes ?? row.target_countries;
    if (Array.isArray(raw)) {
      for (const c of raw) {
        const code = String(c).trim().toUpperCase();
        if (code.length >= 2) counts.set(code.slice(0, 2), (counts.get(code.slice(0, 2)) ?? 0) + 1);
      }
      continue;
    }
    const c = pickStr(row, 'countryCode', 'country_code', 'primary_target_country').toUpperCase();
    if (c.length >= 2) counts.set(c.slice(0, 2), (counts.get(c.slice(0, 2)) ?? 0) + 1);
  }
  return [...counts.entries()].map(([countryCode, count]) => ({ countryCode, count }));
}

function aggregateLanguages(rows: Record<string, unknown>[]): DashboardData['languageSkills'] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lang = pickStr(row, 'primary_language', 'primaryLanguage', 'language').toUpperCase();
    if (!lang) continue;
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  return [...counts.entries()].map(([language, count]) => ({ language, count }));
}

function aggregateProfessions(rows: Record<string, unknown>[]): DashboardData['topProfessions'] {
  const byKey = new Map<number, { nameUz: string; total: number }>();
  for (const row of rows) {
    let pid = pickNum(row, 'professionId', 'profession_id');
    const nameUz = pickStr(row, 'profession_name', 'professionName', 'profession');
    if ((pid == null || pid <= 0) && nameUz) {
      pid =
        ([...nameUz].reduce((a, ch) => (a * 33 + ch.charCodeAt(0)) | 0, 7) & 0x7fff_fffe) | 1;
    }
    if (pid == null || pid <= 0) continue;
    const cur = byKey.get(pid) ?? { nameUz: nameUz || `Kasb #${pid}`, total: 0 };
    if (nameUz) cur.nameUz = nameUz;
    cur.total += 1;
    byKey.set(pid, cur);
  }
  return [...byKey.entries()].map(([professionId, v]) => ({
    professionId,
    nameUz: v.nameUz,
    total: v.total,
    trendPercent: 0,
  }));
}

function countStatusesInSample(rows: Record<string, unknown>[]): DashboardData['statusDistribution'] {
  const c = { ...EMPTY_STATUS };
  for (const row of rows) {
    const st = pickStr(row, 'profile_status', 'profileStatus', 'status').toUpperCase();
    if (st === 'DRAFT') c.DRAFT += 1;
    else if (st === 'PENDING') c.PENDING += 1;
    else if (st === 'ACTIVE') c.ACTIVE += 1;
    else if (st === 'SUSPENDED') c.SUSPENDED += 1;
    else if (st === 'PLACED') c.PLACED += 1;
    else c.PENDING += 1;
  }
  return c;
}

/** Namunadan umumiy nomzodlar soniga taxminan moslashtirish (alohida filtr so‘rovlarsiz). */
function scaleStatusDistribution(
  raw: DashboardData['statusDistribution'],
  sampleSize: number,
  total: number,
): DashboardData['statusDistribution'] {
  if (total <= 0 || sampleSize <= 0) return { ...EMPTY_STATUS };
  if (total <= sampleSize) return { ...EMPTY_STATUS, ...raw };

  type K = keyof DashboardData['statusDistribution'];
  const keys: K[] = ['DRAFT', 'PENDING', 'ACTIVE', 'SUSPENDED', 'PLACED'];
  const scaled = keys.map((k) => Math.max(0, Math.round((raw[k] / sampleSize) * total)));
  let diff = total - scaled.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (diff !== 0 && guard < 10_000) {
    const j = scaled.indexOf(Math.max(...scaled));
    if (diff > 0) {
      scaled[j] += 1;
      diff -= 1;
    } else if (scaled[j] > 0) {
      scaled[j] -= 1;
      diff += 1;
    } else break;
    guard += 1;
  }
  return { DRAFT: scaled[0], PENDING: scaled[1], ACTIVE: scaled[2], SUSPENDED: scaled[3], PLACED: scaled[4] };
}

async function buildDashboardFallback(): Promise<DashboardData> {
  try {
    const [sample, activeVac, urgentVac, customPending] = await Promise.all([
      fetchCandidatesList({ page: 0, size: 400, sort: 'createdAt,desc' }),
      fetchVacanciesList({ status: 'ACTIVE', page: 0, size: 1 }),
      fetchVacanciesList({ status: 'ACTIVE', isUrgent: true, page: 0, size: 1 }),
      fetchCustomProfessionsList({ isReviewed: false, page: 0, size: 1 }),
    ]);

    const totalCandidates = sample.totalElements;
    const n = sample.content.length;
    const rawStatus = countStatusesInSample(sample.content);
    const statusDistribution = scaleStatusDistribution(rawStatus, n, totalCandidates);

    const flowMap = new Map<string, { newCandidates: number; activatedCount: number }>();
    for (const row of sample.content) {
      const day = createdDayIso(row);
      if (!day) continue;
      const cur = flowMap.get(day) ?? { newCandidates: 0, activatedCount: 0 };
      cur.newCandidates += 1;
      const st = pickStr(row, 'profile_status', 'profileStatus', 'status');
      if (st === 'ACTIVE') cur.activatedCount += 1;
      flowMap.set(day, cur);
    }

    const candidateFlow = fillLast30Days(flowMap);
    const todayKey = candidateFlow[candidateFlow.length - 1]?.date;
    const yKey = candidateFlow[candidateFlow.length - 2]?.date;
    const tToday = todayKey ? (flowMap.get(todayKey)?.newCandidates ?? 0) : 0;
    const tYest = yKey ? (flowMap.get(yKey)?.newCandidates ?? 0) : 0;
    const todayVsYesterdayPercent =
      tYest === 0 ? (tToday > 0 ? 100 : 0) : Math.round(((tToday - tYest) / tYest) * 100);

    const topCountries = aggregateCountries(sample.content).sort((a, b) => b.count - a.count);
    const languageSkills = aggregateLanguages(sample.content);
    const topProfessions = aggregateProfessions(sample.content);

    const activatedToday = todayKey ? (flowMap.get(todayKey)?.activatedCount ?? 0) : 0;

    return normalizeDashboard({
      summary: {
        totalCandidates,
        activeVacancies: activeVac.totalElements,
        urgentVacancies: urgentVac.totalElements,
        todayApplications: tToday,
        todayVsYesterdayPercent,
        pendingApproval: statusDistribution.PENDING,
        overdueApprovalCount: 0,
        activeUsersLast24h: statusDistribution.ACTIVE,
        pendingCustomProfessions: customPending.totalElements,
      },
      candidateFlow,
      statusDistribution,
      topCountries,
      languageSkills,
      topProfessions,
      vacancyStatusDistribution: {
        DRAFT: 0,
        ACTIVE: activeVac.totalElements,
        PAUSED: 0,
        CLOSED: 0,
        FILLED: 0,
      },
      todayGoal: {
        target: 100,
        completed: activatedToday,
        label: 'Bugungi maqsad',
      },
      recentCandidates: sample.content.slice(0, 10),
    });
  } catch {
    return normalizeDashboard({
      summary: {
        totalCandidates: 0,
        activeVacancies: 0,
        urgentVacancies: 0,
        todayApplications: 0,
        todayVsYesterdayPercent: 0,
        pendingApproval: 0,
        overdueApprovalCount: 0,
        activeUsersLast24h: 0,
        pendingCustomProfessions: 0,
      },
      candidateFlow: fillLast30Days(new Map()),
      statusDistribution: { ...EMPTY_STATUS },
      topCountries: [],
      languageSkills: [],
      topProfessions: [],
      vacancyStatusDistribution: {
        DRAFT: 0,
        ACTIVE: 0,
        PAUSED: 0,
        CLOSED: 0,
        FILLED: 0,
      },
      todayGoal: { target: 100, completed: 0, label: 'Bugungi maqsad' },
    });
  }
}

/**
 * Avvalo `GET /v1/admin/dashboard/stats`, keyin `GET /v1/admin/dashboard` (Swagger).
 * Har yuklanishda ikkala yo‘l ham ketadi (stats har doim sinanadi). Muvaffaqiyatsiz bo‘lsa keyingi yo‘l yoki fallback.
 */
async function fetchDashboardDataOnce(): Promise<DashboardData> {
  for (const path of DASHBOARD_PATHS) {
    try {
      const { data } = await api.get<unknown>(path);
      if (isEnvelopeFailure(data)) continue;
      assertApiSuccess(data);
      const payload = extractPayload(data);
      if (payload && isDashboardShape(payload)) {
        return normalizeDashboard(payload as DashboardData);
      }
    } catch {
      /* keyingi yo‘l yoki fallback */
    }
  }
  return buildDashboardFallback();
}

export async function fetchDashboardData(): Promise<DashboardData> {
  if (dashboardFetchInFlight) return dashboardFetchInFlight;
  dashboardFetchInFlight = fetchDashboardDataOnce().finally(() => {
    dashboardFetchInFlight = null;
  });
  return dashboardFetchInFlight;
}
