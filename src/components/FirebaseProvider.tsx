import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface FirebaseContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  isAuthReady: boolean;
  logout: () => Promise<void>;
  activeFarmId: string | null;
  setActiveFarmId: (id: string | null) => void;
  memberships: any[];
  loginAsDemo: (phoneNumber?: string, customUid?: string) => void;
  updateProfileLocal: (data: any) => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [isSimulated, setIsSimulated] = useState<boolean>(() => {
    return localStorage.getItem('agri_is_simulated') === 'true';
  });

  const simulatedUser = isSimulated ? {
    uid: localStorage.getItem('agri_simulated_uid') || 'demo_user_123',
    email: localStorage.getItem('agri_simulated_email') || 'demo@bharatkisan.com',
    displayName: 'Demo Farmer',
    phoneNumber: localStorage.getItem('agri_farmer_phone') || '9999999999'
  } : null;

  const loginAsDemo = (phoneNumber?: string, customUid?: string) => {
    const phone = phoneNumber || '9999999999';
    const mockUid = customUid || ('demo_' + phone);
    localStorage.setItem('agri_is_simulated', 'true');
    localStorage.setItem('agri_simulated_uid', mockUid);
    localStorage.setItem('agri_simulated_email', customUid ? (localStorage.getItem('agri_simulated_email') || `${phone}@bharatkisan.com`) : `${phone}@bharatkisan.com`);
    localStorage.setItem('agri_farmer_phone', phone);
    setIsSimulated(true);
    setActiveFarmId(mockUid);
    
    // Check if we have local profile for this user and load it
    const localName = localStorage.getItem('agri_farmer_name');
    if (localName) {
      setProfile({
        name: localName,
        farmName: localStorage.getItem('agri_farm_name') || '',
        phone: phone,
        language: localStorage.getItem('agri_language') || 'English',
        state: localStorage.getItem('agri_state') || '',
        district: localStorage.getItem('agri_district') || '',
        mandal: localStorage.getItem('agri_mandal') || '',
        revenueVillage: localStorage.getItem('agri_revenue_village') || '',
        soilType: localStorage.getItem('agri_soil_type') || 'Loamy',
        units: localStorage.getItem('agri_units') || 'Metric',
        onboardingComplete: true
      });
    }

    if (!auth.currentUser) {
      signInAnonymously(auth).catch(err => {
        console.warn("Failed anonymous sign-in inside loginAsDemo:", err);
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? `UID: ${firebaseUser.uid}, Email: ${firebaseUser.email}, Verified: ${firebaseUser.emailVerified}` : "No user");
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (!firebaseUser && !isSimulated) {
        setProfile(null);
        setActiveFarmId(null);
        setMemberships([]);
        setLoading(false);
      } else if (firebaseUser) {
        if (firebaseUser.isAnonymous || localStorage.getItem('agri_is_simulated') === 'true') {
          setIsSimulated(true);
          if (simulatedUser) {
            setActiveFarmId(simulatedUser.uid);
          }
        } else {
          setIsSimulated(false); // real user takes precedence
          setActiveFarmId(firebaseUser.uid);
        }
      } else if (isSimulated && simulatedUser) {
        setActiveFarmId(simulatedUser.uid);
      }
    });

    return () => unsubscribe();
  }, [isSimulated]);

  // Ensure anonymous sign-in is active for simulated mode
  useEffect(() => {
    if (isSimulated && !auth.currentUser && isAuthReady) {
      signInAnonymously(auth).catch(err => {
        console.warn("Auto anonymous sign-in failed for simulation:", err);
      });
    }
  }, [isSimulated, isAuthReady]);

  // Sync activeFarmId when simulated mode changes
  useEffect(() => {
    if (isSimulated && simulatedUser) {
      setActiveFarmId(simulatedUser.uid);
      
      // Auto populate/load local profile if available
      const localName = localStorage.getItem('agri_farmer_name');
      if (localName) {
        setProfile({
          name: localName,
          farmName: localStorage.getItem('agri_farm_name') || '',
          phone: simulatedUser.phoneNumber,
          language: localStorage.getItem('agri_language') || 'English',
          state: localStorage.getItem('agri_state') || '',
          district: localStorage.getItem('agri_district') || '',
          mandal: localStorage.getItem('agri_mandal') || '',
          revenueVillage: localStorage.getItem('agri_revenue_village') || '',
          soilType: localStorage.getItem('agri_soil_type') || 'Loamy',
          units: localStorage.getItem('agri_units') || 'Metric',
          onboardingComplete: true
        });
      }
      setLoading(false);
    }
  }, [isSimulated]);

  useEffect(() => {
    const currentUser = user || simulatedUser;
    if (currentUser && !isSimulated) {
      const path = `users/${currentUser.uid}/memberships`;
      console.log(`Starting membership listener for ${currentUser.uid} at ${path}`);
      const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setMemberships(list);
      }, (error) => {
        console.error(`Error fetching memberships for ${currentUser.uid} at ${path}:`, error);
      });
      return () => unsubscribe();
    }
  }, [user, isSimulated]);

  useEffect(() => {
    const currentUser = user || simulatedUser;
    if (currentUser && activeFarmId) {
      if (isSimulated) {
        // In simulated mode, load from localStorage
        const localName = localStorage.getItem('agri_farmer_name');
        if (localName) {
          setProfile({
            name: localName,
            farmName: localStorage.getItem('agri_farm_name') || '',
            phone: currentUser.phoneNumber,
            language: localStorage.getItem('agri_language') || 'English',
            state: localStorage.getItem('agri_state') || '',
            district: localStorage.getItem('agri_district') || '',
            mandal: localStorage.getItem('agri_mandal') || '',
            revenueVillage: localStorage.getItem('agri_revenue_village') || '',
            soilType: localStorage.getItem('agri_soil_type') || 'Loamy',
            units: localStorage.getItem('agri_units') || 'Metric',
            onboardingComplete: true
          });
        }
        setLoading(false);
        return;
      }

      const path = `users/${activeFarmId}`;
      console.log(`Starting profile listener for ${currentUser.uid} at ${path} (activeFarmId: ${activeFarmId})`);
      const unsubscribe = onSnapshot(doc(db, path), (doc) => {
        if (doc.exists()) {
          setProfile(doc.data());
        } else {
          console.warn(`Profile document at ${path} does not exist yet. Checking localStorage fallback.`);
          const localName = localStorage.getItem('agri_farmer_name');
          if (localName) {
            setProfile({
              name: localName,
              farmName: localStorage.getItem('agri_farm_name') || '',
              phone: localStorage.getItem('agri_farmer_phone') || '',
              language: localStorage.getItem('agri_language') || 'English',
              state: localStorage.getItem('agri_state') || '',
              district: localStorage.getItem('agri_district') || '',
              mandal: localStorage.getItem('agri_mandal') || '',
              revenueVillage: localStorage.getItem('agri_revenue_village') || '',
              soilType: localStorage.getItem('agri_soil_type') || 'Loamy',
              units: localStorage.getItem('agri_units') || 'Metric',
              onboardingComplete: true
            });
          } else {
            setProfile(null);
          }
        }
        setLoading(false);
      }, (error) => {
        console.error(`Error fetching profile for ${currentUser.uid} at ${path}, using localStorage fallback:`, error);
        const localName = localStorage.getItem('agri_farmer_name');
        if (localName) {
          setProfile({
            name: localName,
            farmName: localStorage.getItem('agri_farm_name') || '',
            phone: localStorage.getItem('agri_farmer_phone') || '',
            language: localStorage.getItem('agri_language') || 'English',
            state: localStorage.getItem('agri_state') || '',
            district: localStorage.getItem('agri_district') || '',
            mandal: localStorage.getItem('agri_mandal') || '',
            revenueVillage: localStorage.getItem('agri_revenue_village') || '',
            soilType: localStorage.getItem('agri_soil_type') || 'Loamy',
            units: localStorage.getItem('agri_units') || 'Metric',
            onboardingComplete: true
          });
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, activeFarmId, isSimulated]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        // Log connection warnings gracefully
        console.warn("Firestore connection check info: the client is currently operating in offline/cached mode.", error.message || error);
      }
    };
    
    if (isAuthReady) {
      testConnection();
    }
  }, [isAuthReady]);

  const logout = async () => {
    localStorage.removeItem('agri_is_simulated');
    localStorage.removeItem('agri_simulated_uid');
    localStorage.removeItem('agri_simulated_email');
    localStorage.setItem('agri_session_active', 'false');
    setIsSimulated(false);
    setUser(null);
    setProfile(null);
    setActiveFarmId(null);
    setMemberships([]);
    await signOut(auth).catch(err => console.warn("Firebase signout error:", err));
  };

  const updateProfileLocal = (data: any) => {
    setProfile((prev: any) => ({ ...(prev || {}), ...data }));
  };

  const finalUser = isSimulated && simulatedUser ? simulatedUser : (user || simulatedUser);

  const contextValue: FirebaseContextType = {
    user: finalUser,
    profile,
    loading,
    isAuthReady,
    logout,
    activeFarmId,
    setActiveFarmId,
    memberships,
    loginAsDemo,
    updateProfileLocal
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
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
