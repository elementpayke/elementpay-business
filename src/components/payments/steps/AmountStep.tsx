"use client";

import { useEffect, useMemo, useState } from "react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { SUPPORTED_TOKENS } from "@/lib/wallets/supportedTokens";
import { shortAddress } from "@/lib/wallets/wallet-selection";

const USDC_BASE = SUPPORTED_TOKENS.find((t) => t.symbol === "USDC" && t.chain === "Base")!;
const MIN_FIAT_AMOUNT = 1;

export default function AmountStep() {
  const recipient = useSendPaymentStore((s) => s.recipient);
  const amountFromStore = useSendPaymentStore((s) => s.amount);
  const setAmount = useSendPaymentStore((s) => s.setAmount);
  const setPhase = useSendPaymentStore((s) => s.setPhase);

  const { selectedWallet } = useSelectedWallet();

  const walletAddress = selectedWallet?.address ?? "";
  const availableUsd = selectedWallet?.balance.usd ?? 0;

  const receiveCurrency = recipient?.receiveCurrency ?? "KES";
  const receiveCountry = recipient?.countryCode ?? "KE";

  const [fiatAmount, setFiatAmount] = useState<number>(amountFromStore?.fiatAmount ?? 0);

  // Recipient country edits reset the amount because the receive currency changes.
  useEffect(() => {
    if (amountFromStore && amountFromStore.receiveCurrency !== receiveCurrency) {
      setFiatAmount(0);
    }
  }, [receiveCurrency, amountFromStore]);

  const missingWallet = !walletAddress;
  const invalidAmount = !(fiatAmount > 0);
  const belowMin = fiatAmount > 0 && fiatAmount < MIN_FIAT_AMOUNT;
  const noBalance = useMemo(() => availableUsd <= 0, [availableUsd]);
  const disableContinue = invalidAmount || belowMin || missingWallet || noBalance;

  function handleContinue() {
    if (disableContinue || !walletAddress) return;
    setAmount({
      sourceWalletAddress: walletAddress,
      tokenAddress: USDC_BASE.tokenAddress,
      tokenSymbol: USDC_BASE.symbol,
      network: USDC_BASE.chain,
      refundAddress: walletAddress,
      fiatAmount,
      receiveCurrency,
      receiveCountry,
    });
    setPhase("payment-review");
  }

  return (
    <div className={cardClassName("space-y-4 p-4")}>
      <div className="rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 py-3 text-xs text-[#4D556D]">
        Recipient receives <span className="font-semibold text-[#1F2640]">{receiveCurrency}</span>{" "}
        via <span className="font-semibold text-[#1F2640]">{recipient?.paymentMethod ?? "—"}</span>.
        Live rate and USDC required are quoted on the next step.
      </div>

      <div className="rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-[#8E93A7]">Paying from</p>
        <p className="mt-1 text-sm font-semibold text-[#1F2640]">
          {selectedWallet?.label ?? "ElementPay Wallet"}
        </p>
        <p className="mt-0.5 text-[11px] text-[#9298AC]">
          {walletAddress
            ? `${shortAddress(walletAddress)} · Available ${selectedWallet?.balance.formatted ?? "0"} ${USDC_BASE.symbol}`
            : "No wallet provisioned yet"}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-[#4D556D]">
          How much should the recipient receive?
        </label>
        <div className="flex items-center overflow-hidden rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] focus-within:bg-white">
          <input
            type="number"
            step="0.01"
            min="0"
            value={fiatAmount > 0 ? fiatAmount : ""}
            onChange={(e) => {
              const n = Number(e.target.value);
              setFiatAmount(Number.isFinite(n) && n >= 0 ? n : 0);
            }}
            placeholder="0.00"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[#1F2640] outline-none placeholder:text-[#B0B7CE]"
          />
          <span className="shrink-0 px-3 text-sm font-semibold text-[#4D556D]">
            {receiveCurrency}
          </span>
        </div>
      </div>

      {noBalance ? (
        <p className="text-xs text-[#E35D5B]">
          Your wallet has no USDC balance. Fund the wallet before sending a payment.
        </p>
      ) : null}
      {belowMin ? (
        <p className="text-xs text-[#E35D5B]">
          Minimum payment is {MIN_FIAT_AMOUNT} {receiveCurrency}.
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={() => setPhase("recipient-details")}
          className="h-11 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          Back to recipient details
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={disableContinue}
          className="h-11 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Proceed to payment review
        </button>
      </div>
    </div>
  );
}
