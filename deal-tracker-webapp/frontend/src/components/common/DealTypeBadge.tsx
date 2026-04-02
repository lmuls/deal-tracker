import Chip from '@mui/material/Chip';
import type { DealType } from '../../api/generated';

interface Props {
  type?: DealType;
  size?: 'small' | 'medium';
}

const labels: Record<DealType, string> = {
  PERCENTAGE_OFF: '% Off',
  COUPON: 'Coupon',
  SALE_EVENT: 'Sale',
  FREE_SHIPPING: 'Free Shipping',
  BOGO: 'BOGO',
  OTHER: 'Other',
};

const colors: Record<DealType, string> = {
  PERCENTAGE_OFF: '#1565c0',
  COUPON: '#6a1b9a',
  SALE_EVENT: '#e65100',
  FREE_SHIPPING: '#00695c',
  BOGO: '#0277bd',
  OTHER: '#546e7a',
};

export default function DealTypeBadge({ type, size = 'small' }: Props) {
  if (!type) return null;
  return (
    <Chip
      label={labels[type]}
      size={size}
      sx={{ backgroundColor: colors[type], color: '#fff', fontWeight: 500 }}
    />
  );
}
