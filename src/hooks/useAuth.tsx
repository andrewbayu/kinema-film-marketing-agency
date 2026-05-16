import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

import { SUPER_ADMIN_EMAIL } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthorized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Check if Admin
        if (user.email === SUPER_ADMIN_EMAIL) {
          setIsAdmin(true);
          setIsAuthorized(true);
        } else {
          try {
            // Check admins collection
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists()) {
              setIsAdmin(true);
              setIsAuthorized(true);
            } else {
              // Check team collection (email-based admin)
              const teamDoc = await getDoc(doc(db, 'team', user.email!));
              if (teamDoc.exists()) {
                setIsAdmin(true);
                setIsAuthorized(true);
              } else {
                setIsAdmin(false);
                // Check clients collection
                const clientsRef = collection(db, 'clients');
                const q = query(clientsRef, where('email', '==', user.email));
                const querySnapshot = await getDocs(q);
                setIsAuthorized(!querySnapshot.empty);
              }
            }
          } catch (error) {
            console.error("Auth status check failed", error);
            setIsAdmin(false);
            setIsAuthorized(false);
          }
        }
      } else {
        setIsAdmin(false);
        setIsAuthorized(false);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("This domain is not authorized for Firebase Authentication. Please add it to the 'Authorized domains' list in the Firebase Console.");
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const logout = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isAuthorized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
