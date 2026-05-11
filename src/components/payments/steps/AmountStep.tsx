"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import type { FlagCode } from "@/components/dashboard/Flag";
import ExchangePill from "@/components/payments/ExchangePill";
import FeeSummary from "@/components/payments/FeeSummary";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { calculateFee } from "@/lib/payments/service";
import { useFeeStructure } from "@/lib/payments/useFeeStructure";
import { shortAddress } from "@/lib/wallets/wallet-selection";
import type { Country } from "@/components/payments/paymentData";

// ─── Mock FX config ───────────────────────────────────────────────────────────

type FxConfig = {
  receiveCurrency: string;
  flagCode: FlagCode;
  receiveLabel: string;
  ratePerUsd: number;
};

const FX_CONFIG: Record<Country, FxConfig> = {
  Kenya:    { receiveCurrency: "KES", flagCode: "KE", receiveLabel: "Kenyan Shilling",    ratePerUsd: 129  },
  Uganda:   { receiveCurrency: "UGX", flagCode: "UG", receiveLabel: "Ugandan Shilling",   ratePerUsd: 3750 },
  Ghana:    { receiveCurrency: "GHS", flagCode: "GH", receiveLabel: "Ghanaian Cedi",      ratePerUsd: 15.5 },
  Tanzania: { receiveCurrency: "TZS", flagCode: "TZ", receiveLabel: "Tanzanian Shilling", ratePerUsd: 2600 },
  Nigeria:  { receiveCurrency: "NGN", flagCode: "NG", receiveLabel: "Nigerian Naira",     ratePerUsd: 1580 },
} as Record<Country, FxConfig>;

const DEFAULT_FX = FX_CONFIG["Kenya"];

function getFxConfig(country: Country | undefined | null): FxConfig {
  if (!country) return DEFAULT_FX;
  return FX_CONFIG[country] ?? DEFAULT_FX;
}

// ─── Side-by-side send / receive ─────────────────────────────────────────────
//
//  ┌──────────────────────┬──────────────────────┐
//  │ You send             │ Recipient gets        │
//  │ [        0  ]  USD   │ [     0.00  ]  KES   │
//  └──────────────────────┴──────────────────────┘

type DualAmountRowProps = {
  sendValue: string;
  onSendChange: (v: string) => void;
  receiveValue: string;
  onReceiveChange: (v: string) => void;
  receiveCurrency: string;
};

