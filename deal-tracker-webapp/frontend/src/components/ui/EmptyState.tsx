import type { ReactNode } from 'react';
import { cx } from './cx';
import './EmptyState.css';

/** What an empty list shows. */
export interface EmptyStateProps {
  title: string;
  body?: string;
  /** Usually one Button. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cx('dt-empty', className)}>
      <div className="dt-empty__mark" aria-hidden="true">
        <span className="dt-empty__ring dt-empty__ring--3" />
        <span className="dt-empty__ring dt-empty__ring--2" />
        <span className="dt-empty__core" />
      </div>
      <h3 className="dt-empty__title">{title}</h3>
      {body && <p className="dt-empty__body">{body}</p>}
      {action && <div className="dt-empty__action">{action}</div>}
    </div>
  );
}
