"use client";

import { Wallet2 } from "lucide-react";
import {
  AggregatorError,
  createBankTransferOrder,
  createOnRampOrder,
  createPaybillOrder,
} from "@/lib/aggregator";
import { useDepositStore } from "@/stores/depositStore";

const METHOD_LABELS: Record<string, string> = {
  "mpesa-mobile": "M-Pesa mobile money",
  "mpesa-paybill": "M-Pesa Paybill",
  "bank-transfer": "Bank transfer",
};

export default function ConfirmDepositStep() {
  const {
    selectedCurrency,
    selectedWalletAddress,
    selectedWalletLabel,
    selectedTokenAddress,
    amountFiat,
    paymentMethod,
    phoneNumber,
    cardDetails,
    setPhase,
    setOrderResult,
    setErrorMessage,
  } = useDepositStore();

  async function handleConfirm() {
    if (
      !selectedWalletAddress ||
      !selectedTokenAddress ||
      !selectedCurrency ||
      !paymentMethod ||
      amountFiat <= 0
    ) {
      setErrorMessage("Missing deposit details. Please go back and try again.");
      setPhase("error");
      return;
    }

    const startTime = Date.now();
    setPhase("processing");

    try {
      let tx_hash: string | undefined;
      let statusText: string | undefined;

      if (paymentMethod === "mpesa-mobile") {
        const res = await createOnRampOrder({
          userAddress: selectedWalletAddress,
          tokenAddress: selectedTokenAddress,
          amountFiat,
          phoneNumber: `254${phoneNumber}`,
          currency: selectedCurrency,
        });
        tx_hash = res.data?.tx_hash;
        statusText = res.data?.status;
      } else if (paymentMethod === "mpesa-paybill") {
        const res = await createPaybillOrder({
          userAddress: selectedWalletAddress,
          tokenAddress: selectedTokenAddress,
          amountFiat,
          currency: selectedCurrency,
        });
        tx_hash = res.data?.tx_hash;
        statusText = res.data?.status;
      } else {
        const res = await createBankTransferOrder({
          userAddress: selectedWalletAddress,
          tokenAddress: selectedTokenAddress,
          amountFiat,
          currency: selectedCurrency,
          cardDetails,
        });
        tx_hash = res.data?.tx_hash;
        statusText = res.data?.status;
      }

      setOrderResult({
        txHash: tx_hash ?? null,
        orderId: tx_hash ?? null,
        status: statusText ?? "Successful",
        processingTimeMs: Date.now() - startTime,
      });
      setPhase("success");
    } catch (err) {
      const message =
        err instanceof AggregatorError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create deposit order.";
      setErrorMessage(message);
      setPhase("error");
    }
  }

  const methodLabel = paymentMethod ? METHOD_LABELS[paymentMethod] : "—";
  const amountDisplay = `${selectedCurrency ?? ""} ${amountFiat.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <span className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-primary-100 text-primary-500">
          <Wallet2 className="h-16 w-16" />
        </span>
      </div>

      <div className="mx-auto max-w-[560px] rounded-xl border border-[#ECEEF5] bg-white p-8 text-center">
        <p className="text-sm text-[#7E8498]">You&apos;re about to deposit</p>
        <p className="mt-2 text-3xl font-bold text-[#1A2138]">{amountDisplay}</p>
        <p className="mt-1 text-sm text-[#7E8498]">into</p>
        <p className="text-sm font-semibold text-[#1A2138]">{selectedWalletLabel ?? "Wallet"}</p>
        <p className="mt-1 text-sm text-[#7E8498]">via</p>
        <p className="text-sm font-semibold text-[#1A2138]">{methodLabel}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPhase("deposit-details")}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-200 text-sm font-semibold text-primary-500 transition hover:bg-primary-100/40"
          >
            Cancel deposit
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
          >
            I have made the deposit
          </button>
        </div>
      </div>
    </div>
  );
}
