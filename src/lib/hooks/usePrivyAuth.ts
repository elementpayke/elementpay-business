"use client";

import { usePrivy as usePrivyOriginal } from "@privy-io/react-auth";

type PrivyFallback = {
  login: () => void;
  logout: () => void;
  authenticated: boolean;
  user: null;
  ready: boolean;
};

export function usePrivyAuth(): ReturnType<typeof usePrivyOriginal> | PrivyFallback {
  try {
    return usePrivyOriginal();
  } catch {
    return {
      login: () => {
        console.warn("Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID in .env.local");
      },
      logout: () => {},
      authenticated: false,
      user: null,
      ready: false,
    };
  }
}
