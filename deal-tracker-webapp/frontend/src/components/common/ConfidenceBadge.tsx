import Chip from '@mui/material/Chip';
import type { Confidence } from '../../api/generated';

interface Props {
  confidence?: Confidence;
  size?: 'small' | 'medium';
}

const config: Record<Confidence, { label: string; color: 'success' | 'warning' | 'error' }> = {
  HIGH: { label: 'HIGH', color: 'success' },
  MEDIUM: { label: 'MED', color: 'warning' },
  LOW: { label: 'LOW', color: 'error' },
};

export default function ConfidenceBadge({ confidence, size = 'small' }: Props) {
  if (!confidence) return null;
  const { label, color } = config[confidence];
  return <Chip label={label} color={color} size={size} variant="filled" />;
}
