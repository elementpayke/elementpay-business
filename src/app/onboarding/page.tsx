"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import BasicInfoStep from "@/components/onboarding/BasicInfoStep";
import BusinessDetailsStep from "@/components/onboarding/BusinessDetailsStep";
import OnboardingStepper, {
  type OnboardingStep,
} from "@/components/onboarding/OnboardingStepper";
import { useAuth } from "@/lib/AuthContext";
import { useOnboarding } from "@/lib/onboarding/OnboardingContext";
import { submitKybAndInitiate } from "@/lib/onboarding/kybSubmit";
import type { BasicInfoProfile, BusinessDetails } from "@/lib/onboarding/types";

function initialStep(hasProfile: boolean): OnboardingStep {
  return hasProfile ? "business-details" : "basic-info";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, authenticated, loading: authLoading, kybVerified } = useAuth();
  const { ready, state, hasBusinessDetails, saveProfile, saveBusiness } =
    useOnboarding();
  // Defer step initialization until prefill completes so the initial step
  // reflects server-derived state, not just an empty draft.
  const [step, setStep] = useState<OnboardingStep | null>(null);
  if (ready && step === null) {
    setStep(initialStep(Boolean(state.profile)));
  }

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
    !ready ||
    step === null
  ) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  const handleBasicInfoSubmit = async (profile: BasicInfoProfile) => {
    saveProfile(profile);
    setStep("business-details");
  };

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
      state.profile,
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
      className="space-y-6 sm:space-y-8"
    >
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Tier 1 : Basic Verification
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          A few details about you and your business and you&apos;re good to go.
        </p>
        <hr className="w-full border-gray-200 dark:border-gray-800 mt-3 sm:my-4" />
      </div>

      <OnboardingStepper
        current={step}
        basicInfoDone={Boolean(state.profile)}
        businessDetailsDone={hasBusinessDetails}
      />

      <div className="rounded-2xl bg-white dark:bg-gray-950 p-0 sm:p-8">
        {step === "basic-info" ? (
          <BasicInfoStep initial={state.profile} onSubmit={handleBasicInfoSubmit} />
        ) : (
          <BusinessDetailsStep
            initial={state.business}
            onSubmit={handleBusinessSubmit}
            onBack={() => setStep("basic-info")}
          />
        )}
      </div>
    </motion.div>
  );
}
