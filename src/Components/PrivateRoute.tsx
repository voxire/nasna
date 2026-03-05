import { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { getCookie } from '../utils/cookies';
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
      if (user && !getCookie('nasna_session')) {
        await signOut(auth);
        setCurrentUser(null);
        setRole(null);
        setMemberProfile(null);
      } else {
        setCurrentUser(user);

        if (user) {
          const tokenResult = await user.getIdTokenResult();
          const nextRole = (tokenResult.claims['role'] as UserRole | undefined) ?? null;
          setRole(nextRole);

          if (nextRole === 'member' || nextRole === 'agent') {
            const memberSnapshot = await getDoc(doc(db, 'members', user.uid));
            setMemberProfile(
              memberSnapshot.exists() ? (memberSnapshot.data() as MemberDocument) : null,
            );
          } else {
            setMemberProfile(null);
          }
        } else {
          setRole(null);
          setMemberProfile(null);
        }
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
