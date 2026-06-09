"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, RefreshCw } from "lucide-react";
import Skeleton from "@/components/dashboard/Skeleton";
import { useBusinessWallet } from "@/lib/wallets/useBusinessWallet";
import { useExchangeRates } from "@/lib/dashboard/hooks";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatKes(value: number): string {
  return `KES ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export default function WalletSummaryCard() {
  const { wallet, isLoading, kybBlocked, error, retryWallet, isRetrying } = useBusinessWallet();
  const { data: fx } = useExchangeRates();
  const [hidden, setHidden] = useState(false);

  const balanceUsd = wallet ? Number(wallet.balance_usd) || 0 : 0;
  const kesRate = fx?.rates.KES ?? null;
  const balanceKes = kesRate != null ? balanceUsd * kesRate : null;
  const walletUnavailable = Boolean(error || (wallet && !wallet.is_provisioned));

  return (
    <section>
      <div className="relative min-h-[220px] overflow-hidden rounded-[20px] border border-border bg-surface-muted px-6 py-5">
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground-muted">
              ElementPay Wallet
            </p>
          </div>

          <p className="mt-3 text-xs text-foreground-muted">Wallet balance:</p>

          {isLoading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : kybBlocked ? (
            <WalletKybBlocked />
          ) : walletUnavailable ? (
            <WalletError
              isRetrying={isRetrying}
              onRetry={() => void retryWallet()}
            />
          ) : (
            <>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <h2 className="text-[28px] font-bold leading-none tracking-[-0.03em] text-foreground sm:text-[34px]">
                  {hidden ? "•••••" : formatKes(balanceKes ?? balanceUsd)}
                </h2>
                <button
                  type="button"
                  onClick={() => setHidden((v) => !v)}
                  className="inline-flex items-center gap-1 text-sm text-primary-600 transition hover:text-primary-700"
                >
                  {hidden ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  {hidden ? "Show balance" : "Hide balance"}
                </button>
              </div>

              <p className="mt-2 text-sm text-foreground-muted">
                {hidden ? "•••••" : `~ ${formatUsd(balanceUsd)}`}
              </p>

              {kesRate != null ? (
                <p className="mt-2 text-xs font-medium text-tertiary-600">
                  @ 1 US Dollar = {kesRate.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  Kenyan Shillings
                </p>
              ) : null}

              <Link
                href="/dashboard/wallets"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
              >
                View wallet details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-0 right-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/coin.svg" alt="" width={200} height={150} aria-hidden />
        </div>
      </div>
    </section>
  );
}

function WalletKybBlocked() {
  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm font-semibold text-foreground">
        Verification required
      </p>
      <p className="text-xs text-foreground-muted">
        Complete business verification to provision your wallet.
      </p>
      <Link
        href="/dashboard/verification"
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
      >
        Start verification
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function WalletError({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="mt-2 space-y-3">
      <p className="text-sm text-foreground-muted">
        Wallet temporarily unavailable. Please try again.
      </p>
      <button
        type="button"
        disabled={isRetrying}
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
        {isRetrying ? "Retrying" : "Retry"}
      </button>
    </div>
  );
}
