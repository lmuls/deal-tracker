import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, alpha } from '@mui/material';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import SiteDetail from './pages/SiteDetail';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import { SiteNameCrumb } from './components/layout/AppBreadcrumbs';

const AMBER = '#F5A623';
const GREEN = '#22D98C';
const BG_BASE = '#07080D';
const BG_SIDEBAR = '#09090F';
const BG_SURFACE = '#0F1016';
const BORDER = '#1E2030';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: AMBER, contrastText: '#07080D' },
    secondary: { main: GREEN, contrastText: '#07080D' },
    success: { main: GREEN, contrastText: '#07080D' },
    error: { main: '#FF4D6D' },
    warning: { main: '#FFB020' },
    background: { default: BG_BASE, paper: BG_SURFACE },
    text: { primary: '#E8E9F3', secondary: '#8890A8', disabled: '#4A4E65' },
    divider: BORDER,
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontFamily: '"Syne", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Syne", sans-serif', fontWeight: 800 },
    h3: { fontFamily: '"Syne", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Syne", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Syne", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600 },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.82rem' },
    caption: { fontSize: '0.75rem' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' } as never,
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: BG_SURFACE,
          border: `1px solid ${BORDER}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: BG_SIDEBAR,
          borderRight: `1px solid ${BORDER}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: BG_SIDEBAR,
          borderBottom: `1px solid ${BORDER}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.01em',
          borderRadius: 8,
        },
        containedPrimary: {
          color: '#07080D',
          '&:hover': { backgroundColor: '#e09620' },
        },
        outlinedPrimary: {
          borderColor: alpha(AMBER, 0.4),
          '&:hover': { borderColor: AMBER, backgroundColor: alpha(AMBER, 0.06) },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          color: '#8890A8',
          '&:hover': { backgroundColor: alpha('#E8E9F3', 0.05), color: '#E8E9F3' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.68rem',
          letterSpacing: '0.04em',
          fontFamily: '"DM Sans", sans-serif',
          borderRadius: 6,
        },
        colorSuccess: {
          backgroundColor: alpha(GREEN, 0.15),
          color: GREEN,
          border: `1px solid ${alpha(GREEN, 0.3)}`,
        },
        colorWarning: {
          backgroundColor: alpha('#FFB020', 0.12),
          color: '#FFB020',
          border: `1px solid ${alpha('#FFB020', 0.3)}`,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: BG_SIDEBAR,
            color: '#4A4E65',
            fontWeight: 600,
            fontSize: '0.68rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderBottom: `1px solid ${BORDER}`,
            padding: '10px 16px',
            fontFamily: '"DM Sans", sans-serif',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${BORDER}`,
          fontSize: '0.85rem',
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover td': { backgroundColor: '#12131A' } },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: BG_SURFACE,
          border: `1px solid ${BORDER}`,
          backgroundImage: 'none',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Syne", sans-serif',
          fontWeight: 700,
          fontSize: '1.1rem',
          padding: '20px 24px 12px',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: BG_SURFACE,
          border: `1px solid ${BORDER}`,
          backgroundImage: 'none',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.88rem',
          '&:hover': { backgroundColor: '#13141D' },
          '&.Mui-selected': {
            backgroundColor: alpha(AMBER, 0.12),
            '&:hover': { backgroundColor: alpha(AMBER, 0.16) },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: BORDER } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: '0.9rem',
          backgroundColor: alpha('#fff', 0.02),
          '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2E3145' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: AMBER, borderWidth: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.9rem',
          color: '#8890A8',
          '&.Mui-focused': { color: AMBER },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: AMBER,
            '& + .MuiSwitch-track': { backgroundColor: AMBER, opacity: 0.6 },
          },
        },
        track: { backgroundColor: '#2A2D45', opacity: 1 },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontSize: '0.6rem', fontWeight: 700, minWidth: 16, height: 16, padding: '0 4px' },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { fontSize: '0.85rem', borderRadius: 8 } },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: '#1A1C28' },
        wave: {
          '&::after': {
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: { label: { fontSize: '0.9rem' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1E2030',
          border: `1px solid ${BORDER}`,
          fontSize: '0.73rem',
          borderRadius: 6,
          color: '#E8E9F3',
        },
        arrow: { color: '#1E2030' },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { color: '#8890A8', fontSize: '0.82rem', borderTop: `1px solid ${BORDER}` },
        select: { fontSize: '0.82rem' },
        displayedRows: { color: '#8890A8' },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        separator: { color: '#4A4E65' },
      },
    },
  },
});

const router = createBrowserRouter([
  { path: '/landing', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/',
    element: <RequireAuth><AppShell /></RequireAuth>,
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
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
