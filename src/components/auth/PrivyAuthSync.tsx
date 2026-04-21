"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSubscribeToJwtAuthWithFlag } from "@privy-io/react-auth";
import { useAuth } from "@/lib/AuthContext";
import { getPrivyToken } from "@/lib/auth";

const MAX_CONSECUTIVE_FAILURES = 3;
const EXPIRY_MARGIN_S = 60;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp > Math.floor(Date.now() / 1000) + EXPIRY_MARGIN_S;
}

// Bridges our backend session to Privy. When `useAuth().authenticated` flips
// true, Privy calls `getExternalJwt`, which exchanges the user's HS256 session
// for an RS256 JWT via /auth/privy/token. Privy verifies the RS256 token via
// JWKS and the user is logged in silently — no Privy modal.
export default function PrivyAuthSync() {
  const { authenticated, loading } = useAuth();

  const tokenCacheRef = useRef<string | null>(null);
  const failureCountRef = useRef<number>(0);

  useEffect(() => {
    if (!authenticated) {
      tokenCacheRef.current = null;
      failureCountRef.current = 0;
    }
  }, [authenticated]);

  const getExternalJwt = useCallback(async (): Promise<string | undefined> => {
    if (!authenticated) return undefined;

    if (tokenCacheRef.current && isTokenValid(tokenCacheRef.current)) {
      return tokenCacheRef.current;
    }

    if (failureCountRef.current >= MAX_CONSECUTIVE_FAILURES) {
      console.warn(
        `[PrivyAuthSync] circuit open — ${failureCountRef.current} consecutive failures, giving up`,
      );
      return undefined;
    }

    try {
      const { token } = await getPrivyToken();
      failureCountRef.current = 0;
      tokenCacheRef.current = token;
      return token;
    } catch (err) {
      failureCountRef.current++;
      console.error(
        `[PrivyAuthSync] /auth/privy/token failed (${failureCountRef.current}/${MAX_CONSECUTIVE_FAILURES})`,
        err,
      );
      return undefined;
    }
  }, [authenticated]);

  useSubscribeToJwtAuthWithFlag({
    isAuthenticated: authenticated,
    isLoading: loading,
    getExternalJwt,
    onAuthenticated: ({ user, isNewUser }) => {
      console.log("[PrivyAuthSync] Privy authenticated via custom JWT", {
        userId: user.id,
        isNewUser,
        linkedAccounts: user.linkedAccounts?.length ?? 0,
      });
    },
    onUnauthenticated: () => {
      tokenCacheRef.current = null;
    },
    onError: (error) => {
      console.error("[PrivyAuthSync] Privy JWT sync error:", error);
      tokenCacheRef.current = null;
    },
  });

  return null;
}
