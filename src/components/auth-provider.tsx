"use client";

import React, { createContext, ReactNode, useState, useMemo, useEffect } from "react";

export type AppUser = {
  name: "Rolando" | "Mikel";
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (name: "Rolando" | "Mikel") => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

const SESSION_STORAGE_KEY = 'homeclean_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
        setLoading(false);
    }
  }, []);

  const login = (name: "Rolando" | "Mikel") => {
    const newUser = { name };
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
    } catch (error) {
        console.error("Failed to save user to session storage", error);
        setUser(newUser);
    }
  };

  const logout = () => {
    try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to remove user from session storage", error);
    } finally {
        setUser(null);
    }
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
