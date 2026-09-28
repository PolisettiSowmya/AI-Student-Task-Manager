import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
export const defaultFirebaseConfig = {
  apiKey: "AIzaSyCqxnNdokcghF1AN0Hw90gSWXAKcSjaomw",
  authDomain: "ai-student-task-manager-e0a14.firebaseapp.com",
  projectId: "ai-student-task-manager-e0a14",
  storageBucket: "ai-student-task-manager-e0a14.firebasestorage.app",
  messagingSenderId: "1010176647515",
  appId: "1:1010176647515:web:5e25c5932c6e96a4cbfa7e"
};

// Initialize Firebase app singleton
export const app = !getApps().length ? initializeApp(defaultFirebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export type FirebaseConfig = typeof defaultFirebaseConfig;
