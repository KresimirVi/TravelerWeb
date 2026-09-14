import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import { syncUser } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  const skipAutoSync = useRef(false);

  useEffect(() => {
    // firebase javi svaki put kad se neko uloguje/izloguje
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (skipAutoSync.current) return;
      if (firebaseUser) {
        try {
          const dbUser = await syncUser({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || undefined,
          });
          setUser({ ...dbUser, firebaseUid: firebaseUser.uid });
        } catch (err) {
          console.error("Sinhronizacija korisnika nije uspjela:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const register = async ({ firstName, lastName, email, password }) => {
    skipAutoSync.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const fullName = `${firstName} ${lastName}`.trim();
      await updateProfile(cred.user, { displayName: fullName });
      const dbUser = await syncUser({ firebaseUid: cred.user.uid, email, fullName });
      setUser({ ...dbUser, firebaseUid: cred.user.uid });
      setAuthModalOpen(false);
    } finally {
      skipAutoSync.current = false;
    }
  };

  const login = async ({ email, password }) => {
    skipAutoSync.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const dbUser = await syncUser({
        firebaseUid: cred.user.uid,
        email: cred.user.email,
        fullName: cred.user.displayName || undefined,
      });
      setUser({ ...dbUser, firebaseUid: cred.user.uid });
      setAuthModalOpen(false);
    } finally {
      skipAutoSync.current = false;
    }
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  const openListModal = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setEditingProperty(null);
    setListModalOpen(true);
  };
  const openEditModal = (property) => {
    setEditingProperty(property);
    setListModalOpen(true);
  };
  const closeListModal = () => {
    setListModalOpen(false);
    setEditingProperty(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        register,
        login,
        logout,
        resetPassword,
        authModalOpen,
        openAuthModal,
        closeAuthModal,
        listModalOpen,
        openListModal,
        closeListModal,
        editingProperty,
        openEditModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth mora biti korišten unutar AuthProvider-a");
  return ctx;
}
