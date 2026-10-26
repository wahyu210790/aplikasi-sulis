import { Outlet } from 'react-router';
import { useAuth } from './useAuth.js';
import { can } from '../lib/permissions.js';
import { ForbiddenPage } from '../components/layout/ForbiddenPage.jsx';

export function RequireRole({ action }) {
  const { user } = useAuth();
  if (!can(user, action)) return <ForbiddenPage />;
  return <Outlet />;
}
