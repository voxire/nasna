import { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { db } from '../firebase';
import type { MemberDocument, UserRole } from '../types';

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
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberDocument | null>(null);
  useIdleTimeout();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const tokenResult = await user.getIdTokenResult();
        const claimedRole = (tokenResult.claims['role'] as UserRole | undefined) ?? null;

        if (claimedRole === 'admin') {
          setRole(claimedRole);
          setMemberProfile(null);
        } else {
          const memberSnapshot = await getDoc(doc(db, 'members', user.uid));
          const profile = memberSnapshot.exists()
            ? (memberSnapshot.data() as MemberDocument)
            : null;

          setMemberProfile(profile);
          setRole(claimedRole ?? profile?.role ?? null);
        }
      } else {
        setRole(null);
        setMemberProfile(null);
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

  if (!currentUser) {
    return <Navigate to="/auth/login" />;
  }

  if (allowedRoles?.length && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireValidated && (role === 'member' || role === 'agent') && !memberProfile?.validated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 text-center">
        <h2 className="text-xl font-semibold">
          Your account is being verified. Please try again later.
        </h2>
      </div>
    );
  }

  return <>{children}</>;
}

export default PrivateRoute;
