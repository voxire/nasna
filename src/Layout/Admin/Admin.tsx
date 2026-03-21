import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar';
import AppSidebar from './Sidebar';
import PageTransition from '../../Components/PageTransition';
import AdminBreadcrumb from './Navbar';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface AdminProps {
  children: ReactNode;
  fullBleed?: boolean;
  allowedRoles?: UserRole[];
}

function Admin({
  children,
  fullBleed = false,
  allowedRoles = ['admin', 'super_admin'],
}: AdminProps) {
  const location = useLocation();
  const loading = useAuthStore((state) => state.loading);
  const profileLoading = useAuthStore((state) => state.profileLoading);
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.firebaseUser);
  const role = useAuthStore((state) => state.role);

  if (!initialized || loading || (user && profileLoading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    if (location.pathname.startsWith('/super')) {
      return <Navigate to="/manage" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <AppSidebar user={user} />
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
          <SidebarTrigger className="md:hidden" />
          <AdminBreadcrumb />
        </header>
        <main className={fullBleed ? 'flex-1 bg-gray-50' : 'flex-1 p-6 bg-gray-50'}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default Admin;
