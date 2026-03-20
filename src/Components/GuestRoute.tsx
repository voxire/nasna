import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { resolvePostLoginPath, useAuthStore } from '@/stores/authStore';

interface GuestRouteProps {
  children: ReactNode;
}

function GuestRoute({ children }: GuestRouteProps) {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);

  if (!initialized || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  if (firebaseUser) {
    return (
      <Navigate
        to={resolvePostLoginPath(
          role,
          role === 'admin' || role === 'super_admin' || profile?.onboarded === true,
        )}
        replace
      />
    );
  }

  return <>{children}</>;
}

export default GuestRoute;
