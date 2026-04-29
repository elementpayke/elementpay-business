"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  EMPTY_ONBOARDING_STATE,
  isBasicInfoComplete,
  isBusinessDetailsComplete,
  isTier1Complete,
  isTier1PendingPhone,
  type BasicInfoProfile,
  type BusinessDetails,
  type OnboardingState,
} from "@/lib/onboarding/types";

const STORAGE_PREFIX = "onboarding:";

interface OnboardingContextValue {
  ready: boolean;
  state: OnboardingState;
  hasBasicInfo: boolean;
  hasBusinessDetails: boolean;
  tier1Complete: boolean;
  tier1PendingPhone: boolean;
  saveProfile: (profile: BasicInfoProfile) => void;
  saveBusiness: (business: BusinessDetails) => void;
  markPhoneVerified: () => void;
  markPhoneSkipped: () => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function storageKey(userId: number | string | null | undefined): string | null {
  if (userId === null || userId === undefined || userId === "") return null;
  return `${STORAGE_PREFIX}${userId}`;
}

function readState(key: string | null): OnboardingState {
  if (!key || typeof window === "undefined") return EMPTY_ONBOARDING_STATE;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY_ONBOARDING_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      profile: parsed.profile ?? null,
      business: parsed.business ?? null,
      phoneVerified: Boolean(parsed.phoneVerified),
      phoneSkipped: Boolean(parsed.phoneSkipped),
    };
  } catch {
    return EMPTY_ONBOARDING_STATE;
  }
}

function writeState(key: string | null, state: OnboardingState) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage failures (quota, private mode) are non-fatal.
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const key = storageKey(user?.id);

  // We derive state during render when the identity key changes, rather than
  // syncing via useEffect. This avoids the lint rule against set-state-in-effect
  // and keeps hydration simple.
  const [trackedKey, setTrackedKey] = useState<string | null | undefined>(undefined);
  const [state, setState] = useState<OnboardingState>(EMPTY_ONBOARDING_STATE);
  const ready = !authLoading && trackedKey === key;

  if (!authLoading && trackedKey !== key) {
    setTrackedKey(key);
    setState(readState(key));
  }

  const saveProfile = useCallback(
    (profile: BasicInfoProfile) => {
      setState((prev) => {
        const next = { ...prev, profile };
        writeState(key, next);
        return next;
      });
    },
    [key],
  );

  const saveBusiness = useCallback(
    (business: BusinessDetails) => {
      setState((prev) => {
        const next = { ...prev, business };
        writeState(key, next);
        return next;
      });
    },
    [key],
  );

  const markPhoneVerified = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, phoneVerified: true, phoneSkipped: false };
      writeState(key, next);
      return next;
    });
  }, [key]);

  const markPhoneSkipped = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, phoneVerified: false, phoneSkipped: true };
      writeState(key, next);
      return next;
    });
  }, [key]);

  const reset = useCallback(() => {
    writeState(key, EMPTY_ONBOARDING_STATE);
    setState(EMPTY_ONBOARDING_STATE);
  }, [key]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      ready,
      state,
      hasBasicInfo: isBasicInfoComplete(state.profile),
      hasBusinessDetails: isBusinessDetailsComplete(state.business),
      tier1Complete: isTier1Complete(state),
      tier1PendingPhone: isTier1PendingPhone(state),
      saveProfile,
      saveBusiness,
      markPhoneVerified,
      markPhoneSkipped,
      reset,
    }),
    [ready, state, saveProfile, saveBusiness, markPhoneVerified, markPhoneSkipped, reset],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
