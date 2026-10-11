import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteSite, getSite, listSiteDeals } from '../api/generated';
import type { DealResponse, SiteDetailResponse } from '../api/generated';
import {
  Button, EmptyState, Modal, Notice, PageHeader, Pager, Panel, Skeleton, StatTile, TrackerStatusBadge,
} from '../components/ui';
import { DealHistoryRow } from '../components/deals/DealHistoryRow';
import { displayUrl, plural, timeAgo, trackerStatus } from '../utils/format';
import { intervalText } from '../utils/intervals';
import { openOffer, toggleTrackerPaused } from '../utils/trackers';
import './TrackerDetail.css';

const PAGE_SIZE = 20;

export default function TrackerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<SiteDetailResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deals, setDeals] = useState<DealResponse[]>([]);
  const [totalDeals, setTotalDeals] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSite = useCallback(async () => {
    if (!id) return;
    const { data, error } = await getSite({ path: { id } });
    if (error || !data) setNotFound(true);
    else setSite(data);
  }, [id]);

  const loadDeals = useCallback(async () => {
    if (!id) return;
    setDealsLoading(true);
    const { data } = await listSiteDeals({ path: { id }, query: { page, size: PAGE_SIZE } });
    setDeals(data?.content ?? []);
    setTotalDeals(data?.totalElements ?? 0);
    setTotalPages(data?.totalPages ?? 0);
    setDealsLoading(false);
  }, [id, page]);

  useEffect(() => { loadSite(); }, [loadSite]);
  useEffect(() => { loadDeals(); }, [loadDeals]);

  const backLink = <Link className="small tracker-back" to="/dashboard">All trackers</Link>;

  if (notFound) {
    return (
      <>
        <PageHeader eyebrow={backLink} title="Tracker not found" />
        <EmptyState
          title="This tracker doesn’t exist"
          body="It may have been removed. Your other trackers are still on the dashboard."
          action={<Button variant="primary" onClick={() => navigate('/dashboard')}>Go to trackers</Button>}
        />
      </>
    );
  }

  if (!site) {
    return (
      <>
        <Skeleton shape="heading" />
        <Skeleton shape="tile" />
        <Skeleton shape="panel" />
      </>
    );
  }

  const status = trackerStatus(site);
  const liveCount = site.activeDealsCount ?? 0;

  const togglePause = async () => {
    setActionError(await toggleTrackerPaused(site));
    loadSite();
  };

  const remove = async () => {
    setRemoving(true);
    const { error } = await deleteSite({ path: { id: site.id! } });
    setRemoving(false);
    if (error) {
      setConfirmRemove(false);
      setActionError('Could not remove this tracker. Try again.');
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <>
      <PageHeader
        eyebrow={backLink}
        title={site.name}
        summary={<a className="tracker-url" href={site.url} target="_blank" rel="noopener noreferrer">{displayUrl(site.url)}</a>}
        actions={
          <>
            <Button variant="quiet" onClick={() => setConfirmRemove(true)}>Remove</Button>
            <Button variant="secondary" onClick={togglePause}>{site.active ? 'Pause' : 'Resume'}</Button>
            {status === 'deal' && <Button variant="primary" onClick={() => openOffer(site)}>View offer</Button>}
          </>
        }
      />

      {actionError && <Notice tone="error">{actionError}</Notice>}

      <div className="app-stat-grid">
        <StatTile
          value={liveCount.toLocaleString()}
          label="Offers live"
          detail={liveCount > 0 ? 'On this site right now' : 'Nothing live right now'}
          tone={liveCount > 0 ? 'deal' : 'default'}
        />
        <StatTile value={totalDeals.toLocaleString()} label="Offers found" detail="Since you started tracking" />
        <Panel title="Tracker">
          <dl className="tracker-facts small">
            <dt>Status</dt>
            <dd><TrackerStatusBadge status={status} /></dd>
            <dt>Checks</dt>
            <dd>{site.active ? `Every ${intervalText(site.checkInterval)}` : 'Paused, not checking'}</dd>
            <dt>Last checked</dt>
            <dd>{site.lastCheckedAt ? timeAgo(site.lastCheckedAt) : 'Not checked yet'}</dd>
            <dt>Watching for</dt>
            <dd>Any campaign or offer</dd>
          </dl>
        </Panel>
      </div>

      <Panel title="Offer history" aside={!dealsLoading && <span className="muted">{plural(totalDeals, 'offer')}</span>}>
        {dealsLoading ? (
          <Skeleton shape="list" />
        ) : deals.length === 0 ? (
          <EmptyState
            title="No offers found yet"
            body={`We check this site every ${intervalText(site.checkInterval)} and list every offer we find here.`}
          />
        ) : (
          <>
            <ul className="tracker-deals">
              {deals.map((deal) => <DealHistoryRow key={deal.id} deal={deal} />)}
            </ul>
            <Pager page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </Panel>

      <Modal open={confirmRemove} onClose={() => setConfirmRemove(false)} label="Remove tracker" card>
        <div className="tracker-confirm">
          <h2 className="heading-2">Remove {site.name}?</h2>
          <p className="body muted">
            We stop checking {displayUrl(site.url)} and delete its offer history. This can’t be undone.
          </p>
          <div className="tracker-confirm__actions">
            <Button variant="quiet" onClick={() => setConfirmRemove(false)}>Keep tracking</Button>
            <Button variant="secondary" onClick={remove} disabled={removing}>Remove tracker</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
