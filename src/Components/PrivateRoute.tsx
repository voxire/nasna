import { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#12a89d]" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth/login" />;
  }

  return <>{children}</>;
}

export default PrivateRoute;
