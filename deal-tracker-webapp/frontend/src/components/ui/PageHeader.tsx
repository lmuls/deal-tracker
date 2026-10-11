import type { ReactNode } from 'react';
import { cx } from './cx';
import './PageHeader.css';

/** Page title (`heading-1`), a one-line summary and the page's actions. */
export interface PageHeaderProps {
  title: ReactNode;
  summary?: ReactNode;
  /** Small line above the title, e.g. a back link. */
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, summary, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cx('app-page-head', className)}>
      <div className="app-page-head__text">
        {eyebrow && <div className="app-page-head__eyebrow">{eyebrow}</div>}
        <h1 className="heading-1 app-page-head__title">{title}</h1>
        {summary && <p className="body app-page-head__summary">{summary}</p>}
      </div>
      {actions && <div className="app-page-head__actions">{actions}</div>}
    </header>
  );
}
