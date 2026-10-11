import type { ReactNode } from 'react';
import { cx } from './cx';
import './Notice.css';

/** A one-line message inside a form or page: what went wrong and how to fix it, or a confirmation. */
export interface NoticeProps {
  tone?: 'error' | 'info';
  children: ReactNode;
  className?: string;
}

export function Notice({ tone = 'info', children, className }: NoticeProps) {
  return (
    <p className={cx('app-notice', 'small', `app-notice--${tone}`, className)} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
