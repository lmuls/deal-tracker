import type { ReactNode } from 'react';
import { cx } from './cx';
import './DealBadge.css';

export type DealBadgeTone = 'deal' | 'soft' | 'watching' | 'paused';

/** Pill label. `deal` and `soft` mean an offer exists; `watching` and `paused` describe a tracker. */
export interface DealBadgeProps {
  tone?: DealBadgeTone;
  /** Leading dot in the text colour. */
  dot?: boolean;
  className?: string;
  children?: ReactNode;
}

export function DealBadge({ tone = 'deal', dot, className, children }: DealBadgeProps) {
  return (
    <span className={cx('dt-badge', `dt-badge--${tone}`, className)}>
      {dot && <span className="dt-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
