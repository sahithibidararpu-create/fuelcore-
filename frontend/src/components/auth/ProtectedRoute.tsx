import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute() {
  const { isAuthenticated, accessToken } = useAuthStore();

  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
