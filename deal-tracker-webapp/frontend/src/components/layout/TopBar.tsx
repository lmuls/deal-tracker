import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';

interface Props {
  sidebarWidth: number;
  topBarHeight: number;
}

export default function TopBar({ sidebarWidth }: Props) {
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, width: '100%' }}
    >
      <Toolbar sx={{ pl: `${sidebarWidth}px` }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700, letterSpacing: 0.5, flexGrow: 1 }}>
          Deal Tracker
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <NotificationBell />
          <IconButton color="inherit" onClick={() => navigate('/settings')} size="large">
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
