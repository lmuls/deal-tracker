import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Brand, Button, DealBadge } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { UnreadProvider, useUnread } from '../../context/UnreadContext';
import './AppShell.css';

function AppNav() {
  const { user, logout } = useAuth();
  const { unread } = useUnread();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/landing', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'app-nav__link is-active' : 'app-nav__link');

  return (
    <header className="app-nav">
      <div className="app-nav__inner">
        <Brand to="/dashboard" />
        <nav className="app-nav__links" aria-label="Main">
          <NavLink to="/dashboard" className={linkClass}>Trackers</NavLink>
          <NavLink to="/alerts" className={linkClass}>
            Alerts
            {unread > 0 && <DealBadge tone="deal">{unread > 99 ? '99+' : unread} new</DealBadge>}
          </NavLink>
          <NavLink to="/settings" className={linkClass}>Settings</NavLink>
        </nav>
        <div className="app-nav__account">
          {user && <span className="small app-nav__email">{user.email}</span>}
          <Button variant="quiet" size="sm" onClick={handleLogout}>Log out</Button>
        </div>
      </div>
    </header>
  );
}

export default function AppShell() {
  return (
    <UnreadProvider>
      <AppNav />
      <main className="app-main">
        <Outlet />
      </main>
    </UnreadProvider>
  );
}
