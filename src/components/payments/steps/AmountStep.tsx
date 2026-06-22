"use client";

import { useState } from "react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { SUPPORTED_TOKENS } from "@/lib/wallets/supportedTokens";
import { shortAddress } from "@/lib/wallets/wallet-selection";
import { COUNTRIES } from "@/lib/countries";
import { useExchangeRates } from "@/lib/dashboard/hooks";

const USDC_BASE = SUPPORTED_TOKENS.find((t) => t.symbol === "USDC" && t.chain === "Base")!;
// Client-side amount/recipient validation is intentionally minimal while we
// test offramp end-to-end against the live backend. The backend is the source
// of truth for amount limits, phone-number format, IBAN/account validity, etc.
// Only enforce the bare minimum needed to build a structurally valid quote
// payload (a paying wallet + a non-zero fiat amount).

/**
 * Normalize a raw phone input to E.164 using the recipient corridor's dial
 * code. Accepts "0712…", "254712…", "+254712…". Mirrors the deposit flow's
 * coercion so momo payouts reach the aggregator in the format it requires.
 */
function toE164(raw: string, countryCode: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  const dialCode =
    COUNTRIES.find((c) => c.code === countryCode)?.dialCode.replace(/\D/g, "") || "";
  if (!dialCode) return digits ? `+${digits}` : "";
  const local = digits.startsWith(dialCode)
    ? digits
    : `${dialCode}${digits.replace(/^0+/, "")}`;
  return `+${local}`;
}

function formatToken(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export default function AmountStep() {
  const recipient = useSendPaymentStore((s) => s.recipient);
  const amountFromStore = useSendPaymentStore((s) => s.amount);
  const setAmount = useSendPaymentStore((s) => s.setAmount);
  const setPhase = useSendPaymentStore((s) => s.setPhase);

  const { selectedWallet } = useSelectedWallet();

  const walletAddress = selectedWallet?.address ?? "";

  const receiveCurrency = recipient?.receiveCurrency ?? "KES";
  const receiveCountry = recipient?.countryCode ?? "KE";
  const isMomo = recipient?.accountType === "momo";

  // Hydrate from the store only when the saved entry still matches the current
  // corridor. A country edit changes the receive currency, so a stale amount
  // must not carry over — it starts empty instead.
  const storeMatchesCorridor = amountFromStore?.receiveCurrency === receiveCurrency;
  const [fiatAmount, setFiatAmount] = useState<number>(
    storeMatchesCorridor ? amountFromStore!.fiatAmount : 0,
  );
  const [accountName, setAccountName] = useState<string>(amountFromStore?.accountName ?? "");
  const [accountNumber, setAccountNumber] = useState<string>(
    amountFromStore?.accountNumber ?? "",
  );

  // Indicative "you send" preview only. The legacy fiat→USDC probe hit the
  // deprecated stateless quote endpoint (now a hard 410), which used to block
  // this step entirely. We now show a best-effort estimate from the public
  // FX snapshot (USD base ≈ USDC) and let the review step's stateful quote be
  // the single source of truth for the exact amount.
  const { data: fxRates } = useExchangeRates();
  const indicativeRate = fxRates?.rates?.[receiveCurrency];
  const estimatedUsdc =
    indicativeRate && indicativeRate > 0 && fiatAmount > 0
      ? fiatAmount / indicativeRate
      : null;

  const missingWallet = !walletAddress;
  const invalidAmount = !(fiatAmount > 0);

  const accountNumberLabel = isMomo
    ? "Recipient phone number"
    : "Recipient account number";
  const accountNumberPlaceholder = isMomo ? "0712 345 678" : "Account number";

  // Validation gates (min amount, balance, account-name length, momo phone
  // E.164, bank-account regex) removed for offramp testing — backend is the
  // source of truth. Continue only requires a wallet to pay from and a
  // non-zero fiat amount so the quote payload is structurally valid.
  const disableContinue = invalidAmount || missingWallet;

  function handleContinue() {
    if (disableContinue || !walletAddress) return;
    // Still normalize momo numbers to E.164 best-effort so the payload matches
    // what the aggregator expects, but don't gate on format here.
    const normalizedNumber = isMomo
      ? toE164(accountNumber, receiveCountry)
      : accountNumber.replace(/\s+/g, "");
    setAmount({
      sourceWalletAddress: walletAddress,
      tokenAddress: USDC_BASE.tokenAddress,
      tokenSymbol: USDC_BASE.symbol,
      network: USDC_BASE.chain,
      refundAddress: walletAddress,
      fiatAmount,
      // Derived by the review step from the live stateful quote — the old
      // step-2 probe against the deprecated stateless endpoint is gone.
      cryptoAmount: "",
      receiveCurrency,
      receiveCountry,
      accountName: accountName.trim(),
      accountNumber: normalizedNumber,
    });
    setPhase("payment-review");
  }

  return (
    <div className={cardClassName("space-y-4 p-4")}>
      <div className="rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 py-3 text-xs text-[#4D556D]">
        Recipient receives <span className="font-semibold text-[#1F2640]">{receiveCurrency}</span>{" "}
        via <span className="font-semibold text-[#1F2640]">{recipient?.paymentMethod ?? "—"}</span>
        {recipient?.bankName ? (
          <> to <span className="font-semibold text-[#1F2640]">{recipient.bankName}</span></>
        ) : null}
        . The live rate and final fees are confirmed on the next step.
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

      {/* They receive (fiat) + indicative USDC estimate */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs text-[#4D556D]">They receive</label>
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

        <div>
          <label className="mb-1.5 block text-xs text-[#4D556D]">
            You send (estimate)
          </label>
          <div className="flex h-[46px] items-center justify-between overflow-hidden rounded-xl border border-[#ECEEF4] bg-[#F3F4F8] px-4">
            <span className="text-sm font-semibold text-[#1F2640]">
              {estimatedUsdc !== null ? (
                <>≈ {formatToken(estimatedUsdc)}</>
              ) : (
                <span className="text-[#8E93A7]">Shown at review</span>
              )}
            </span>
            <span className="shrink-0 text-sm font-semibold text-[#4D556D]">
              {USDC_BASE.symbol}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#9298AC]">
            Indicative only — the exact amount is locked with the live quote on
            the next step.
          </p>
        </div>
      </div>

      {/* Destination account details (depend on the rail chosen in step 1) */}
      <div className="space-y-4 rounded-xl border border-[#ECEEF4] bg-white p-4">
        <p className="text-xs font-semibold text-[#1F2640]">
          {isMomo ? "Mobile money details" : "Bank account details"}
        </p>
        {!isMomo && recipient?.bankName ? (
          <p className="text-[11px] text-[#9298AC]">
            Paying out to <span className="font-semibold text-[#4D556D]">{recipient.bankName}</span>
            {" "}— enter the recipient&apos;s account at this bank.
          </p>
        ) : null}
        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">Account name</label>
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Name registered with the account"
            className="h-12 w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">{accountNumberLabel}</label>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={accountNumberPlaceholder}
            className="h-12 w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
          />
        </div>
      </div>

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
