import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { usePolling } from '../../hooks/usePolling';
import { getUnreadCount } from '../../api/generated';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  usePolling(async () => {
    const { data } = await getUnreadCount();
    setUnread(data?.count ?? 0);
  }, 30_000);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} size="large">
        <Badge badgeContent={unread} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <NotificationPanel
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        onAllRead={() => setUnread(0)}
      />
    </>
  );
}
