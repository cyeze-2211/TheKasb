import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function RootRedirect() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}
