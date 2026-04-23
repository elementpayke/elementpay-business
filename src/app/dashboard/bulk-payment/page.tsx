"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BulkPaymentStepper from "@/components/bulk-payment/BulkPaymentStepper";
import CsvUploadStep from "@/components/bulk-payment/CsvUploadStep";
import RecipientsPreviewStep from "@/components/bulk-payment/RecipientsPreviewStep";
import PaymentReviewStep from "@/components/bulk-payment/PaymentReviewStep";
import BulkProcessingStep from "@/components/bulk-payment/BulkProcessingStep";
import BulkSuccessStep from "@/components/bulk-payment/BulkSuccessStep";
import BulkErrorStep from "@/components/bulk-payment/BulkErrorStep";
import { bulkPhaseToStep, useBulkPaymentStore } from "@/stores/bulkPaymentStore";

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

export default function BulkPaymentPage() {
  const router = useRouter();
  const phase = useBulkPaymentStore((s) => s.phase);
  const reset = useBulkPaymentStore((s) => s.reset);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const step = bulkPhaseToStep(phase);
  const allComplete = phase === "processing" || phase === "success" || phase === "error";

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
            Bulk Payment
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[820px] space-y-4">
        <BulkPaymentStepper currentStep={step} allComplete={allComplete} />

        {phase === "csv-upload" || phase === "csv-validating" ? <CsvUploadStep /> : null}
        {phase === "recipients-preview" ? <RecipientsPreviewStep /> : null}
        {phase === "payment-review" ? <PaymentReviewStep /> : null}
        {phase === "processing" ? <BulkProcessingStep /> : null}
        {phase === "success" ? <BulkSuccessStep /> : null}
        {phase === "error" ? <BulkErrorStep /> : null}
      </div>
    </section>
  );
}
