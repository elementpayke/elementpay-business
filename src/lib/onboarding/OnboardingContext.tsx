"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/AuthContext";
import { getKybSummary, kybSummaryHasProfile } from "@/lib/kyb";
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
    const profile = parsed.profile
      ? {
          ...parsed.profile,
          countryCode: parsed.profile.countryCode?.startsWith("+")
            ? ""
            : parsed.profile.countryCode ?? "",
        }
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
  const { user, loading: authLoading } = useAuth();
  const key = storageKey(user?.id);
  const businessId = user?.business_id ?? null;

  // We derive state during render when the identity key changes, rather than
  // syncing via useEffect. This avoids the lint rule against set-state-in-effect
  // and keeps hydration simple.
  const [trackedKey, setTrackedKey] = useState<string | null | undefined>(undefined);
  const [state, setState] = useState<OnboardingState>(EMPTY_ONBOARDING_STATE);
  const [prefillBusinessId, setPrefillBusinessId] = useState<number | null>(null);
  const [prefillDone, setPrefillDone] = useState(false);
  const prefillInFlight = useRef(false);

  const localReady = !authLoading && trackedKey === key;
  // We only need to wait on the server fetch when a business_id is present.
  // If the user has no business yet, prefill is a no-op.
  const ready =
    localReady && (businessId === null || prefillBusinessId === businessId);

  if (!authLoading && trackedKey !== key) {
    setTrackedKey(key);
    setState(readState(key));
    // Identity changed (or first hydration) — invalidate any prior prefill so
    // the effect below re-fetches for the new business.
    setPrefillDone(false);
    setPrefillBusinessId(null);
  }

  // Fetch existing KYB profile from the server and merge it into the local
  // draft so a failed submission doesn't lose user-entered data. Runs once
  // per business_id; falls back silently if the GET fails.
  useEffect(() => {
    if (!localReady) return;
    if (businessId === null) return;
    if (prefillBusinessId === businessId) return;
    if (prefillInFlight.current) return;

    prefillInFlight.current = true;
    void (async () => {
      try {
        const summary = await getKybSummary(businessId);
        if (kybSummaryHasProfile(summary) && summary.profile) {
          const serverState: OnboardingState = {
            profile: profileToBasicInfo(summary.profile),
            business: profileToBusinessDetails(summary.profile),
          };
          setState((prev) => {
            const merged = mergeOnboardingState(serverState, prev);
            writeState(key, merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn(
          "[onboarding] KYB prefill failed, using local draft:",
          err instanceof Error ? err.message : err,
        );
      } finally {
        prefillInFlight.current = false;
        setPrefillBusinessId(businessId);
        setPrefillDone(true);
      }
    })();
  }, [localReady, businessId, prefillBusinessId, key]);

  // prefillDone is referenced indirectly by `ready` via prefillBusinessId;
  // keep the value in scope for future use without an unused-var warning.
  void prefillDone;

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
