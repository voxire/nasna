import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
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
  useIdleTimeout();

  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const currentUser = useAuthStore((state) => state.firebaseUser);
  const role = useAuthStore((state) => state.role);
  const memberProfile = useAuthStore((state) => state.profile);

  if (!initialized || loading) {
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

  return <>{children}</>;
}

export default PrivateRoute;
