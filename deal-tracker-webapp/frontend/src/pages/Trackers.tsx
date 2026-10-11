import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { DealResponse, SiteResponse } from '../api/generated';
import {
  AddTrackerForm, Button, EmptyState, Modal, Notice, PageHeader, Skeleton, StatTile, TrackerCard,
  type TrackerFormValues,
} from '../components/ui';
import { useSites } from '../hooks/useSites';
import { useAddTracker } from '../hooks/useAddTracker';
import { dealDetail, dealTitle, displayUrl, isToday, plural, timeAgo, trackerStatus } from '../utils/format';
import { intervalText } from '../utils/intervals';
import { openOffer, toggleTrackerPaused } from '../utils/trackers';
import './Trackers.css';

/** Set by the landing page when a tracker filled in before sign-up could not be created. */
export interface PendingTrackerState {
  pendingTracker: TrackerFormValues;
  error: string;
}

function lastCheckedText(site: SiteResponse, deal?: DealResponse): string {
  if (!site.active) return 'Paused';
  if (deal?.detectedAt) return `Found ${timeAgo(deal.detectedAt)}`;
  return site.lastCheckedAt ? `Checked ${timeAgo(site.lastCheckedAt)}` : 'Not checked yet';
}

export default function Trackers() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sites, activeDeals, loading, error, refresh } = useSites();
  const [pending] = useState(() => location.state as PendingTrackerState | null);
  const [adding, setAdding] = useState(!!pending);
  const [actionError, setActionError] = useState<string | null>(null);
  const addTracker = useAddTracker(() => { setAdding(false); refresh(); }, pending?.error);

  // Consume the landing page's hand-off so a reload doesn't reopen the form.
  useEffect(() => {
    if (pending) navigate(location.pathname, { replace: true, state: null });
  }, [pending, navigate, location.pathname]);

  const openAdd = () => { addTracker.setError(undefined); setAdding(true); };

  const togglePause = async (site: SiteResponse) => {
    setActionError(await toggleTrackerPaused(site));
    refresh();
  };

  const firstDealBySite = new Map<string, DealResponse>();
  for (const deal of activeDeals) {
    if (deal.siteId && !firstDealBySite.has(deal.siteId)) firstDealBySite.set(deal.siteId, deal);
  }

  const activeCount = sites.filter((s) => s.active).length;
  const liveCount = activeDeals.length;
  const foundToday = activeDeals.filter((d) => isToday(d.detectedAt)).length;
  const empty = !loading && !error && sites.length === 0;

  const summary = loading
    ? 'Loading your trackers'
    : `${activeCount} active · ${liveCount === 0 ? 'no offers live' : plural(liveCount, 'offer') + ' live'}`;

  return (
    <>
      <PageHeader
        title="Your trackers"
        summary={summary}
        actions={!empty && <Button variant="primary" onClick={openAdd}>Track a new site</Button>}
      />

      {error && <Notice tone="error">{error}</Notice>}
      {actionError && <Notice tone="error">{actionError}</Notice>}

      {loading ? (
        <div className="trackers-grid">
          {[0, 1, 2].map((i) => <Skeleton key={i} shape="card" />)}
        </div>
      ) : empty ? (
        <EmptyState
          title="No trackers yet"
          body="Add a store or page and we check it for campaigns and offers. Daily by default, or as often as every 30 minutes."
          action={<Button variant="primary" onClick={openAdd}>Track your first site</Button>}
        />
      ) : sites.length > 0 && (
        <>
          <div className="app-stat-grid">
            <StatTile value={sites.length.toLocaleString()} label="Sites tracked" detail={`${sites.length - activeCount} paused`} />
            <StatTile
              value={liveCount.toLocaleString()}
              label="Offers live"
              detail={`On ${plural(firstDealBySite.size, 'site')}`}
              tone={liveCount > 0 ? 'deal' : 'default'}
            />
            <StatTile
              value={foundToday.toLocaleString()}
              label="Found today"
              detail="New offers since midnight"
              tone={foundToday > 0 ? 'deal' : 'default'}
            />
          </div>

          <div className="trackers-grid">
            {sites.map((site) => {
              const status = trackerStatus(site);
              const deal = firstDealBySite.get(site.id ?? '');
              const more = (site.activeDealsCount ?? 0) - 1;
              return (
                <TrackerCard
                  key={site.id}
                  store={site.name ?? displayUrl(site.url)}
                  url={displayUrl(site.url)}
                  status={status}
                  deal={deal && {
                    title: dealTitle(deal),
                    detail: [dealDetail(deal), more > 0 && `${plural(more, 'more offer')}`].filter(Boolean).join(' · ') || undefined,
                  }}
                  watchFor={`Any campaign, every ${intervalText(site.checkInterval)}`}
                  lastChecked={lastCheckedText(site, deal)}
                  onOpen={() => navigate(`/sites/${site.id}`)}
                  onTogglePause={() => togglePause(site)}
                  onViewOffer={() => openOffer(site)}
                />
              );
            })}
          </div>
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} label="Track a new site">
        <AddTrackerForm
          defaultValues={pending?.pendingTracker}
          onSubmit={addTracker.submit}
          onCancel={() => setAdding(false)}
          submitting={addTracker.submitting}
          error={addTracker.error}
        />
      </Modal>
    </>
  );
}
