"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CurrencyRateSnapshot, SupportedCurrency } from "@/lib/currency/config";

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
const FALLBACK_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

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
  const [snapshot, setSnapshot] = useState<CurrencyRateSnapshot | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        setIsRefreshing(true);
        const response = await fetch("/api/currency", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Currency request failed (${response.status})`);
        }

        const nextSnapshot = (await response.json()) as CurrencyRateSnapshot;
        if (cancelled) return;

        startTransition(() => {
          setSnapshot(nextSnapshot);
        });
      } catch (error) {
        if (!cancelled) {
          console.warn("[currency] failed to refresh rates", error);
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    }

    loadRates();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const refreshIntervalMs = snapshot?.refreshIntervalMs ?? FALLBACK_REFRESH_INTERVAL_MS;
    intervalRef.current = setInterval(() => {
      void (async () => {
        try {
          setIsRefreshing(true);
          const response = await fetch("/api/currency", { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`Currency request failed (${response.status})`);
          }

          const nextSnapshot = (await response.json()) as CurrencyRateSnapshot;
          startTransition(() => {
            setSnapshot(nextSnapshot);
          });
        } catch (error) {
          console.warn("[currency] failed to refresh rates", error);
        } finally {
          setIsRefreshing(false);
        }
      })();
    }, refreshIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [snapshot?.refreshIntervalMs]);

  const usdKesRate = snapshot?.quotes.KES ?? DEFAULT_RATE;

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
        lastUpdated: snapshot?.fetchedAt ?? null,
        isRefreshing,
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
