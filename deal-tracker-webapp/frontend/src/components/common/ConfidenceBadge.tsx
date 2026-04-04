import Box from '@mui/material/Box';
import type { Confidence } from '../../api/generated';

interface Props {
  confidence?: Confidence;
  size?: 'small' | 'medium';
}

const config: Record<Confidence, { label: string; bg: string; color: string; border: string }> = {
  HIGH: { label: 'HIGH', bg: 'rgba(34,217,140,0.12)', color: '#22D98C', border: 'rgba(34,217,140,0.3)' },
  MEDIUM: { label: 'MED', bg: 'rgba(245,166,35,0.12)', color: '#F5A623', border: 'rgba(245,166,35,0.3)' },
  LOW: { label: 'LOW', bg: 'rgba(255,77,109,0.12)', color: '#FF4D6D', border: 'rgba(255,77,109,0.3)' },
};

export default function ConfidenceBadge({ confidence, size = 'small' }: Props) {
  if (!confidence) return null;
  const { label, bg, color, border } = config[confidence];
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
        letterSpacing: '0.07em',
        lineHeight: 1,
        fontFamily: '"DM Sans", sans-serif',
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
  );
}
