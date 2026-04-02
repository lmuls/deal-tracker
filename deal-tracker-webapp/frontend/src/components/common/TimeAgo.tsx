import { useMemo } from 'react';
import Tooltip from '@mui/material/Tooltip';

interface Props {
  dateString?: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function TimeAgo({ dateString }: Props) {
  const relative = useMemo(() => (dateString ? formatTimeAgo(dateString) : '—'), [dateString]);
  const absolute = dateString ? new Date(dateString).toLocaleString() : '';

  return (
    <Tooltip title={absolute} placement="top">
      <span style={{ cursor: 'default', whiteSpace: 'nowrap' }}>{relative}</span>
    </Tooltip>
  );
}
