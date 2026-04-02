import { useState, useEffect, useCallback } from 'react';
import { listSites } from '../api/generated';
import type { SiteResponse } from '../api/generated';

export function useSites() {
  const [sites, setSites] = useState<SiteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await listSites();
    setSites(data ?? []);
    setError(err ? 'Failed to load sites' : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { sites, loading, error, refresh: fetch };
}
