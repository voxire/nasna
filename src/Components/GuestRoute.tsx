import { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { getCookie } from '../utils/cookies';

interface GuestRouteProps {
  children: ReactNode;
}

function GuestRoute({ children }: GuestRouteProps) {
  const [loading, setLoading] = useState(true);
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setRedirect(null);
        setLoading(false);
        return;
      }

      if (!getCookie('nasna_session')) {
        await signOut(auth);
        setRedirect(null);
        setLoading(false);
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        const claimedRole = tokenResult.claims['role'] as string | undefined;
        if (claimedRole === 'admin') {
          setRedirect('/manage');
          setLoading(false);
          return;
        }

        const memberDoc = await getDoc(doc(db, 'members', user.uid));
        const memberData = memberDoc.exists() ? memberDoc.data() : null;
        const role = claimedRole ?? memberData?.role;

        if (memberData?.onboarded !== true) {
          setRedirect('/auth/onboarding');
        } else if (role === 'agent') {
          setRedirect('/agent/create');
        } else {
          setRedirect('/ngo/submissions');
        }
      } catch {
        setRedirect(null);
        setLoading(false);
        return;
      }
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

  if (redirect) return <Navigate to={redirect} replace />;

  return <>{children}</>;
}

export default GuestRoute;
