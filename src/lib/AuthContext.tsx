"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  login as apiLogin,
  registerBusiness as apiRegisterBusiness,
  getCurrentUser,
  getMe,
  getStoredWalletAddress,
  logout as apiLogout,
  isAuthenticated as checkAuth,
  type UserResponse,
  type LoginSchema,
  type BusinessSignupSchema,
  type SignupBusinessResult,
  type MeBusiness,
  type MeKybSummary,
} from "@/lib/auth";

interface AuthContextType {
  user: UserResponse | null;
  business: MeBusiness | null;
  kybSummary: MeKybSummary | null;
  role: string | null;
  loading: boolean;
  authenticated: boolean;
  // kyb_verified flag from /me. null while we haven't fetched yet.
  kybVerified: boolean | null;
  // wallet_address from the login response, persisted across reloads.
  walletAddress: string | null;
  login: (data: LoginSchema) => Promise<void>;
  register: (data: BusinessSignupSchema) => Promise<SignupBusinessResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [business, setBusiness] = useState<MeBusiness | null>(null);
  const [kybSummary, setKybSummary] = useState<MeKybSummary | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setBusiness(null);
    setKybSummary(null);
    setRole(null);
    setAuthenticated(false);
    setWalletAddress(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!checkAuth()) {
      clearSession();
      setLoading(false);
      return;
    }

    // Seed from JWT claims so dependent UI can render before /me resolves.
    const claims = getCurrentUser();
    if (claims) {
      setUser(claims);
      setAuthenticated(true);
    }
    setWalletAddress(getStoredWalletAddress());

    try {
      const me = await getMe();
      setUser({
        id: me.user.id,
        email: me.user.email,
        business_id: me.business?.id,
        role: me.role ?? undefined,
      });
      setBusiness(me.business);
      setKybSummary(me.kyb_summary);
      setRole(me.role);
      // /me does not currently return wallet_address; the canonical source is
      // the login response, persisted to localStorage. Only overwrite when
      // /me actually carries an address so we don't wipe the stored one.
      setWalletAddress(me.wallet_address ?? getStoredWalletAddress());
      setAuthenticated(true);
    } catch {
      // authedFetch already handles 401 by clearing tokens and redirecting.
      // For any other failure, fall back to JWT-claim identity if we have it;
      // otherwise sign out so the UI doesn't sit in a half-authed state.
      if (!claims) {
        apiLogout();
        clearSession();
      }
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshUser();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshUser]);

  const login = async (data: LoginSchema) => {
    const token = await apiLogin(data);
    setWalletAddress(token.wallet_address ?? null);
    await refreshUser();
  };

  const register = async (data: BusinessSignupSchema) => {
    return apiRegisterBusiness(data);
  };

  const logout = () => {
    apiLogout();
    clearSession();
  };

  const kybVerified = business ? business.kyb_verified : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        kybSummary,
        role,
        loading,
        authenticated,
        kybVerified,
        walletAddress,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
