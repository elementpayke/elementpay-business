"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { SupportedCurrency } from "@/lib/currency/config";

type CurrencyContextValue = {
  selectedCurrency: SupportedCurrency;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  usdKesRate: number;
  lastUpdated: string | null;
  isRefreshing: boolean;
  convertFromUsd: (amountUsd: number) => number;
  formatMoneyFromUsd: (amountUsd: number, options?: Intl.NumberFormatOptions) => string;
  formatMoney: (
    amount: number,
    currency?: SupportedCurrency,
    options?: Intl.NumberFormatOptions,
  ) => string;
};

const STORAGE_KEY = "elementpay-display-currency";
const DEFAULT_RATE = 129;

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function formatMoney(
  amount: number,
  currency: SupportedCurrency,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<SupportedCurrency>(() => {
    if (typeof window === "undefined") return "USD";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "USD" || stored === "KES" ? stored : "USD";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, selectedCurrency);
  }, [selectedCurrency]);

  const usdKesRate = DEFAULT_RATE;

  function setSelectedCurrency(currency: SupportedCurrency) {
    setSelectedCurrencyState(currency);
  }

  function convertFromUsd(amountUsd: number) {
    return selectedCurrency === "KES" ? amountUsd * usdKesRate : amountUsd;
  }

  function formatMoneyFromUsd(amountUsd: number, options?: Intl.NumberFormatOptions) {
    return formatMoney(convertFromUsd(amountUsd), selectedCurrency, options);
  }

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setSelectedCurrency,
        usdKesRate,
        lastUpdated: null,
        isRefreshing: false,
        convertFromUsd,
        formatMoneyFromUsd,
        formatMoney: (amount, currency = selectedCurrency, options) =>
          formatMoney(amount, currency, options),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
