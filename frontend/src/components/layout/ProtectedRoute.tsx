import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/api';
import { Loader2 } from 'lucide-react';

export interface ProtectedRouteProps {
  roles?: UserRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, role, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-spin mb-4" />
        <p className="text-body-sm text-slate-500 dark:text-slate-400">
          Loading AppointFlow session...
        </p>
      </div>
    );
  }

  // Not logged in -> redirect to login with ?next= return path
  if (!isAuthenticated || !user || !role) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // Role check: If roles are specified and user's role is not included, redirect to their role's dashboard
  if (roles && !roles.includes(role)) {
    const roleDashboardMap: Record<UserRole, string> = {
      owner: '/dashboard/owner',
      staff: '/dashboard/staff',
      customer: '/dashboard/customer',
    };
    return <Navigate to={roleDashboardMap[role] || '/'} replace />;
  }

  return <>{children}</>;
}
