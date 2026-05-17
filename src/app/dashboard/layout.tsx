"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import DevStatusBar from "@/components/dashboard/DevStatusBar";
import { useAuth } from "@/lib/AuthContext";
import { useOnboarding } from "@/lib/onboarding/OnboardingContext";
import { devLog } from "@/lib/devlog";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, authenticated, kybVerified, kybSummary } = useAuth();
  const {
    ready: onboardingReady,
    hasBasicInfo,
    tier1Complete,
  } = useOnboarding();
  const lastAuthRef = useRef<boolean | null>(null);

  // A user who has already submitted KYB (status: submitted/approved) has
  // nothing more to do in the onboarding form. Bouncing them back would
  // re-trigger /kyb/initiate and loop. /me doesn't always populate kyb_status,
  // so we also treat "Tier-1 form complete" as proof the user has submitted —
  // otherwise dashboard and onboarding contradict each other (one says
  // "redirect to form", the other says "form is done, go back") and we loop.
  const kybStatus = typeof kybSummary?.kyb_status === "string"
    ? kybSummary.kyb_status.toLowerCase()
    : null;
  const kybStatusSubmitted =
    kybStatus !== null && kybStatus !== "pending" && kybStatus !== "";
  const kybSubmitted = kybStatusSubmitted || (onboardingReady && tier1Complete);

  // KYB is the source of truth for onboarding gating. Local Tier-1 draft
  // (hasBasicInfo) is only consulted when we don't have a server answer yet
  // (kybVerified === null), so signed-in users with verified KYB on a fresh
  // device aren't bounced back through onboarding.
  const needsOnboarding =
    !kybSubmitted &&
    (kybVerified === false ||
      (kybVerified === null && onboardingReady && !hasBasicInfo));

  useEffect(() => {
    if (loading) return;
    if (lastAuthRef.current === null) {
      devLog.info("auth", authenticated ? "Session restored" : "No active session");
    } else if (lastAuthRef.current !== authenticated) {
      devLog.info("auth", authenticated ? "Signed in" : "Signed out");
    }
    lastAuthRef.current = authenticated;

    console.log("[guard:dashboard]", {
      authenticated,
      loading,
      kybVerified,
      kybStatus,
      kybStatusSubmitted,
      tier1Complete,
      kybSubmitted,
      onboardingReady,
      hasBasicInfo,
      needsOnboarding,
    });

    if (!authenticated) {
      router.replace("/auth/login");
      return;
    }
    if (needsOnboarding) {
      console.warn("[guard:dashboard] redirecting → /onboarding");
      router.replace("/onboarding");
    }
  }, [
    authenticated,
    loading,
    needsOnboarding,
    router,
    kybVerified,
    kybStatus,
    kybStatusSubmitted,
    tier1Complete,
    kybSubmitted,
    onboardingReady,
    hasBasicInfo,
  ]);

  const gated = loading || !authenticated || needsOnboarding;

  if (gated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <DevStatusBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar bar */}
      <div className="w-full border-b border-border bg-surface">
        <div className="mx-auto max-w-[1480px] px-5 md:px-7 lg:px-10">
          <DashboardNavbar />
        </div>
      </div>

      {/* Tabs bar */}
      <div className="w-full border-b border-border bg-surface">
        <div className="mx-auto max-w-[1480px] px-5 md:px-7 lg:px-10">
          <DashboardTabs />
        </div>
      </div>

      <main className="mx-auto max-w-[1480px] px-5 pb-10 pt-6 md:px-7 lg:px-10">
        {children}
      </main>

      <DevStatusBar />
    </div>
  );
}