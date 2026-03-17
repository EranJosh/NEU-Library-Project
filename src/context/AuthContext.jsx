import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);   // Firebase Auth user
  const [userProfile, setUserProfile] = useState(null);   // Firestore users doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);

      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setUserProfile(snap.exists() ? snap.data() : null);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  // Call this after onboarding completes so the profile is fresh in context
  const refreshProfile = async () => {
    if (!currentUser) return null;
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    const data = snap.exists() ? snap.data() : null;
    setUserProfile(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
