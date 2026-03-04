import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/Components/ui/sidebar';
import { Separator } from '@/Components/ui/separator';
import AppSidebar from './Sidebar';
import PageTransition from '../../Components/PageTransition';
import AdminBreadcrumb from './Navbar';
import { cn } from '@/lib/utils';

// Separate component so it can use useSidebar() inside SidebarProvider
function AdminContent({ children }: { children: ReactNode }) {
  const { state } = useSidebar();
  return (
    <div
      className={cn(
        'flex flex-col min-h-screen transition-[margin-left] duration-200 ease-linear',
        state === 'expanded' ? 'ml-64' : 'ml-12'
      )}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <AdminBreadcrumb />
      </header>
      <main className="flex-1 p-6 bg-gray-50">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}

interface AdminProps {
  children: ReactNode;
}

function Admin({ children }: AdminProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const userRole = tokenResult.claims['role'] as string;
          if (userRole !== 'admin') {
            navigate('/');
          } else {
            setUser(firebaseUser);
            setRole(userRole);
          }
        } catch {
          navigate('/');
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  if (!user || role !== 'admin') return null;

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <AdminContent>{children}</AdminContent>
    </SidebarProvider>
  );
}

export default Admin;
