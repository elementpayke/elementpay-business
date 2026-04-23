"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
  logout as apiLogout,
  isAuthenticated as checkAuth,
  type UserResponse,
  type LoginSchema,
  type UserCreate,
} from "@/lib/auth";

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  authenticated: boolean;
  login: (data: LoginSchema) => Promise<void>;
  register: (data: UserCreate) => Promise<UserResponse>;
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
    try {
      const me = await getMe();
      setUser(me);
      setAuthenticated(true);
    } catch {
      apiLogout();
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
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

  const register = async (data: UserCreate) => {
    return apiRegister(data);
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
