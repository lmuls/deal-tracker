import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AppBreadcrumbs from './AppBreadcrumbs';

const SIDEBAR_WIDTH = 220;
const TOPBAR_HEIGHT = 64;

export default function AppShell() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#07080D' }}>
      <TopBar sidebarWidth={SIDEBAR_WIDTH} topBarHeight={TOPBAR_HEIGHT} />
      <Sidebar width={SIDEBAR_WIDTH} topBarHeight={TOPBAR_HEIGHT} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${SIDEBAR_WIDTH}px`,
          minHeight: '100vh',
          backgroundColor: '#07080D',
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      >
        <Toolbar sx={{ minHeight: `${TOPBAR_HEIGHT}px !important` }} />
        <Box sx={{ p: 3.5 }}>
          <AppBreadcrumbs />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
