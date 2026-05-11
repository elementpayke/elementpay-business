"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  login as apiLogin,
  registerBusiness as apiRegisterBusiness,
  getCurrentUser,
  logout as apiLogout,
  isAuthenticated as checkAuth,
  type UserResponse,
  type LoginSchema,
  type BusinessSignupSchema,
  type SignupBusinessResult,
} from "@/lib/auth";

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  authenticated: boolean;
  login: (data: LoginSchema) => Promise<void>;
  register: (data: BusinessSignupSchema) => Promise<SignupBusinessResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!checkAuth()) {
      setUser(null);
      setAuthenticated(false);
      setLoading(false);
      return;
    }
    const me = getCurrentUser();
    if (me) {
      setUser(me);
      setAuthenticated(true);
    } else {
      apiLogout();
      setUser(null);
      setAuthenticated(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshUser();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshUser]);

  const login = async (data: LoginSchema) => {
    await apiLogin(data);
    await refreshUser();
  };

  const register = async (data: BusinessSignupSchema) => {
    return apiRegisterBusiness(data);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authenticated, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
