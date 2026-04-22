"use client";

import { Timer } from "lucide-react";
import { useDepositStore } from "@/stores/depositStore";

export default function DepositLoadingStep() {
  const {
    selectedCurrency,
    selectedWalletLabel,
    amountFiat,
    paymentMethod,
    phoneNumber,
  } = useDepositStore();

  const contextual = (() => {
    if (paymentMethod === "mpesa-mobile") {
      return `An M-Pesa STK push has been sent to +254${phoneNumber}. Please enter your M-Pesa PIN on your phone to complete this deposit.`;
    }
    if (paymentMethod === "mpesa-paybill") {
      return "We're waiting to confirm your M-Pesa Paybill payment. This may take a few minutes.";
    }
    return "Your card transaction is being processed. Please do not close this page.";
  })();

  const amountDisplay = `${selectedCurrency ?? ""} ${amountFiat.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <span className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-primary-100 text-primary-500">
          <Timer className="h-16 w-16" />
        </span>
      </div>

      <div className="mx-auto max-w-[560px] rounded-xl border border-[#ECEEF5] bg-white p-8 text-center">
        <p className="text-xl font-bold text-[#1A2138]">Confirming your deposit…</p>
        <p className="mt-2 text-sm text-[#7E8498]">
          Please hold on while we confirm your deposit of
        </p>
        <p className="mt-1 text-2xl font-bold text-[#1A2138]">{amountDisplay}</p>
        <p className="mt-1 text-sm text-[#7E8498]">
          into <span className="font-semibold text-[#1A2138]">{selectedWalletLabel ?? "Wallet"}</span>
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[#4D556D]">{contextual}</p>

        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-[#E9EAF2]">
          <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 deposit-loading-bar" />
        </div>
      </div>
    </div>
  );
}
