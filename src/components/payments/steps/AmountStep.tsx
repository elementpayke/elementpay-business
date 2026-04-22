"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import ExchangePill from "@/components/payments/ExchangePill";
import FeeSummary from "@/components/payments/FeeSummary";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import {
  KES_PER_USD,
  calculateFee,
  kesToUsd,
  usdToKes,
} from "@/lib/payments/service";
import { useFeeStructure } from "@/lib/payments/useFeeStructure";
import { shortAddress } from "@/lib/wallets/wallet-selection";

type EditingSide = "send" | "receive";
const MIN_RECEIVE_KES = 10;

export default function AmountStep() {
  const recipient = useSendPaymentStore((s) => s.recipient);
  const amountFromStore = useSendPaymentStore((s) => s.amount);
  const setAmount = useSendPaymentStore((s) => s.setAmount);
  const setPhase = useSendPaymentStore((s) => s.setPhase);

  const { wallets, selectedWallet, selectedWalletAddress, setSelectedWallet } =
    useSelectedWallet();

  const [walletAddressOverride, setWalletAddressOverride] = useState<string>(
    amountFromStore?.sourceWalletAddress ?? "",
  );
  const [sendAmount, setSendAmount] = useState<number>(amountFromStore?.sendAmount ?? 0);
  const [receiveAmount, setReceiveAmount] = useState<number>(
    amountFromStore?.receiveAmount ?? 0,
  );
  const [lastEdited, setLastEdited] = useState<EditingSide>("send");

  const walletAddress = walletAddressOverride || selectedWalletAddress || "";

  const activeWallet = useMemo(
    () =>
      wallets.find(
        (w) => w.address.toLowerCase() === walletAddress.toLowerCase(),
      ) ?? selectedWallet,
    [wallets, walletAddress, selectedWallet],
  );

  const country = recipient?.country ?? "Kenya";
  const { feeBands, isReady: feesReady } = useFeeStructure({
    token: "usdc",
    action: "OffRamp",
  });
  const fee = calculateFee({
    sendAmountUsd: sendAmount,
    country,
    paymentMethod: recipient?.paymentMethod ?? "",
    feeBands,
  });
  const totalDebit = sendAmount + fee;
  const availableUsd = activeWallet?.balance.amount ?? 0;
  const insufficientBalance = totalDebit > availableUsd;
  const invalidAmount = !(sendAmount > 0) || !(receiveAmount > 0);
  const belowMin = receiveAmount > 0 && receiveAmount < MIN_RECEIVE_KES;
  const missingWallet = !walletAddress || wallets.length === 0;

  const disableContinue =
    invalidAmount || insufficientBalance || belowMin || missingWallet || !feesReady;

  function handleSendChange(raw: string) {
    const n = Number(raw);
    const value = Number.isFinite(n) && n >= 0 ? n : 0;
    setSendAmount(value);
    setReceiveAmount(Number(usdToKes(value).toFixed(2)));
    setLastEdited("send");
  }

  function handleReceiveChange(raw: string) {
    const n = Number(raw);
    const value = Number.isFinite(n) && n >= 0 ? n : 0;
    setReceiveAmount(value);
    setSendAmount(Number(kesToUsd(value).toFixed(2)));
    setLastEdited("receive");
  }

  function handleWalletChange(address: string) {
    setWalletAddressOverride(address);
    if (address) setSelectedWallet(address);
  }

  function handleContinue() {
    if (disableContinue) return;
    setAmount({
      sourceWalletAddress: walletAddress,
      sendAmount,
      sendCurrency: "USD",
      receiveAmount,
      receiveCurrency: "KES",
      fee,
      fxRate: KES_PER_USD,
    });
    setPhase("payment-review");
  }

  return (
    <div className={cardClassName("space-y-5 p-5")}>
      <ExchangePill
        fromFlag="🇺🇸"
        toFlag="🇰🇪"
        fromAmount={1}
        fromLabel="US Dollar"
        toAmount={KES_PER_USD}
        toLabel="Kenyan Shillings"
      />

      <div>
        <label className="mb-2 block text-xs text-[#4D556D]">
          What would wallet would you like to pay with?
        </label>
        <div className="relative">
          <select
            value={walletAddress}
            onChange={(e) => handleWalletChange(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
          >
            <option value="">Select a wallet</option>
            {wallets.map((wallet) => (
              <option key={wallet.address} value={wallet.address}>
                {wallet.label} · {wallet.balance.formatted} {wallet.balance.symbol}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3B6]" />
        </div>
        {activeWallet ? (
          <p className="mt-2 text-[11px] text-[#9298AC]">
            Signs from {shortAddress(activeWallet.address)} · Available{" "}
            {activeWallet.balance.formatted} {activeWallet.balance.symbol}
          </p>
        ) : null}
      </div>

      <AmountField
        label="You send"
        value={lastEdited === "send" ? rawString(sendAmount) : sendAmount.toFixed(2)}
        onChange={handleSendChange}
        flag="🇺🇸"
        code="USD"
      />

      <AmountField
        label="Recipient gets"
        value={lastEdited === "receive" ? rawString(receiveAmount) : receiveAmount.toFixed(2)}
        onChange={handleReceiveChange}
        flag="🇰🇪"
        code="KES"
      />

      <FeeSummary
        sendAmount={sendAmount}
        fee={fee}
        totalDebit={totalDebit}
        currency="USD"
      />

      {insufficientBalance && !missingWallet ? (
        <p className="text-xs text-[#E35D5B]">
          Insufficient balance in the selected wallet for this payment.
        </p>
      ) : null}
      {belowMin ? (
        <p className="text-xs text-[#E35D5B]">Min is KES 10.</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setPhase("recipient-details")}
          className="h-12 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          Back to recipient details
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={disableContinue}
          className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Proceed to payment review
        </button>
      </div>
    </div>
  );
}

function rawString(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  return String(value);
}

type AmountFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  flag: string;
  code: string;
};

function AmountField({ label, value, onChange, flag, code }: AmountFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-xs text-[#4D556D]">{label}</label>
      <div className="flex items-stretch gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 flex-1 rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
        />
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#ECEEF4] bg-white px-3 text-sm font-medium text-[#1F2640]">
          <span className="text-base leading-none">{flag}</span>
          <span>{code}</span>
          <ChevronDown className="h-4 w-4 text-[#9CA3B6]" />
        </div>
      </div>
    </div>
  );
}
