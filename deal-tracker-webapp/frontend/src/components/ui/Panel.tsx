import type { ReactNode } from 'react';
import { cx } from './cx';
import './Panel.css';

/** A surface-raised card that groups a section of a page, with an optional heading row. */
export interface PanelProps {
  title?: string;
  /** Right side of the heading row: a badge, a count or a quiet button. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, aside, className, children }: PanelProps) {
  return (
    <section className={cx('app-panel', className)}>
      {(title || aside) && (
        <div className="app-panel__head">
          {title && <h2 className="heading-2 app-panel__title">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
