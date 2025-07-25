"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth-provider";

export const useAuth = () => {
  return useContext(AuthContext);
};
