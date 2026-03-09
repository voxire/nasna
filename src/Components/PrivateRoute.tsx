import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import type { UserRole } from '../types';
import { useAuthStore } from '@/stores/authStore';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireValidated?: boolean;
  redirectTo?: string;
}

function PrivateRoute({
  children,
  allowedRoles,
  requireValidated = false,
  redirectTo = '/',
}: PrivateRouteProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  useIdleTimeout();

  const loading = useAuthStore((state) => state.loading);
  const profileLoading = useAuthStore((state) => state.profileLoading);
  const initialized = useAuthStore((state) => state.initialized);
  const currentUser = useAuthStore((state) => state.firebaseUser);
  const role = useAuthStore((state) => state.role);
  const memberProfile = useAuthStore((state) => state.profile);

  if (!initialized || loading || (currentUser && profileLoading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles?.length && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireValidated && (role === 'member' || role === 'agent') && !memberProfile?.validated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 text-center">
        <h2 className="text-xl font-semibold">{t('auth.accountUnderReview')}</h2>
      </div>
    );
  }

  if (
    role === 'member' &&
    memberProfile?.onboarded !== true &&
    pathname !== '/ngo/profile-coverage'
  ) {
    return <Navigate to="/ngo/profile-coverage" replace />;
  }

  return <>{children}</>;
}

export default PrivateRoute;
