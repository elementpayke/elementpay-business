"use client";

import { Plus, Wallet as WalletIcon } from "lucide-react";
import Skeleton from "@/components/dashboard/Skeleton";

export function ConsolidatedBalanceSkeleton() {
  return (
    <section className="rounded-2xl border border-[#ECEEF5] bg-white px-6 py-5">
      <p className="text-sm font-medium text-[#7B8196]">Total consolidated balance</p>
      <Skeleton className="mt-3 h-9 w-56" />
      <Skeleton className="mt-3 h-3.5 w-44" />
    </section>
  );
}

function WalletCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#ECEEF5] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton rounded="full" className="h-7 w-7" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <Skeleton rounded="full" className="h-4 w-16" />
      </div>

      <p className="mt-4 text-xs text-[#8D92A6]">Wallet balance:</p>
      <div className="mt-1 flex items-baseline gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="mt-2 h-3 w-40" />

      <div className="mt-4 flex items-center gap-4 border-t border-[#ECEEF5] pt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function WalletListSkeleton() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#1C2238]">Your wallets</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#D5D9E6] bg-white px-3 py-3 text-sm font-semibold text-[#3F465E]/60">
          <WalletIcon className="h-4 w-4" />
          Add wallet
        </div>
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary-200 bg-primary-100/30 px-3 py-3 text-sm font-semibold text-primary-500/60">
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

function FieldRowSkeleton({ label, valueWidth }: { label: string; valueWidth: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-[#FAFBFE] px-4 py-3">
      <span className="text-sm text-[#7E8498]">{label}</span>
      <Skeleton className={`h-3.5 ${valueWidth}`} />
    </div>
  );
}

export function WalletDetailsPanelSkeleton() {
  return (
    <div className="rounded-2xl border border-[#ECEEF5] bg-white">
      <div className="border-b border-[#ECEEF5] px-6 pt-5 pb-4">
        <h2 className="text-base font-semibold text-[#1C2238]">Wallet Details</h2>
        <div className="mt-3 flex items-center gap-6 text-sm">
          {["Account", "Beneficiaries", "Transactions"].map((tab, i) => (
            <span
              key={tab}
              className={
                i === 0
                  ? "font-semibold text-primary-600 border-b-2 border-primary-500 pb-2"
                  : "text-[#81879A] pb-2"
              }
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1C2238]">On-chain account</h3>
          <div className="space-y-2">
            <FieldRowSkeleton label="Wallet label" valueWidth="w-32" />
            <FieldRowSkeleton label="Wallet kind" valueWidth="w-20" />
            <FieldRowSkeleton label="Connector" valueWidth="w-28" />
            <FieldRowSkeleton label="Address" valueWidth="w-36" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1C2238]">Funding tokens</h3>
          <div className="space-y-2">
            <FieldRowSkeleton label="USDC · Base" valueWidth="w-24" />
          </div>
          <p className="text-xs text-[#8E93A7]">
            Send USDC on Base to this address to top up your wallet. USDC is a 1:1 USD stablecoin.
          </p>
        </div>
      </div>
    </div>
  );
}
