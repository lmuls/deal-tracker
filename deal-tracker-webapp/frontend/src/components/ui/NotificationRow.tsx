import type { ReactNode } from 'react';
import { DealBadge } from './DealBadge';
import { cx } from './cx';
import './NotificationRow.css';

/** One alert in the notification list. */
export interface NotificationRowProps {
  store: string;
  message: string;
  /** e.g. "2 min ago". */
  time: ReactNode;
  unread?: boolean;
  /** Short badge text, e.g. "-20%". */
  badge?: string;
  /** Renders as a link. */
  href?: string;
  /** Renders as a button when no href. */
  onClick?: () => void;
  className?: string;
}

export function NotificationRow({ store, message, time, unread, badge, href, onClick, className }: NotificationRowProps) {
  const classes = cx('dt-notif', unread && 'dt-notif--unread', className);
  const content = (
    <>
      <span className="dt-notif__dot" aria-hidden="true" />
      <span className="dt-notif__body">
        <span className="dt-notif__store">{store}</span>
        <span className="dt-notif__msg">{message}</span>
      </span>
      <span className="dt-notif__meta">
        {badge && <DealBadge tone={unread ? 'deal' : 'soft'}>{badge}</DealBadge>}
        <span className="dt-notif__time">{time}</span>
      </span>
      {unread && <span className="dt-sr"> (unread)</span>}
    </>
  );

  if (href) return <a className={classes} href={href} onClick={onClick}>{content}</a>;
  if (onClick) return <button type="button" className={classes} onClick={onClick}>{content}</button>;
  return <div className={classes}>{content}</div>;
}
