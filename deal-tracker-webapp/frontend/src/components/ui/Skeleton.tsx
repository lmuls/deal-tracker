import { cx } from './cx';
import './Skeleton.css';

/** The shape being loaded: a page heading, a StatTile, a TrackerCard, a short list or a full panel. */
export type SkeletonShape = 'heading' | 'tile' | 'card' | 'list' | 'panel';

/** A placeholder block while content loads, sized like the content it stands in for. */
export function Skeleton({ shape, className }: { shape: SkeletonShape; className?: string }) {
  return <div className={cx('app-skeleton', `app-skeleton--${shape}`, className)} aria-hidden="true" />;
}
