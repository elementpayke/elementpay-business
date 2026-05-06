"use client";

import { Plus, Wallet as WalletIcon } from "lucide-react";
import Skeleton from "@/components/dashboard/Skeleton";

export function ConsolidatedBalanceSkeleton() {
  return (
    <section
      className="
        rounded-2xl border px-6 py-5 transition-colors
        border-border bg-surface-muted
      "
    >
      <p className="text-sm font-medium text-foreground-muted">
        Total consolidated balance
      </p>

      <Skeleton className="mt-3 h-7 w-48" />
      <Skeleton className="mt-3 h-3.5 w-44" />
    </section>
  );
}

function WalletCardSkeleton() {
  return (
    <div
      className="
        rounded-xl border p-4 transition-colors
        border-border bg-surface
      "
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton rounded="full" className="h-7 w-7" />

          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>

        <Skeleton rounded="full" className="h-5 w-14" />
      </div>

      <p className="mt-4 text-xs text-foreground-muted">
        Wallet balance:
      </p>

      <div className="mt-1 flex items-baseline gap-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-8" />
      </div>

      <Skeleton className="mt-2 h-3 w-40" />

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function WalletListSkeleton() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">
        Your wallets
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div
          className="
            flex items-center justify-center gap-2 rounded-lg border border-dashed
            px-3 py-3 text-sm font-semibold
            border-border bg-surface text-foreground-muted
          "
        >
          <WalletIcon className="h-4 w-4" />
          Add wallet
        </div>

        <div
          className="
            flex items-center justify-center gap-2 rounded-lg border border-dashed
            px-3 py-3 text-sm font-semibold
            border-primary-200 bg-primary-100/40 text-primary-500/60
          "
        >
          <Plus className="h-4 w-4" />
          Create new wallet
        </div>
      </div>

      <div className="space-y-3">
        <WalletCardSkeleton />
        <WalletCardSkeleton />
      </div>
    </div>
  );
}

function FieldRowSkeleton({
  label,
  valueWidth,
}: {
  label: string;
  valueWidth: string;
}) {
  return (
    <div
      className="
        flex items-center justify-between gap-4 rounded-lg px-4 py-3
        bg-surface
      "
    >
      <span className="text-sm text-foreground-muted">
        {label}
      </span>

      <Skeleton className={`h-3.5 ${valueWidth}`} />
    </div>
  );
}

export function WalletDetailsPanelSkeleton() {
  return (
    <div
      className="
        rounded-2xl border transition-colors
        border-border bg-surface-muted
      "
    >
      <div className="border-b border-border px-6 pt-5 pb-4">
        <h2 className="text-base font-semibold text-foreground">
          Wallet Details
        </h2>

        <div className="mt-3 flex items-center gap-6 text-sm">
          {[
            "Account details",
            "Beneficiaries",
            "Transactions",
          ].map((tab, i) => (
            <span
              key={tab}
              className={
                i === 0
                  ? "border-b-2 border-primary-500 pb-2 font-semibold text-primary-600"
                  : "pb-2 text-foreground-muted"
              }
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            On-chain account
          </h3>

          <div className="space-y-2">
            <FieldRowSkeleton
              label="Wallet label"
              valueWidth="w-32"
            />
            <FieldRowSkeleton
              label="Wallet kind"
              valueWidth="w-20"
            />
            <FieldRowSkeleton
              label="Connector"
              valueWidth="w-28"
            />
            <FieldRowSkeleton
              label="Address"
              valueWidth="w-36"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Funding tokens
          </h3>

          <div className="space-y-2">
            <FieldRowSkeleton
              label="USDC · Base"
              valueWidth="w-24"
            />
          </div>

          <p className="text-xs text-foreground-muted">
            Send USDC on Base to this address to top up your
            wallet. USDC is a 1:1 USD stablecoin.
          </p>
        </div>
      </div>
    </div>
  );
}