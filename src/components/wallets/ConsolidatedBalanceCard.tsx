"use client";

import { RefreshCw } from "lucide-react";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import type { LiveWallet } from "@/lib/wallets/types";

type ConsolidatedBalanceCardProps = {
  wallets: LiveWallet[];
  /** True when the balance source (dashboard summary) failed to load. */
  balanceError?: boolean;
  /** Retry the balance fetch. */
  onRetryBalance?: () => void;
  /** True while a balance retry is in flight. */
  isRetrying?: boolean;
};

export default function ConsolidatedBalanceCard({
  wallets,
  balanceError = false,
  onRetryBalance,
  isRetrying = false,
}: ConsolidatedBalanceCardProps) {
  const { formatMoneyFromUsd, selectedCurrency } = useCurrency();
  const isLoading = wallets.length > 0 && wallets.some((w) => w.balance.isLoading);
  const totalUsd = wallets.reduce((sum, w) => sum + (w.balance.usd || 0), 0);
  const walletCount = wallets.length;

  return (
    <section className="rounded-2xl border border-[#ECEEF5] bg-white px-6 py-5">
      <p className="text-sm font-medium text-[#7B8196]">Total consolidated balance</p>
      <h2 className="mt-2 text-[34px] font-bold leading-none tracking-[-0.03em] text-[#1A2138]">
        {/* On a balance error, avoid showing a misleading $0.00 — the wallet is
            real, only the balance is unknown. */}
        {balanceError ? "—" : isLoading && totalUsd === 0 ? "-" : formatMoneyFromUsd(totalUsd)}
      </h2>
      {balanceError ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-[#8E93A7]">
          <span>Balance unavailable</span>
          {onRetryBalance ? (
            <button
              type="button"
              disabled={isRetrying}
              onClick={onRetryBalance}
              className="inline-flex items-center gap-1 font-semibold text-primary-600 transition hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Retrying" : "Retry"}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#8E93A7]">
          Across {walletCount} wallet{walletCount === 1 ? "" : "s"} · USDC on Base · Displaying in{" "}
          {selectedCurrency}
        </p>
      )}
    </section>
  );
}
