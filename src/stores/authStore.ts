import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/firebase';
import { deleteCookie } from '@/utils/cookies';
import type { MemberDocument, UserRole } from '@/types';

interface AuthResolution {
  firebaseUser: User;
  profile: MemberDocument | null;
  role: UserRole | null;
  isAdmin: boolean;
  isOnboarded: boolean;
}

interface LoginResult {
  role: UserRole | null;
  onboarded: boolean;
  isAdmin: boolean;
  destination: string;
}

interface AuthState {
  firebaseUser: User | null;
  profile: MemberDocument | null;
  role: UserRole | null;
  loading: boolean;
  profileLoading: boolean;
  initialized: boolean;
  initializeAuth: () => void;
  refreshProfile: (uid?: string) => Promise<MemberDocument | null>;
  loginWithPassword: (email: string, password: string) => Promise<LoginResult>;
  loginWithGoogle: () => Promise<LoginResult>;
  logout: () => Promise<void>;
}

let authUnsubscribe: (() => void) | null = null;
let authResolutionVersion = 0;

function resolveRole(profile: MemberDocument | null, claimedRole?: unknown): UserRole | null {
  if (claimedRole === 'admin' || claimedRole === 'member' || claimedRole === 'agent') {
    return claimedRole;
  }

  if (profile?.isAdmin) return 'admin';
  return profile?.role ?? null;
}

export function resolvePostLoginPath(role: UserRole | null, onboarded: boolean) {
  if (role === 'admin') return '/manage';
  if (!onboarded) return '/auth/onboarding';
  if (role === 'agent') return '/agent/create';
  return '/ngo/submissions';
}

async function fetchProfile(uid: string) {
  const snapshot = await getDoc(doc(db, 'members', uid));
  return snapshot.exists() ? (snapshot.data() as MemberDocument) : null;
}

async function resolveAuthUser(firebaseUser: User): Promise<AuthResolution> {
  const tokenResult = await firebaseUser.getIdTokenResult();
  const profile = await fetchProfile(firebaseUser.uid);
  const role = resolveRole(profile, tokenResult.claims['role']);
  const isAdmin = role === 'admin';
  const isOnboarded = isAdmin || profile?.onboarded === true;

  return {
    firebaseUser,
    profile,
    role,
    isAdmin,
    isOnboarded,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  profile: null,
  role: null,
  loading: true,
  profileLoading: false,
  initialized: false,

  initializeAuth: () => {
    if (authUnsubscribe) return;

    set({ loading: true });
    authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const currentVersion = ++authResolutionVersion;

      if (!firebaseUser) {
        if (currentVersion !== authResolutionVersion) return;
        set({
          firebaseUser: null,
          profile: null,
          role: null,
          loading: false,
          profileLoading: false,
          initialized: true,
        });
        return;
      }

      try {
        set({
          firebaseUser,
          loading: false,
          profileLoading: true,
          initialized: true,
        });

        const resolved = await resolveAuthUser(firebaseUser);
        if (currentVersion !== authResolutionVersion) return;

        set({
          firebaseUser: resolved.firebaseUser,
          profile: resolved.profile,
          role: resolved.role,
          loading: false,
          profileLoading: false,
          initialized: true,
        });
      } catch {
        if (currentVersion !== authResolutionVersion) return;

        set({
          firebaseUser,
          profile: null,
          role: null,
          loading: false,
          profileLoading: false,
          initialized: true,
        });
      }
    });
  },

  refreshProfile: async (uid?: string) => {
    const activeUser = get().firebaseUser;
    const targetUid = uid ?? activeUser?.uid;

    if (!targetUid) {
      set({ profile: null, role: null });
      return null;
    }

    try {
      const profile = await fetchProfile(targetUid);
      const claimedRole = activeUser
        ? (await activeUser.getIdTokenResult()).claims['role']
        : undefined;

      set({
        profile,
        role: resolveRole(profile, claimedRole),
      });

      return profile;
    } catch (error) {
      set({
        profile: null,
        role: resolveRole(null, undefined),
      });
      throw error;
    }
  },

  loginWithPassword: async (email, password) => {
    set({ loading: true });

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const resolved = await resolveAuthUser(credential.user);

      set({
        firebaseUser: resolved.firebaseUser,
        profile: resolved.profile,
        role: resolved.role,
        loading: false,
        profileLoading: false,
        initialized: true,
      });

      return {
        role: resolved.role,
        onboarded: resolved.isOnboarded,
        isAdmin: resolved.isAdmin,
        destination: resolvePostLoginPath(resolved.role, resolved.isOnboarded),
      };
    } catch (error) {
      set({ loading: false, initialized: true });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true });

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const resolved = await resolveAuthUser(result.user);

      set({
        firebaseUser: resolved.firebaseUser,
        profile: resolved.profile,
        role: resolved.role,
        loading: false,
        profileLoading: false,
        initialized: true,
      });

      return {
        role: resolved.role,
        onboarded: resolved.isOnboarded,
        isAdmin: resolved.isAdmin,
        destination: resolvePostLoginPath(resolved.role, resolved.isOnboarded),
      };
    } catch (error) {
      set({ loading: false, initialized: true });
      throw error;
    }
  },

  logout: async () => {
    deleteCookie('userRole');
    deleteCookie('nasna_session');

    await signOut(auth);
    set({
      firebaseUser: null,
      profile: null,
      role: null,
      loading: false,
      profileLoading: false,
      initialized: true,
    });
  },
}));
