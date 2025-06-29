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


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = (name: "Rolando" | "Mikel") => {
    setUser({ name });
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
