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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <TopBar sidebarWidth={SIDEBAR_WIDTH} topBarHeight={TOPBAR_HEIGHT} />
      <Sidebar width={SIDEBAR_WIDTH} topBarHeight={TOPBAR_HEIGHT} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${SIDEBAR_WIDTH}px`,
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <AppBreadcrumbs />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
