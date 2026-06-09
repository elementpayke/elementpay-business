"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Wallet2 } from "lucide-react";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { tokensForWallet } from "@/lib/wallets/supportedTokens";
import { shortAddress } from "@/lib/wallets/wallet-selection";
import { useExchangeRates } from "@/lib/dashboard/hooks";
import {
  useCatalogDirection,
  type CatalogCountryOption,
} from "@/lib/catalog/useCatalog";
import {
  useDepositStore,
  type DepositPaymentMethod,
  type DepositProvider,
} from "@/stores/depositStore";
import DepositDropdown from "./DepositDropdown";
import PaymentMethodSelector from "./PaymentMethodSelector";

export default function DepositDetailsStep() {
  const { selectedWallet } = useSelectedWallet();
  const { formatMoney } = useCurrency();

  // Deposit = fund crypto with fiat = on-ramp corridor.
  const { countries, getMethods, isLoading: catalogLoading, error: catalogError } =
    useCatalogDirection("onramp");
  const { data: rates } = useExchangeRates();

  const store = useDepositStore();
  const {
    selectedWalletAddress,
    selectedCurrency,
    selectedCountry,
    amountFiat,
    paymentMethod,
    selectedProvider,
    phoneNumber,
    accountName,
    setWallet,
    setCurrency,
    setAmount,
    setPaymentMethod,
    setProvider,
    setPhoneNumber,
    setAccountName,
    setPhase,
  } = store;

  const [amountInput, setAmountInput] = useState<string>(
    amountFiat > 0 ? String(amountFiat) : "",
  );

  const hiddenAmountRef = useRef<HTMLInputElement | null>(null);

  // Users have exactly one wallet — auto-bind it as the funding source.
  useEffect(() => {
    if (selectedWalletAddress) return;
    if (!selectedWallet) return;
    const token = tokensForWallet(selectedWallet.kind === "embedded")[0];
    if (!token) return;
    setWallet(selectedWallet.address, selectedWallet.label, token.tokenAddress, token.chain);
  }, [selectedWallet, selectedWalletAddress, setWallet]);

  const handleCountryPick = (option: CatalogCountryOption) => {
    setCurrency(option.currency, option.code);
  };

  const handleSelectProvider = (
    method: Exclude<DepositPaymentMethod, null>,
    provider: DepositProvider,
  ) => {
    if (paymentMethod !== method) setPaymentMethod(method);
    setProvider(provider);
  };

  const selectedCountryOption = useMemo(
    () => countries.find((c) => c.code === selectedCountry) ?? null,
    [countries, selectedCountry],
  );

  const methods = useMemo(
    () => getMethods(selectedCountry),
    [getMethods, selectedCountry],
  );

  // Indicative rate (USD→local) from the shared FX feed. Binding rate is the
  // quote on the next step; this is just to set expectations on selection.
  const indicativeRate = useMemo(() => {
    if (!rates || !selectedCurrency) return null;
    const r = rates.rates?.[selectedCurrency];
    return typeof r === "number" && Number.isFinite(r) ? r : null;
  }, [rates, selectedCurrency]);

  const paymentMethodSectionVisible = Boolean(
    selectedWalletAddress && selectedCurrency && amountFiat > 0 && methods.length > 0,
  );

  const isMethodValid = (() => {
    if (!paymentMethod || !selectedProvider) return false;
    if (paymentMethod === "momo") {
      return phoneNumber.trim().length > 0 && accountName.trim().length > 0;
    }
    // bank: the user pushes money to our receiving account — picking the
    // receiving bank (provider) is all we need to capture here.
    return true;
  })();

  const canSubmit = Boolean(
    selectedWalletAddress && selectedCurrency && amountFiat > 0 && isMethodValid,
  );

  return (
    <div className="space-y-4">
      <div className="space-y-5 rounded-xl border border-[#ECEEF5] bg-white p-6">
        {/* Single-wallet funding source — read-only. */}
        <div>
          <p className="mb-1.5 block text-sm font-medium text-[#4D556D]">
            Funding wallet
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-[#ECEEF5] bg-[#FAFBFE] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Wallet2 className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[#1A2138]">
                {selectedWallet?.label ?? "ElementPay Wallet"}
              </span>
              <span className="block text-[11px] text-[#9298AC]">
                {selectedWallet ? shortAddress(selectedWallet.address) : "Provisioning…"}
              </span>
            </span>
            {selectedWallet ? (
              <span className="text-xs font-medium text-[#7E8498]">
                {formatMoney(selectedWallet.balance.usd, "USD")}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          {catalogError ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#F5B5B3] bg-[#FFF4F3] px-4 py-3 text-xs text-[#A1352F]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Couldn&apos;t load supported countries. Refresh and try again.
            </div>
          ) : (
            <DepositDropdown<CatalogCountryOption>
              label="What currency do you want to fund your wallet with?"
              placeholder={catalogLoading ? "Loading countries…" : "Select a country"}
              disabled={catalogLoading || countries.length === 0}
              selected={selectedCountryOption}
              options={countries}
              onSelect={handleCountryPick}
              getOptionKey={(o) => o.code}
              renderTriggerValue={(o) => (
                <span className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">{o.flag}</span>
                  <span className="text-sm font-medium text-[#1A2138]">{o.name}</span>
                  <span className="text-xs text-[#7E8498]">({o.currency})</span>
                </span>
              )}
              renderOption={(o) => (
                <span className="flex w-full items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{o.flag}</span>
                    <span className="text-sm font-medium text-[#1A2138]">{o.name}</span>
                  </span>
                  <span className="text-xs font-semibold text-[#7E8498]">{o.currency}</span>
                </span>
              )}
            />
          )}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#7E8498]">
            {catalogLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {indicativeRate
              ? `Indicative rate: 1 USD ≈ ${indicativeRate.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${selectedCurrency}. Binding rate is shown on the confirmation step.`
              : "Live FX rate and fees are provided on the confirmation step."}
          </p>
        </div>

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
          </div>
        </div>

        {paymentMethodSectionVisible && selectedCurrency ? (
          <PaymentMethodSelector
            methods={methods}
            selectedMethod={paymentMethod}
            selectedProvider={selectedProvider}
            onSelectProvider={handleSelectProvider}
            phoneNumber={phoneNumber}
            onPhoneChange={setPhoneNumber}
            accountName={accountName}
            onAccountNameChange={setAccountName}
          />
        ) : null}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setPhase("confirm-deposit")}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Continue to review
        </button>
      </div>
    </div>
  );
}
