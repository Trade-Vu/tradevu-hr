import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

/**
 * ProtectedRoute — wraps authenticated pages.
 * Uses the actual AuthContext API: isAuthenticated, isLoadingAuth, authError.
 */
export default function ProtectedRoute({ fallback = <DefaultFallback />, requiredRoles }) {
  const { isAuthenticated, isLoadingAuth, authError, user } = useAuth();

  if (isLoadingAuth) {
    return fallback;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based guard: if requiredRoles is provided, check user's role
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
