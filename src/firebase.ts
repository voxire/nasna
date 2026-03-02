import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCS6vvEiEiZ-GYHY42QQ-QXJjdWLJ9Q4HE',
  authDomain: 'btrajek-se3dni.firebaseapp.com',
  projectId: 'btrajek-se3dni',
  storageBucket: 'btrajek-se3dni.appspot.com',
  messagingSenderId: '261651232882',
  appId: '1:261651232882:web:d99c881d03ed13f327eaeb',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
