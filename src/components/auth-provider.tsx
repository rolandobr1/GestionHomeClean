"use client";

import React, { createContext, ReactNode, useState, useMemo, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type AppUser = {
  uid: string;
  email: string | null;
  name: string;
  role: 'admin' | 'editor';
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser): AppUser => {
  const email = firebaseUser.email || '';
  const emailName = email.split('@')[0] || 'Usuario';
  let name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
  let role: 'admin' | 'editor' = 'editor'; // Default to editor

  // Special mapping for specific users
  if (email.toLowerCase() === 'rolando@homeclean.do') {
    name = 'Rolando';
    role = 'admin';
  } else if (email.toLowerCase() === 'mikel@homeclean.do') {
    name = 'Mikel';
    role = 'editor';
  }
  
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name,
    role,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUserToAppUser(firebaseUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth no está inicializado.");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase Auth no está inicializado.");
    await signOut(auth);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
