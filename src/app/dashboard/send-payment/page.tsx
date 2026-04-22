"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Stepper from "@/components/payments/Stepper";
import AmountStep from "@/components/payments/steps/AmountStep";
import ErrorStep from "@/components/payments/steps/ErrorStep";
import PinStep from "@/components/payments/steps/PinStep";
import ProcessingStep from "@/components/payments/steps/ProcessingStep";
import RecipientStep from "@/components/payments/steps/RecipientStep";
import ReviewStep from "@/components/payments/steps/ReviewStep";
import SuccessStep from "@/components/payments/steps/SuccessStep";
import { phaseToStep, useSendPaymentStore } from "@/stores/sendPaymentStore";

function HistoryButton({
  disabled = false,
  children,
  onClick,
}: {
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7EAF3] bg-white text-[#6B7287] transition hover:-translate-y-0.5 hover:border-[#D9DEEC] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export default function SendPaymentPage() {
  const router = useRouter();
  const phase = useSendPaymentStore((s) => s.phase);
  const reset = useSendPaymentStore((s) => s.reset);

  // Reset state when the page unmounts so returning later starts fresh.
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const step = phaseToStep(phase);
  const allComplete =
    phase === "pin-confirmation" ||
    phase === "processing" ||
    phase === "success" ||
    phase === "error";

  return (
    <section className="space-y-6">
      <div className="border-b border-[#E8EBF3] pb-5">
        <div className="flex items-center gap-3">
          <HistoryButton onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </HistoryButton>
          <HistoryButton disabled>
            <ChevronRight className="h-4 w-4" />
          </HistoryButton>
          <h1 className="ml-1 text-[28px] font-semibold tracking-[-0.04em] text-[#171D32]">
            Send Payment
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[820px] space-y-4">
        <Stepper currentStep={step} allComplete={allComplete} />

        {phase === "recipient-details" ? <RecipientStep /> : null}
        {phase === "payment-amount" ? <AmountStep /> : null}
        {phase === "payment-review" ? <ReviewStep /> : null}
        {phase === "pin-confirmation" ? <PinStep /> : null}
        {phase === "processing" ? <ProcessingStep /> : null}
        {phase === "success" ? <SuccessStep /> : null}
        {phase === "error" ? <ErrorStep /> : null}
      </div>
    </section>
  );
}
