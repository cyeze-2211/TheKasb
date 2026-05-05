import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardData } from '../types/dashboard';
import { fetchDashboardData } from '../app/api/dashboard';
import { axiosErrorMessage } from '../app/api/users';

type UseDashboardState = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
  refetch: () => Promise<void>;
};

export function useDashboard(): UseDashboardState {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const inFlight = useRef(false);

  const fetchData = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);

    try {
      setError(null);
      const result = await fetchDashboardData();
      setData(result);
      setLastUpdatedAt(Date.now());
    } catch (e) {
      setError(axiosErrorMessage(e, "Ma'lumot yuklanmadi"));
      setData(null);
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