function DualAmountRow({
  sendValue,
  onSendChange,
  receiveValue,
  onReceiveChange,
  receiveCurrency,
}: DualAmountRowProps) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-[#ECEEF4]">
      {/* ── You send ── */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#FAFBFE] px-3 py-2.5 transition-colors focus-within:bg-white">
        <span className="mb-1 text-[10px] font-medium text-[#9298AC]">You send</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={sendValue}
            onChange={(e) => onSendChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#1F2640] outline-none placeholder:text-[#B0B7CE]"
          />
          <span className="shrink-0 text-sm font-semibold text-[#4D556D]">USD</span>
        </div>
      </div>

      {/* ── Vertical divider ── */}
      <div className="w-px self-stretch bg-[#ECEEF4]" />

      {/* ── Recipient gets ── */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#FAFBFE] px-3 py-2.5 transition-colors focus-within:bg-white">
        <span className="mb-1 text-[10px] font-medium text-[#9298AC]">Recipient gets</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={receiveValue}
            onChange={(e) => onReceiveChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#1F2640] outline-none placeholder:text-[#B0B7CE]"
          />
          <span className="shrink-0 text-sm font-semibold text-[#4D556D]">
            {receiveCurrency}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── AmountStep ───────────────────────────────────────────────────────────────

const MIN_RECEIVE = 1;

export default function AmountStep() {
  const recipient       = useSendPaymentStore((s) => s.recipient);
  const amountFromStore = useSendPaymentStore((s) => s.amount);
  const setAmount       = useSendPaymentStore((s) => s.setAmount);
  const setPhase        = useSendPaymentStore((s) => s.setPhase);

  const { wallets, selectedWallet, selectedWalletAddress, setSelectedWallet } =
    useSelectedWallet();

  const fxConfig = getFxConfig(recipient?.country);

  const [walletAddressOverride, setWalletAddressOverride] = useState<string>(
    amountFromStore?.sourceWalletAddress ?? "",
  );
  const [sendAmount, setSendAmount]       = useState<number>(amountFromStore?.sendAmount ?? 0);
  const [receiveAmount, setReceiveAmount] = useState<number>(amountFromStore?.receiveAmount ?? 0);
  const [lastEdited, setLastEdited]       = useState<"send" | "receive">("send");

  const walletAddress = walletAddressOverride || selectedWalletAddress || "";

  const activeWallet = useMemo(
    () =>
      wallets.find((w) => w.address.toLowerCase() === walletAddress.toLowerCase()) ??
      selectedWallet,
    [wallets, walletAddress, selectedWallet],
  );

  const country = recipient?.country ?? "Kenya";
  const { feeBands, isReady: feesReady } = useFeeStructure({ token: "usdc", action: "OffRamp" });

  const fee             = calculateFee({ sendAmountUsd: sendAmount, country, paymentMethod: recipient?.paymentMethod ?? "", feeBands });
  const totalDebit      = sendAmount + fee;
  const availableUsd    = activeWallet?.balance.amount ?? 0;
  const insufficientBalance = totalDebit > availableUsd;
  const invalidAmount   = !(sendAmount > 0) || !(receiveAmount > 0);
  const belowMin        = receiveAmount > 0 && receiveAmount < MIN_RECEIVE;
  const missingWallet   = !walletAddress || wallets.length === 0;
  const disableContinue = invalidAmount || insufficientBalance || belowMin || missingWallet || !feesReady;

  function handleSendChange(raw: string) {
    const n = Number(raw);
    const v = Number.isFinite(n) && n >= 0 ? n : 0;
    setSendAmount(v);
    setReceiveAmount(Number((v * fxConfig.ratePerUsd).toFixed(2)));
    setLastEdited("send");
  }

  function handleReceiveChange(raw: string) {
    const n = Number(raw);
    const v = Number.isFinite(n) && n >= 0 ? n : 0;
    setReceiveAmount(v);
    setSendAmount(Number((v / fxConfig.ratePerUsd).toFixed(2)));
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
      receiveCurrency: fxConfig.receiveCurrency,
      fee,
      fxRate: fxConfig.ratePerUsd,
    });
    setPhase("payment-review");
  }

  return (
    <div className={cardClassName("space-y-3 p-4")}>
      {/* ── Exchange rate pill ───────────────────────────────────────────── */}
      <ExchangePill
        fromCode="US"
        toCode={fxConfig.flagCode}
        fromAmount={1}
        fromLabel="US Dollar"
        toAmount={fxConfig.ratePerUsd}
        toLabel={fxConfig.receiveLabel}
      />

      {/* ── Wallet selector ──────────────────────────────────────────────── */}
      <div>
        <label className="mb-1.5 block text-xs text-[#4D556D]">
          What wallet would you like to pay with?
        </label>
        <div className="relative">
          <select
            value={walletAddress}
            onChange={(e) => handleWalletChange(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
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
          <p className="mt-1 text-[11px] text-[#9298AC]">
            Signs from {shortAddress(activeWallet.address)} · Available{" "}
            {activeWallet.balance.formatted} {activeWallet.balance.symbol}
          </p>
        ) : null}
      </div>

      {/* ── You send / Recipient gets — true single row ───────────────────── */}
      <DualAmountRow
        sendValue={lastEdited === "send" ? rawString(sendAmount) : sendAmount.toFixed(2)}
        onSendChange={handleSendChange}
        receiveValue={lastEdited === "receive" ? rawString(receiveAmount) : receiveAmount.toFixed(2)}
        onReceiveChange={handleReceiveChange}
        receiveCurrency={fxConfig.receiveCurrency}
      />

      {/* ── Fee summary ───────────────────────────────────────────────────── */}
      <FeeSummary
        sendAmount={sendAmount}
        fee={fee}
        totalDebit={totalDebit}
        currency="USD"
      />

      {/* ── Validation ───────────────────────────────────────────────────── */}
      {insufficientBalance && !missingWallet ? (
        <p className="text-xs text-[#E35D5B]">
          Insufficient balance in the selected wallet for this payment.
        </p>
      ) : null}
      {belowMin ? (
        <p className="text-xs text-[#E35D5B]">
          Min is {fxConfig.receiveCurrency} {MIN_RECEIVE.toLocaleString()}.
        </p>
      ) : null}

      {/* ── Actions ───────────────────────────────────────────────────────── */}
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

function rawString(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  return String(value);
}
