import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { listActiveDeals, listSites } from '../../api/generated';
import type { DealResponse, SiteResponse } from '../../api/generated';
import StatsCards from './StatsCards';
import ActiveDealsFeed from './ActiveDealsFeed';
import SiteStatusGrid from './SiteStatusGrid';

function isToday(dateString?: string): boolean {
  if (!dateString) return false;
  const d = new Date(dateString);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export default function DashboardPage() {
  const [deals, setDeals] = useState<DealResponse[]>([]);
  const [sites, setSites] = useState<SiteResponse[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(true);

  useEffect(() => {
    listActiveDeals().then(({ data }) => {
      setDeals(data ?? []);
      setDealsLoading(false);
    });

    listSites().then(({ data }) => {
      setSites(data ?? []);
      setSitesLoading(false);
    });
  }, []);

  const dealsToday = deals.filter((d) => isToday(d.detectedAt)).length;

  return (
    <>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      <StatsCards
        totalSites={sites.length}
        activeDeals={deals.length}
        dealsToday={dealsToday}
      />
      <ActiveDealsFeed deals={deals} loading={dealsLoading} />
      <SiteStatusGrid sites={sites} loading={sitesLoading} />
    </>
  );
}
