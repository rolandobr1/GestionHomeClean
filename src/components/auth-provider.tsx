"use client";

import React, { createContext, ReactNode } from "react";
import type { User } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false, // Default to not loading
});

// A mock user to simulate being logged in
const mockUser = {
  uid: "mock-user-123",
  email: "test@quimiogest.app",
  displayName: "Usuario de Prueba",
  photoURL: null,
} as User;


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // We bypass the actual Firebase auth and provide a mock user.
  // This makes the app think we are always logged in.
  return (
    <AuthContext.Provider value={{ user: mockUser, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};
