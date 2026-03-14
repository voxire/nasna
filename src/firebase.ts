import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentSingleTabManager,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

const USE_EMULATOR = import.meta.env.VITE_USE_EMULATOR === 'true';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'nasna.world',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

const firestoreCache =
  import.meta.env.DEV || USE_EMULATOR
    ? memoryLocalCache()
    : persistentLocalCache({
        tabManager: persistentSingleTabManager({}),
      });

export const db = (() => {
  try {
    return initializeFirestore(app, { localCache: firestoreCache });
  } catch {
    return getFirestore(app);
  }
})();

export const storage = getStorage(app);
export const functions = getFunctions(app, USE_EMULATOR ? undefined : 'europe-west1');
export const googleProvider = new GoogleAuthProvider();
export const analytics = USE_EMULATOR ? null : getAnalytics(app);

if (USE_EMULATOR) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);
  console.info('[Nasna] 🔧 Connected to Firebase Emulators');
}
