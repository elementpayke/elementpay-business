"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DepositStepper from "@/components/deposit/DepositStepper";
import DepositDetailsStep from "@/components/deposit/DepositDetailsStep";
import ConfirmDepositStep from "@/components/deposit/ConfirmDepositStep";
import DepositLoadingStep from "@/components/deposit/DepositLoadingStep";
import DepositSuccessStep from "@/components/deposit/DepositSuccessStep";
import DepositErrorStep from "@/components/deposit/DepositErrorStep";
import { useDepositStore } from "@/stores/depositStore";

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

export default function DepositMoneyPage() {
  const router = useRouter();
  const phase = useDepositStore((s) => s.phase);
  const reset = useDepositStore((s) => s.reset);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const showStepper = phase === "deposit-details" || phase === "confirm-deposit";
  const stepperStep: 1 | 2 = phase === "deposit-details" ? 1 : 2;

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
            Deposit Funds
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[840px] space-y-4">
        {showStepper ? <DepositStepper step={stepperStep} /> : null}

        {phase === "deposit-details" ? <DepositDetailsStep /> : null}
        {phase === "confirm-deposit" ? <ConfirmDepositStep /> : null}
        {phase === "processing" ? <DepositLoadingStep /> : null}
        {phase === "success" ? <DepositSuccessStep /> : null}
        {phase === "error" ? <DepositErrorStep /> : null}
      </div>
    </section>
  );
}
