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
import type { KybProfileResponse } from "@/lib/kyb";
import {
  mergeOnboardingState,
  profileToBasicInfo,
  profileToBusinessDetails,
} from "@/lib/onboarding/kybPrefill";
import {
  EMPTY_ONBOARDING_STATE,
  isBasicInfoComplete,
  isBusinessDetailsComplete,
  isTier1Complete,
  normalizeBusinessType,
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
  saveProfile: (profile: BasicInfoProfile) => void;
  saveBusiness: (business: BusinessDetails) => void;
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
    // Older drafts stored the dial code (e.g. "+254") in profile.countryCode,
    // but the contract is ISO-2. Drop bad values so the form re-defaults.
    // Older drafts also stored dateOfBirth as { day, month, year } — drop
    // those rather than try to migrate.
    const rawProfile = parsed.profile as
      | (Partial<BasicInfoProfile> & { dateOfBirth?: unknown })
      | null
      | undefined;
    const profile = rawProfile
      ? ({
          firstName: rawProfile.firstName ?? "",
          lastName: rawProfile.lastName ?? "",
          country: rawProfile.country ?? "",
          countryCode: rawProfile.countryCode?.startsWith("+")
            ? ""
            : rawProfile.countryCode ?? "",
          phoneNumber: rawProfile.phoneNumber ?? "",
          dateOfBirth:
            typeof rawProfile.dateOfBirth === "string" ? rawProfile.dateOfBirth : "",
        } as BasicInfoProfile)
      : null;
    const business = parsed.business
      ? {
          ...parsed.business,
          entityType: normalizeBusinessType(parsed.business.entityType ?? ""),
        }
      : null;
    return {
      profile,
      business,
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
  const { user, business, kybSummary, loading: authLoading } = useAuth();
  const key = storageKey(user?.id);
  const businessId = user?.business_id ?? null;

  // We derive state during render when the identity key changes, rather than
  // syncing via useEffect. This avoids the lint rule against set-state-in-effect
  // and keeps hydration simple.
  const [trackedKey, setTrackedKey] = useState<string | null | undefined>(undefined);
  const [state, setState] = useState<OnboardingState>(EMPTY_ONBOARDING_STATE);
  const [prefillBusinessId, setPrefillBusinessId] = useState<number | null>(null);

  const localReady = !authLoading && trackedKey === key;
  // We only need to wait on the server prefill when a business_id is present.
  // If the user has no business yet, prefill is a no-op.
  const ready =
    localReady && (businessId === null || prefillBusinessId === businessId);

  if (!authLoading && trackedKey !== key) {
    setTrackedKey(key);
    setState(readState(key));
    setPrefillBusinessId(null);
  }

  // Prefill from /auth/me kyb_summary (already fetched by AuthContext) and the
  // /auth/me business record (for the trade name). Runs once per business_id —
  // derived during render rather than via useEffect so it stays consistent
  // with the identity-key hydration above.
  if (
    localReady &&
    businessId !== null &&
    prefillBusinessId !== businessId &&
    business
  ) {
    const profile = (kybSummary?.profile as KybProfileResponse | undefined) ?? null;
    if (profile) {
      const serverState: OnboardingState = {
        profile: profileToBasicInfo(profile),
        business: profileToBusinessDetails(profile, business),
      };
      const merged = mergeOnboardingState(serverState, state);
      writeState(key, merged);
      setState(merged);
    } else if (business.name && !state.business?.legalName) {
      // No KYB profile yet — still seed legalName from the trade name.
      const seededBusiness = state.business
        ? { ...state.business, legalName: business.name }
        : null;
      if (seededBusiness) {
        const next: OnboardingState = { ...state, business: seededBusiness };
        writeState(key, next);
        setState(next);
      }
    }
    setPrefillBusinessId(businessId);
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
      saveProfile,
      saveBusiness,
      reset,
    }),
    [ready, state, saveProfile, saveBusiness, reset],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
