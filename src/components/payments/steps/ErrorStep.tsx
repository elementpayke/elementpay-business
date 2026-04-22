"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";

export default function ErrorStep() {
  const router = useRouter();
  const error = useSendPaymentStore((s) => s.error);
  const setPhase = useSendPaymentStore((s) => s.setPhase);
  const reset = useSendPaymentStore((s) => s.reset);

  return (
    <div className={cardClassName("space-y-5 p-6 sm:p-8")}>
      <div className="flex justify-center">
        <div className="rounded-full bg-[#FFECEA] p-4 text-[#E25555]">
          <AlertTriangle className="h-10 w-10" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#171D32]">Payment failed</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#7E8498]">
          {error?.message ??
            "We couldn't complete this payment. No funds have left your wallet."}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="h-12 flex-1 rounded-xl border border-[#E1E4EE] text-sm font-semibold text-[#303854] transition hover:border-[#CBD2E5]"
        >
          Back to dashboard
        </button>
        <button
          type="button"
          onClick={() => {
            // Offer a support/contact surface later; for now just reset the flow.
            reset();
          }}
          className="h-12 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          Contact support
        </button>
        {error?.retryable !== false ? (
          <button
            type="button"
            onClick={() => setPhase("payment-review")}
            className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
