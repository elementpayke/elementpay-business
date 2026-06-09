"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import BusinessDetailsStep from "@/components/onboarding/BusinessDetailsStep";
import { useAuth } from "@/lib/AuthContext";
import { useOnboarding } from "@/lib/onboarding/OnboardingContext";
import { submitKybAndInitiate } from "@/lib/onboarding/kybSubmit";
import type { BusinessDetails } from "@/lib/onboarding/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, authenticated, loading: authLoading, kybVerified } = useAuth();
  const { ready, state, saveBusiness } = useOnboarding();

  useEffect(() => {
    if (authLoading) return;
    console.log("[guard:onboarding]", {
      authenticated,
      authLoading,
      kybVerified,
    });
    if (!authenticated) {
      router.replace("/auth/login");
      return;
    }
    if (kybVerified === true) {
      console.warn("[guard:onboarding] redirecting → /dashboard");
      router.replace("/dashboard");
    }
  }, [authLoading, authenticated, kybVerified, router]);

  if (
    authLoading ||
    !authenticated ||
    kybVerified === true ||
    !ready
  ) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  const handleBusinessSubmit = async (business: BusinessDetails) => {
    if (!user?.id) {
      throw new Error("You must be signed in to submit business details.");
    }
    if (!user.business_id) {
      throw new Error("No business is associated with this account.");
    }
    // Surfaces upstream errors to the form via thrown Error.
    const result = await submitKybAndInitiate(
      user.business_id,
      business,
      null,
      user.email,
    );
    saveBusiness(business);
    if (result.hostedUrl) {
      window.location.href = result.hostedUrl;
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5 sm:space-y-6"
    >
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Tier 1 Basic Verification
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Business details, owners, and directors in one guided flow.
        </p>
        <hr className="w-full border-gray-200 dark:border-gray-800 mt-3 sm:my-4" />
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-950 p-0 sm:p-6">
        <BusinessDetailsStep
          initial={state.business}
          onSubmit={handleBusinessSubmit}
          onDraftChange={saveBusiness}
        />
      </div>
    </motion.div>
  );
}
