import { Button } from './Button';
import { DealBadge, type DealBadgeTone } from './DealBadge';
import { cx } from './cx';
import './TrackerCard.css';

export type TrackerStatus = 'watching' | 'deal' | 'paused';

/** One tracked website or store. */
export interface TrackerCardProps {
  store: string;
  /** Display URL, e.g. "nordicoutdoor.se/sale". */
  url?: string;
  /** Square logo image URL; falls back to the store's initial. */
  logo?: string;
  status?: TrackerStatus;
  /** Shown when status is "deal". */
  deal?: { title: string; detail?: string };
  /** What the tracker looks for, e.g. "Any campaign on jackets". */
  watchFor?: string;
  /** e.g. "Checked 4 min ago". */
  lastChecked?: string;
  /** Renders a Pause / Resume quiet button. */
  onTogglePause?: () => void;
  /** Renders a primary "View offer" button when status is "deal". */
  onViewOffer?: () => void;
  /** Renders a quiet "Details" button. */
  onOpen?: () => void;
  className?: string;
}

const STATUS: Record<TrackerStatus, { tone: DealBadgeTone; label: string }> = {
  watching: { tone: 'watching', label: 'Watching' },
  deal: { tone: 'deal', label: 'Offer live' },
  paused: { tone: 'paused', label: 'Paused' },
};

/** The status pill a tracker shows on its card and its detail page. */
export function TrackerStatusBadge({ status }: { status: TrackerStatus }) {
  const s = STATUS[status];
  return <DealBadge tone={s.tone} dot={status !== 'paused'}>{s.label}</DealBadge>;
}

export function TrackerCard({
  store, url, logo, status = 'watching', deal, watchFor, lastChecked,
  onTogglePause, onViewOffer, onOpen, className,
}: TrackerCardProps) {
  const initial = (store || '?').trim().charAt(0).toUpperCase();
  const showViewOffer = status === 'deal' && onViewOffer;

  return (
    <article className={cx('dt-card', `dt-card--${status}`, className)}>
      <div className="dt-card__head">
        <div className="dt-card__logo" aria-hidden="true">
          {logo ? <img src={logo} alt="" /> : initial}
        </div>
        <div className="dt-card__id">
          <h3 className="dt-card__store">{store}</h3>
          {url && <p className="dt-card__url">{url}</p>}
        </div>
      </div>

      <div className="dt-card__status">
        <TrackerStatusBadge status={status} />
        {lastChecked && <span className="dt-card__checked">{lastChecked}</span>}
      </div>

      {status === 'deal' && deal && (
        <div className="dt-card__deal">
          <p className="dt-card__deal-title">{deal.title}</p>
          {deal.detail && <p className="dt-card__deal-detail">{deal.detail}</p>}
        </div>
      )}

      {watchFor && (
        <p className="dt-card__watch">
          <span className="dt-card__watch-label">Watching for</span> {watchFor}
        </p>
      )}

      {(onOpen || onTogglePause || showViewOffer) && (
        <div className="dt-card__foot">
          {onOpen && <Button variant="quiet" size="sm" onClick={onOpen}>Details</Button>}
          {onTogglePause && (
            <Button variant="quiet" size="sm" onClick={onTogglePause}>
              {status === 'paused' ? 'Resume' : 'Pause'}
            </Button>
          )}
          {showViewOffer && <Button variant="primary" size="sm" onClick={onViewOffer}>View offer</Button>}
        </div>
      )}
    </article>
  );
}
