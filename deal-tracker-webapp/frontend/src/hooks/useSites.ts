import { useState, useEffect, useCallback } from 'react';
import { listActiveDeals, listSites } from '../api/generated';
import type { DealResponse, SiteResponse } from '../api/generated';

/** The user's tracked sites and their live offers. */
export function useSites() {
  const [sites, setSites] = useState<SiteResponse[]>([]);
  const [activeDeals, setActiveDeals] = useState<DealResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [sitesRes, dealsRes] = await Promise.all([listSites(), listActiveDeals()]);
    // Keep what's on screen when a refresh fails; the error notice says why it's stale.
    if (!sitesRes.error) setSites(sitesRes.data ?? []);
    if (!dealsRes.error) setActiveDeals(dealsRes.data ?? []);
    setError(sitesRes.error ? 'Could not load your trackers. Reload the page to try again.' : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sites, activeDeals, loading, error, refresh };
}
