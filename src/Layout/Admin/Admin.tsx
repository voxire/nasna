import { useState, useEffect, ReactNode } from 'react';
import PageTransition from '../../Components/PageTransition';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import SideBar from './Sidebar';
import { auth } from '../../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

interface AdminProps {
  children: ReactNode;
}

function Admin({ children }: AdminProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        } catch (error) {
          console.error('Error retrieving user role:', error);
          navigate('/');
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const openSidebar = (source: string) => {
    console.debug('openSidebar called from', source);
    setSidebarOpen(true);
  };
  const closeSidebar = () => setSidebarOpen(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return null;
  }

  return (
    <div className="Admincontainer">
      <Navbar openSidebar={openSidebar} />
      <div className="InnerContainer"><PageTransition>{children}</PageTransition></div>
      <SideBar sidebarOpen={sidebarOpen} closeSidebar={closeSidebar} />
    </div>
  );
}

export default Admin;
