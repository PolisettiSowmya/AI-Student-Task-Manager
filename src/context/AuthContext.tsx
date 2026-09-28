import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';

export interface AuthActivityItem {
  id: string;
  type: 'LOGIN' | 'REGISTER' | 'VERIFICATION_SENT' | 'PASSWORD_RESET' | 'PROFILE_UPDATE' | 'LOGOUT';
  title: string;
  timestamp: Date;
  details?: string;
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  photoURL?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  isEmailVerified: boolean;
  activities: AuthActivityItem[];
  refreshUser: () => Promise<void>;
  sendVerificationEmail: () => Promise<{ success: boolean; error?: any }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: any }>;
  updateDisplayName: (name: string) => Promise<{ success: boolean; error?: any }>;
  signOutUser: () => Promise<void>;
  logActivity: (type: AuthActivityItem['type'], title: string, details?: string) => void;
  clearActivities: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<AuthActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem('auth_activities_log');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch {
      // ignore
    }
    return [];
  });

  const logActivity = (type: AuthActivityItem['type'], title: string, details?: string) => {
    const newItem: AuthActivityItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      timestamp: new Date(),
      details,
    };
    setActivities((prev) => {
      const updated = [newItem, ...prev].slice(0, 50);
      try {
        localStorage.setItem('auth_activities_log', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearActivities = () => {
    setActivities([]);
    try {
      localStorage.removeItem('auth_activities_log');
    } catch {
      // ignore
    }
  };

  // Sync user profile with Firestore if accessible
  const syncProfile = async (currentUser: User) => {
    const defaultData: UserProfileData = {
      uid: currentUser.uid,
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
      email: currentUser.email || '',
      emailVerified: currentUser.emailVerified,
      photoURL: currentUser.photoURL || undefined,
      createdAt: currentUser.metadata.creationTime,
      lastLoginAt: currentUser.metadata.lastSignInTime,
    };

    setProfile(defaultData);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile({
          uid: currentUser.uid,
          displayName: data.displayName || defaultData.displayName,
          email: data.email || defaultData.email,
          emailVerified: currentUser.emailVerified,
          photoURL: data.photoURL || defaultData.photoURL,
          createdAt: data.createdAt || defaultData.createdAt,
          lastLoginAt: defaultData.lastLoginAt,
        });
      } else {
        // Save initial profile
        await setDoc(userRef, {
          uid: currentUser.uid,
          displayName: defaultData.displayName,
          email: defaultData.email,
          emailVerified: currentUser.emailVerified,
          photoURL: defaultData.photoURL || '',
          createdAt: defaultData.createdAt || new Date().toISOString(),
          lastLoginAt: defaultData.lastLoginAt || new Date().toISOString(),
        });
      }
    } catch (err) {
      // If Firestore rules or offline prevents writing, keep Auth local profile intact
      console.warn('Firestore profile sync note:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const reloaded = auth.currentUser;
      setUser({ ...reloaded } as User);
      await syncProfile(reloaded);
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) return { success: false, error: new Error('No authenticated user') };
    try {
      await sendEmailVerification(auth.currentUser);
      logActivity(
        'VERIFICATION_SENT',
        'Email Verification Dispatched',
        `Sent verification link to ${auth.currentUser.email}`
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      logActivity('PASSWORD_RESET', 'Password Reset Requested', `Sent reset instructions to ${email}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!auth.currentUser) return { success: false, error: new Error('No authenticated user') };
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await setDoc(userRef, { displayName: name }, { merge: true });
      } catch {
        // safe fallback
      }
      await refreshUser();
      logActivity('PROFILE_UPDATE', 'Profile Display Name Updated', `Changed name to "${name}"`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  };

  const signOutUser = async () => {
    const email = user?.email;
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    logActivity('LOGOUT', 'Signed Out', email ? `User: ${email}` : undefined);
  };

  const isEmailVerified = Boolean(user && user.emailVerified);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isEmailVerified,
        activities,
        refreshUser,
        sendVerificationEmail,
        sendPasswordReset,
        updateDisplayName,
        signOutUser,
        logActivity,
        clearActivities,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
