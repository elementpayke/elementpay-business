"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Phone, X } from "lucide-react";
import { useOnboarding } from "@/lib/onboarding/OnboardingContext";

const DISMISS_KEY = "onboarding:phone-banner-dismissed";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getDismissed() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DISMISS_KEY) === "1";
}

export default function OnboardingBanner() {
  const { tier1PendingPhone } = useOnboarding();
  const storedDismissed = useSyncExternalStore(subscribe, getDismissed, () => false);
  const [locallyDismissed, setLocallyDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setLocallyDismissed(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    }
  }, []);

  if (!tier1PendingPhone || storedDismissed || locallyDismissed) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#FFE1C0] bg-[#FFF8F0] px-4 py-3 text-sm text-[#8A5A1A] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Phone className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold text-[#6E4614]">Phone verification pending</p>
          <p className="text-[13px] text-[#8A5A1A]">
            Complete phone verification to finish Tier 1 verification and unlock higher limits.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/verification?action=verify-phone"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary-500 px-3 text-xs font-semibold text-white transition hover:bg-primary-600"
        >
          Verify phone
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#8A5A1A]/70 transition hover:bg-[#FFE9CF] hover:text-[#6E4614]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
