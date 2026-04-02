import { useState, useEffect } from 'react';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
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
      PaperProps={{ sx: { width: 380, maxHeight: 480 } }}
    >
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
        <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
      </Box>
      <Divider />
      {loading ? (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">No notifications</Typography>
        </Box>
      ) : (
        <List disablePadding dense>
          {notifications.map((n) => (
            <Box key={n.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  backgroundColor: n.status !== 'READ' ? 'action.hover' : 'transparent',
                  cursor: n.status !== 'READ' ? 'pointer' : 'default',
                  py: 1.5,
                }}
                onClick={() => n.id && n.status !== 'READ' && handleMarkRead(n.id)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <ConfidenceBadge confidence={n.deal?.confidence} />
                      <Typography variant="body2" fontWeight={n.status !== 'READ' ? 600 : 400}>
                        {n.deal?.siteName ?? 'Unknown site'}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box component="span">
                      <Typography variant="caption" color="text.secondary" component="span">
                        {n.deal?.title ?? n.deal?.description ?? 'Deal detected'}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" display="block" component="span">
                        <TimeAgo dateString={n.createdAt} />
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </Box>
          ))}
        </List>
      )}
    </Popover>
  );
}
