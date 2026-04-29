"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BasicInfoStep from "@/components/onboarding/BasicInfoStep";
import BusinessDetailsStep from "@/components/onboarding/BusinessDetailsStep";
import OnboardingStepper, {
  type OnboardingStep,
} from "@/components/onboarding/OnboardingStepper";
import PhoneVerificationStep from "@/components/onboarding/PhoneVerificationStep";
import { useOnboarding } from "@/lib/onboarding/OnboardingContext";
import { submitNoahPrefill } from "@/lib/onboarding/noahService";
import type { BasicInfoProfile, BusinessDetails } from "@/lib/onboarding/types";

async function stubRequestOtp(phone: string): Promise<void> {
  void phone;
  await new Promise((resolve) => setTimeout(resolve, 400));
}

async function stubVerifyOtp(phone: string, code: string): Promise<void> {
  void phone;
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (code === "000000") {
    throw new Error("Invalid code. Please try again.");
  }
}

function initialStep(
  hasProfile: boolean,
  hasBusiness: boolean,
): OnboardingStep {
  if (!hasProfile) return "basic-info";
  if (!hasBusiness) return "business-details";
  return "phone";
}

export default function OnboardingPage() {
  const router = useRouter();
  const {
    state,
    hasBusinessDetails,
    saveProfile,
    saveBusiness,
    markPhoneVerified,
    markPhoneSkipped,
  } = useOnboarding();
  const [step, setStep] = useState<OnboardingStep>(
    initialStep(Boolean(state.profile), hasBusinessDetails),
  );

  const handleBasicInfoSubmit = async (profile: BasicInfoProfile) => {
    saveProfile(profile);
    setStep(hasBusinessDetails ? "phone" : "business-details");
  };

  const handleBusinessSubmit = async (business: BusinessDetails) => {
    // Surfaces upstream errors to the form via thrown Error.
    await submitNoahPrefill(business);
    saveBusiness(business);
    setStep("phone");
  };

  const handleVerified = async () => {
    markPhoneVerified();
    router.replace("/dashboard");
  };

  const handleSkip = async () => {
    markPhoneSkipped();
    router.replace("/dashboard");
  };

  const phoneDisplay = state.profile?.phoneNumber ?? "";

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
          A few details about you and your business and you&apos;re good to go. You can skip
          phone verification for now and complete it later.
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
        ) : step === "business-details" ? (
          <BusinessDetailsStep
            initial={state.business}
            onSubmit={handleBusinessSubmit}
            onBack={() => setStep("basic-info")}
          />
        ) : (
          <PhoneVerificationStep
            phoneDisplay={phoneDisplay}
            onVerified={handleVerified}
            onSkip={handleSkip}
            onBack={() => setStep("business-details")}
            requestOtp={stubRequestOtp}
            verifyOtp={stubVerifyOtp}
          />
        )}
      </div>
    </motion.div>
  );
}
