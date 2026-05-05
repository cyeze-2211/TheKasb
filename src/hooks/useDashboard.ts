import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardData, DashboardResponse } from '../types/dashboard';
import { KASB_ACCESS_TOKEN_KEY } from '../constants/kasbAuth';

type UseDashboardState = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
  refetch: () => Promise<void>;
};

const DASHBOARD_URL_DEV = '/kasb-backend/v1/admin/dashboard/stats';

function authHeader(): HeadersInit {
  const token = localStorage.getItem(KASB_ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useDashboard(): UseDashboardState {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const inFlight = useRef(false);

  const fetchData = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    try {
      setError(null);
      const res = await fetch(DASHBOARD_URL_DEV, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
      });

      if (!res.ok) {
        throw new Error('Ma\'lumot yuklanmadi');
      }

      const json = (await res.json()) as DashboardResponse;
      if (json?.success) {
        setData(json.object);
        setLastUpdatedAt(Date.now());
      } else {
        setError(json?.message || "Ma'lumot yuklanmadi");
      }
    } catch {
      setError("Ma'lumot yuklanmadi");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = window.setInterval(fetchData, 60_000);
    return () => window.clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, lastUpdatedAt, refetch: fetchData };
}

