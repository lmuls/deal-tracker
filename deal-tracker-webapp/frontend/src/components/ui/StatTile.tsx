import { cx } from './cx';
import './StatTile.css';

/** One headline number. */
export interface StatTileProps {
  /** Pre-formatted, e.g. "12,480", "18%". */
  value: string;
  label: string;
  detail?: string;
  /** "deal" for offer-related numbers only. */
  tone?: 'default' | 'deal';
  className?: string;
}

export function StatTile({ value, label, detail, tone = 'default', className }: StatTileProps) {
  return (
    <div className={cx('dt-stat', tone === 'deal' && 'dt-stat--deal', className)}>
      <span className="dt-stat__value">{value}</span>
      <span className="dt-stat__label">{label}</span>
      {detail && <span className="dt-stat__detail">{detail}</span>}
    </div>
  );
}
