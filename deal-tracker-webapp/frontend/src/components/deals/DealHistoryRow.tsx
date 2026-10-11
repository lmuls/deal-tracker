import type { DealResponse } from '../../api/generated';
import { DealBadge } from '../ui';
import { DEAL_TYPE_LABEL, dealTitle, shortDate, timeAgo } from '../../utils/format';
import './DealHistoryRow.css';

const CONFIDENCE_TEXT = { HIGH: 'High confidence', MEDIUM: 'Medium confidence', LOW: 'Low confidence' } as const;

/**
 * One offer in a tracker's history. Live offers are raised with a `soft` badge; ended offers are flat with
 * no badge, since an ended offer isn't news and `paused` describes trackers, not offers.
 */
export function DealHistoryRow({ deal }: { deal: DealResponse }) {
  const live = !!deal.active;
  const meta = [
    !live && !deal.expiresAt && 'Ended',
    deal.type && DEAL_TYPE_LABEL[deal.type],
    !live && deal.discountValue,
    deal.confidence && CONFIDENCE_TEXT[deal.confidence],
    deal.detectedAt && `Found ${timeAgo(deal.detectedAt)}`,
    deal.expiresAt && `${live ? 'Ends' : 'Ended'} ${shortDate(deal.expiresAt)}`,
  ].filter(Boolean);

  return (
    <li className={live ? 'deal-row deal-row--live' : 'deal-row'}>
      <div className="deal-row__body">
        <p className="body deal-row__title">{dealTitle(deal)}</p>
        <p className="small deal-row__meta">{meta.join(' · ')}</p>
      </div>
      {live && <DealBadge tone="soft">{deal.discountValue || 'Live'}</DealBadge>}
    </li>
  );
}
