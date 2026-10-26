import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './useAuth.js';
import { FullPageSpinner } from '../components/layout/FullPageSpinner.jsx';

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status !== 'authenticated') {
    return <Navigate to="/masuk" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
