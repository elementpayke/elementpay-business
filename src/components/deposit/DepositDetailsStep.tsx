"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Flag from "@/components/dashboard/Flag";
import { validateKenyanPhoneNumber } from "@/lib/phoneValidation";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { useLiveWallets } from "@/lib/wallets/useLiveWallets";
import { tokensForWallet } from "@/lib/wallets/supportedTokens";
import { fetchOrderQuote } from "@/lib/aggregator";
import type { LiveWallet } from "@/lib/wallets/types";
import { useDepositStore, type DepositCurrency } from "@/stores/depositStore";
import DepositDropdown from "./DepositDropdown";
import PaymentMethodSelector from "./PaymentMethodSelector";
import { isBankTransferValid } from "./BankTransferForm";

type FlagCode = "KE" | "NG" | "GH" | "US";

type CurrencyOption = {
  code: Exclude<DepositCurrency, null>;
  name: string;
  flag: FlagCode;
};

const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "KES", name: "Kenyan Shillings", flag: "KE" },
  { code: "NGN", name: "Nigerian Naira", flag: "NG" },
  { code: "GHS", name: "Ghanaian Cedis", flag: "GH" },
  { code: "USD", name: "US Dollar", flag: "US" },
];

export default function DepositDetailsStep() {
  const { wallets } = useLiveWallets();
  const { selectedWallet } = useSelectedWallet();
  const { formatMoney, usdKesRate } = useCurrency();

  const store = useDepositStore();
  const {
    selectedWalletAddress,
    selectedWalletLabel,
    selectedTokenAddress,
    selectedCurrency,
    amountFiat,
    paymentMethod,
    phoneNumber,
    savePhone,
    cardDetails,
    setWallet,
    setCurrency,
    setAmount,
    setPaymentMethod,
    setPhoneNumber,
    setSavePhone,
    updateCardDetails,
    setPhase,
  } = store;

  const [amountInput, setAmountInput] = useState<string>(
    amountFiat > 0 ? String(amountFiat) : "",
  );
  const [usdEquivalent, setUsdEquivalent] = useState<number | null>(null);

  const hiddenAmountRef = useRef<HTMLInputElement | null>(null);

  // Seed wallet from the globally-selected wallet once.
  useEffect(() => {
    if (selectedWalletAddress) return;
    if (!selectedWallet) return;
    const token = tokensForWallet(selectedWallet.kind === "embedded")[0];
    if (!token) return;
    setWallet(selectedWallet.address, selectedWallet.label, token.tokenAddress);
  }, [selectedWallet, selectedWalletAddress, setWallet]);

  const handleWalletPick = (wallet: LiveWallet) => {
    const token = tokensForWallet(wallet.kind === "embedded")[0];
    if (!token) return;
    setWallet(wallet.address, wallet.label, token.tokenAddress);
  };

  const handleCurrencyPick = (option: CurrencyOption) => {
    setCurrency(option.code);
  };

  const selectedCurrencyOption = useMemo(
    () => CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency) ?? null,
    [selectedCurrency],
  );

  const selectedWalletOption = useMemo(
    () => wallets.find((w) => w.address.toLowerCase() === selectedWalletAddress?.toLowerCase()) ?? null,
    [wallets, selectedWalletAddress],
  );

  // Debounced quote fetch → USD equivalent
  useEffect(() => {
    if (
      !selectedCurrency ||
      !selectedWalletAddress ||
      !selectedTokenAddress ||
      !Number.isFinite(amountFiat) ||
      amountFiat <= 0
    ) {
      setUsdEquivalent(null);
      return;
    }

    let cancelled = false;

    const handle = setTimeout(async () => {
      try {
        const quote = await fetchOrderQuote({
          amountFiat,
          tokenAddress: selectedTokenAddress,
          walletAddress: selectedWalletAddress,
          orderType: 0,
          currency: selectedCurrency,
        });
        if (cancelled) return;
        // Assume token is a USD stablecoin → required_token_amount ≈ USD value.
        setUsdEquivalent(quote.data.required_token_amount);
      } catch {
        if (cancelled) return;
        if (selectedCurrency === "KES" && usdKesRate > 0) {
          setUsdEquivalent(amountFiat / usdKesRate);
        } else if (selectedCurrency === "USD") {
          setUsdEquivalent(amountFiat);
        } else {
          setUsdEquivalent(null);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [amountFiat, selectedCurrency, selectedWalletAddress, selectedTokenAddress, usdKesRate]);

  const paymentMethodSectionVisible = Boolean(
    selectedWalletAddress && selectedCurrency && amountFiat > 0,
  );

  const isMethodValid = (() => {
    if (!paymentMethod) return false;
    if (paymentMethod === "mpesa-mobile") {
      return validateKenyanPhoneNumber(`254${phoneNumber}`).isValid;
    }
    if (paymentMethod === "mpesa-paybill") return true;
    if (paymentMethod === "bank-transfer") return isBankTransferValid(cardDetails);
    return false;
  })();

  const canSubmit = Boolean(
    selectedWalletAddress && selectedCurrency && amountFiat > 0 && isMethodValid,
  );

  const fxRateLine = (() => {
    if (!selectedCurrency) return null;
    if (selectedCurrency === "KES") {
      return `1 US Dollar = ${usdKesRate.toFixed(2)} Kenyan Shillings`;
    }
    if (selectedCurrency === "USD") {
      return "Deposits in USD are credited 1:1 to your wallet";
    }
    return "Live FX rate provided on confirmation";
  })();

  return (
    <div className="space-y-4">
      <div className="space-y-5 rounded-xl border border-[#ECEEF5] bg-white p-6">
        {/* Wallet dropdown */}
        <DepositDropdown<LiveWallet>
          label="What wallet would you like to fund?"
          placeholder="Select a wallet"
          selected={selectedWalletOption}
          options={wallets}
          onSelect={handleWalletPick}
          getOptionKey={(w) => w.address}
          renderTriggerValue={(w) => (
            <span className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold text-[#1A2138]">{w.label}</span>
              <span className="text-xs text-[#7E8498]">
                {formatMoney(w.balance.usd, "USD")}
              </span>
            </span>
          )}
          renderOption={(w) => (
            <span className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold text-[#1A2138]">{w.label}</span>
              <span className="text-xs text-[#7E8498]">
                {formatMoney(w.balance.usd, "USD")}
              </span>
            </span>
          )}
        />

        {/* Currency dropdown */}
        <div className="space-y-1">
          <DepositDropdown<CurrencyOption>
            label="What currency do you want to fund your wallet with?"
            placeholder="Select a currency"
            selected={selectedCurrencyOption}
            options={CURRENCY_OPTIONS}
            onSelect={handleCurrencyPick}
            getOptionKey={(o) => o.code}
            renderTriggerValue={(o) => (
              <span className="flex items-center gap-2.5">
                <Flag code={o.flag} size={20} />
                <span className="text-sm font-medium text-[#1A2138]">{o.name}</span>
                <span className="text-xs text-[#7E8498]">({o.code})</span>
              </span>
            )}
            renderOption={(o) => (
              <span className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <Flag code={o.flag} size={22} />
                  <span className="text-sm font-medium text-[#1A2138]">{o.name}</span>
                </span>
                <span className="text-xs font-semibold text-[#7E8498]">{o.code}</span>
              </span>
            )}
          />
          {fxRateLine ? (
            <p className="mt-2 text-sm font-medium text-primary-500">{fxRateLine}</p>
          ) : null}
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#4D556D]">
            How much would you like to deposit?
          </label>
          <div
            className="cursor-text rounded-xl border border-[#ECEEF5] bg-[#FAFBFE] px-6 py-5 text-center"
            onClick={() => hiddenAmountRef.current?.focus()}
          >
            <p className="text-xs uppercase tracking-wider text-[#7E8498]">
              {selectedCurrency ?? "Currency"}
            </p>
            <p className="mt-1 text-4xl font-bold text-[#1A2138]">
              {amountInput
                ? Number(amountInput).toLocaleString("en-US", { maximumFractionDigits: 2 })
                : "0"}
            </p>
            <input
              ref={hiddenAmountRef}
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[^0-9.]/g, "");
                const parts = sanitized.split(".");
                const trimmed =
                  parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : sanitized;
                setAmountInput(trimmed);
                const n = Number(trimmed);
                setAmount(Number.isFinite(n) ? n : 0);
              }}
              className="h-0 w-0 opacity-0"
              aria-label="Deposit amount"
            />
            <p className="mt-2 text-sm text-[#9CA3B6]">
              {usdEquivalent !== null
                ? `USD ${usdEquivalent.toFixed(2)}`
                : amountFiat > 0
                  ? "USD —"
                  : "USD 0.00"}
            </p>
          </div>
        </div>

        {paymentMethodSectionVisible && selectedCurrency ? (
          <PaymentMethodSelector
            currency={selectedCurrency}
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            phoneNumber={phoneNumber}
            onPhoneChange={setPhoneNumber}
            savePhone={savePhone}
            onSavePhoneChange={setSavePhone}
            cardDetails={cardDetails}
            onCardDetailsChange={updateCardDetails}
          />
        ) : null}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setPhase("confirm-deposit")}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Confirm deposit
        </button>
      </div>
    </div>
  );
}
