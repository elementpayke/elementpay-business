"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BasicInfoStep from "@/components/onboarding/BasicInfoStep";
import BusinessDetailsStep from "@/components/onboarding/BusinessDetailsStep";
import OnboardingStepper, {
  type OnboardingStep,
} from "@/components/onboarding/OnboardingStepper";
import { useAuth } from "@/lib/AuthContext";
import { useOnboarding } from "@/lib/onboarding/OnboardingContext";
import { submitNoahPrefill } from "@/lib/onboarding/noahService";
import type { BasicInfoProfile, BusinessDetails } from "@/lib/onboarding/types";

function initialStep(hasProfile: boolean): OnboardingStep {
  return hasProfile ? "business-details" : "basic-info";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, hasBusinessDetails, saveProfile, saveBusiness } = useOnboarding();
  const [step, setStep] = useState<OnboardingStep>(
    initialStep(Boolean(state.profile)),
  );

  const handleBasicInfoSubmit = async (profile: BasicInfoProfile) => {
    saveProfile(profile);
    setStep("business-details");
  };

  const handleBusinessSubmit = async (business: BusinessDetails) => {
    if (!user?.id) {
      throw new Error("You must be signed in to submit business details.");
    }
    // Surfaces upstream errors to the form via thrown Error.
    const result = await submitNoahPrefill(business, user.id);
    saveBusiness(business);
    if (result.hostedUrl) {
      window.location.href = result.hostedUrl;
      return;
    }
    // Backend reports onboarding is already complete (no HostedURL needed).
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
