import { Link } from 'react-router-dom';
import { cx } from './cx';
import './Brand.css';

/**
 * The wordmark, optionally with its gradient-horizon placeholder tile. The tile counts as the screen's one
 * gradient-horizon, so leave it off (`mark={false}`) on screens that use the gradient elsewhere.
 */
export function Brand({ to = '/', mark = true, className }: { to?: string; mark?: boolean; className?: string }) {
  return (
    <Link className={cx('app-brand', className)} to={to}>
      {mark && <span className="app-brand__tile" aria-hidden="true" />}
      Deal Tracker
    </Link>
  );
}
