import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/generated';
import type { NotificationResponse } from '../api/generated';
import { Button, EmptyState, NotificationRow, Notice, PageHeader, Skeleton } from '../components/ui';
import { useUnread } from '../context/UnreadContext';
import { dealTitle, isToday, plural, timeAgo } from '../utils/format';
import './Alerts.css';

const PAGE_SIZE = 30;

function AlertGroup({ title, alerts, onOpen }: {
  title: string;
  alerts: NotificationResponse[];
  onOpen: (n: NotificationResponse) => void;
}) {
  if (alerts.length === 0) return null;
  return (
    <section className="alerts-group">
      <h2 className="label alerts-group__title">{title}</h2>
      <div className="alerts-rows">
        {alerts.map((n) => (
          <NotificationRow
            key={n.id}
            store={n.deal?.siteName ?? 'Tracked site'}
            message={n.deal ? dealTitle(n.deal) : 'Offer found'}
            time={timeAgo(n.createdAt)}
            unread={n.status !== 'READ'}
            badge={n.deal?.discountValue}
            onClick={() => onOpen(n)}
          />
        ))}
      </div>
    </section>
  );
}

export default function Alerts() {
  const navigate = useNavigate();
  const { unread, refreshUnread } = useUnread();
  const [alerts, setAlerts] = useState<NotificationResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    const { data, error: err } = await listNotifications({ query: { page: p, size: PAGE_SIZE } });
    setLoading(false);
    if (err || !data) {
      setError('Could not load your alerts. Reload the page to try again.');
      return;
    }
    setError(null);
    setAlerts((prev) => (p === 0 ? data.content ?? [] : [...prev, ...(data.content ?? [])]));
    setHasMore(p + 1 < (data.totalPages ?? 0));
    setPage(p);
  }, []);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    await load(page + 1);
    setLoadingMore(false);
  };

  useEffect(() => { load(0); }, [load]);

  const open = async (n: NotificationResponse) => {
    if (n.id && n.status !== 'READ') {
      await markNotificationRead({ path: { id: n.id } });
      refreshUnread();
    }
    if (n.deal?.siteId) navigate(`/sites/${n.deal.siteId}`);
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setAlerts((prev) => prev.map((n) => ({ ...n, status: 'READ' as const })));
    refreshUnread();
  };

  const today = alerts.filter((n) => isToday(n.createdAt));
  const earlier = alerts.filter((n) => !isToday(n.createdAt));

  return (
    <>
      <PageHeader
        title="Alerts"
        summary={unread > 0 ? `${plural(unread, 'new offer')} since you last looked` : 'You’re up to date'}
        actions={unread > 0 && <Button variant="secondary" onClick={markAllRead}>Mark all as read</Button>}
      />

      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <Skeleton shape="panel" />
      ) : alerts.length === 0 ? (
        !error && (
          <EmptyState
            title="No alerts yet"
            body="When a tracker finds a campaign or offer, it shows up here and in your email if you’ve turned that on."
          />
        )
      ) : (
        <div className="alerts-list">
          <AlertGroup title="Today" alerts={today} onOpen={open} />
          <AlertGroup title="Earlier" alerts={earlier} onOpen={open} />
          {hasMore && (
            <div className="alerts-more">
              <Button variant="quiet" onClick={loadMore} disabled={loadingMore}>Show older alerts</Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
