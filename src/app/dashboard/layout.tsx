"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import DevStatusBar from "@/components/dashboard/DevStatusBar";
import { useAuth } from "@/lib/AuthContext";
import { devLog } from "@/lib/devlog";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, authenticated, kybVerified } = useAuth();
  const lastAuthRef = useRef<boolean | null>(null);

  // The /auth/me business.kyb_verified flag is the sole source of truth for
  // dashboard access. kyb_status="submitted" is a review-pending state, not a
  // verified one — those users belong in onboarding (or a review-in-progress
  // screen) until the backend approves them.
  // kybVerified === null means /me hasn't resolved yet — wait, don't redirect.
  const needsOnboarding = kybVerified === false;

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
  }, [authenticated, loading, needsOnboarding, router, kybVerified]);

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

      <main className="mx-auto min-w-0 max-w-[1480px] overflow-x-hidden px-5 pb-10 pt-6 md:px-7 lg:px-10">
        {children}
      </main>

      <DevStatusBar />
    </div>
  );
}