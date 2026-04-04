import Box from '@mui/material/Box';
import type { DealType } from '../../api/generated';

interface Props {
  type?: DealType;
  size?: 'small' | 'medium';
}

const config: Record<DealType, { label: string; bg: string; color: string; border: string }> = {
  PERCENTAGE_OFF: { label: '% Off', bg: 'rgba(91,143,249,0.12)', color: '#5B8FF9', border: 'rgba(91,143,249,0.3)' },
  COUPON:         { label: 'Coupon', bg: 'rgba(180,100,240,0.12)', color: '#B464F0', border: 'rgba(180,100,240,0.3)' },
  SALE_EVENT:     { label: 'Sale', bg: 'rgba(245,166,35,0.12)', color: '#F5A623', border: 'rgba(245,166,35,0.3)' },
  FREE_SHIPPING:  { label: 'Free Ship', bg: 'rgba(34,217,140,0.1)', color: '#22D98C', border: 'rgba(34,217,140,0.25)' },
  BOGO:           { label: 'BOGO', bg: 'rgba(255,77,109,0.1)', color: '#FF4D6D', border: 'rgba(255,77,109,0.25)' },
  OTHER:          { label: 'Other', bg: 'rgba(136,144,168,0.1)', color: '#8890A8', border: 'rgba(136,144,168,0.2)' },
};

export default function DealTypeBadge({ type, size = 'small' }: Props) {
  if (!type) return null;
  const { label, bg, color, border } = config[type];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: size === 'small' ? '6px' : '10px',
        py: size === 'small' ? '2px' : '4px',
        borderRadius: '5px',
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        fontSize: size === 'small' ? '0.62rem' : '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        lineHeight: 1,
        fontFamily: '"DM Sans", sans-serif',
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
  );
}
