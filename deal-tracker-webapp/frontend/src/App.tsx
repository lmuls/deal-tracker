import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Trackers from './pages/Trackers';
import TrackerDetail from './pages/TrackerDetail';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

const router = createBrowserRouter([
  { path: '/landing', element: <Landing /> },
  { path: '/login', element: <Landing mode="login" /> },
  { path: '/register', element: <Landing mode="register" /> },
  {
    path: '/',
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Trackers /> },
      { path: 'sites', element: <Navigate to="/dashboard" replace /> },
      { path: 'sites/:id', element: <TrackerDetail /> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
