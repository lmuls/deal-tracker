import { useState, useEffect } from 'react';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/generated';
import type { NotificationResponse } from '../../api/generated';
import TimeAgo from '../common/TimeAgo';
import ConfidenceBadge from '../common/ConfidenceBadge';

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onAllRead: () => void;
}

export default function NotificationPanel({ open, anchorEl, onClose, onAllRead }: Props) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listNotifications({ query: { page: 0, size: 10 } })
      .then(({ data }) => setNotifications(data?.content ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' as const })));
    onAllRead();
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead({ path: { id } });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'READ' as const } : n))
    );
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{ sx: { width: 360, maxHeight: 460, mt: 1 } }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E2030',
        }}
      >
        <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#E8E9F3' }}>
          Notifications
        </Typography>
        <Button
          size="small"
          onClick={handleMarkAllRead}
          sx={{ fontSize: '0.75rem', color: '#F5A623', px: 1, py: 0.4, minWidth: 'auto' }}
        >
          Mark all read
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={20} sx={{ color: '#F5A623' }} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.83rem', color: '#4A4E65' }}>
            No notifications
          </Typography>
        </Box>
      ) : (
        notifications.map((n) => (
          <Box key={n.id}>
            <Box
              onClick={() => n.id && n.status !== 'READ' && handleMarkRead(n.id)}
              sx={{
                px: 2.5,
                py: 1.75,
                backgroundColor: n.status !== 'READ' ? 'rgba(245,166,35,0.04)' : 'transparent',
                cursor: n.status !== 'READ' ? 'pointer' : 'default',
                transition: 'background 0.12s ease',
                '&:hover': n.status !== 'READ' ? { backgroundColor: 'rgba(245,166,35,0.07)' } : {},
                borderLeft: n.status !== 'READ' ? '2px solid rgba(245,166,35,0.4)' : '2px solid transparent',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 0.4 }}>
                <ConfidenceBadge confidence={n.deal?.confidence} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: n.status !== 'READ' ? 600 : 400, color: '#E8E9F3' }}>
                  {n.deal?.siteName ?? 'Unknown site'}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.78rem', color: '#8890A8', mb: 0.4, lineHeight: 1.4 }}>
                {n.deal?.title ?? n.deal?.description ?? 'Deal detected'}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#4A4E65' }}>
                <TimeAgo dateString={n.createdAt} />
              </Typography>
            </Box>
            <Divider />
          </Box>
        ))
      )}
    </Popover>
  );
}
