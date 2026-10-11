import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="dt-sr" role="status">Loading</p>;
  if (!user) return <Navigate to="/landing" replace />;
  return <>{children}</>;
}
