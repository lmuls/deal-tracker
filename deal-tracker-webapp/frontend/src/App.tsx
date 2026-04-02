import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import SiteDetail from './pages/SiteDetail';
import Settings from './pages/Settings';
import { SiteNameCrumb } from './components/layout/AppBreadcrumbs';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#f5f5f5' },
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
  components: { MuiCard: { defaultProps: { elevation: 1 } } },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <Dashboard />,
        handle: { crumb: 'Dashboard' },
      },
      {
        path: 'sites',
        handle: { crumb: 'Sites' },
        children: [
          { index: true, element: <Sites /> },
          {
            path: ':id',
            element: <SiteDetail />,
            handle: {
              crumb: (params: Record<string, string | undefined>) =>
                params.id ? <SiteNameCrumb siteId={params.id} /> : 'Site Detail',
            },
          },
        ],
      },
      {
        path: 'settings',
        element: <Settings />,
        handle: { crumb: 'Settings' },
      },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
