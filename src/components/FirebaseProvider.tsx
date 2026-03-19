import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, doc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface FirebaseContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAuthReady: boolean;
  logout: () => Promise<void>;
  activeFarmId: string | null;
  setActiveFarmId: (id: string | null) => void;
  memberships: any[];
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `UID: ${user.uid}, Email: ${user.email}, Verified: ${user.emailVerified}` : "No user");
      setUser(user);
      setIsAuthReady(true);
      if (!user) {
        setProfile(null);
        setActiveFarmId(null);
        setMemberships([]);
        setLoading(false);
      } else {
        setActiveFarmId(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const path = `users/${user.uid}/memberships`;
      console.log(`Starting membership listener for ${user.uid} at ${path}`);
      const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setMemberships(list);
      }, (error) => {
        console.error(`Error fetching memberships for ${user.uid} at ${path}:`, error);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeFarmId) {
      const path = `users/${activeFarmId}`;
      console.log(`Starting profile listener for ${user.uid} at ${path} (activeFarmId: ${activeFarmId})`);
      const unsubscribe = onSnapshot(doc(db, path), (doc) => {
        if (doc.exists()) {
          setProfile(doc.data());
        } else {
          console.warn(`Profile document at ${path} does not exist yet.`);
          setProfile(null);
        }
        setLoading(false);
      }, (error) => {
        console.error(`Error fetching profile for ${user.uid} at ${path}:`, error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, activeFarmId]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    
    if (isAuthReady) {
      testConnection();
    }
  }, [isAuthReady]);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, isAuthReady, logout, activeFarmId, setActiveFarmId, memberships }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
