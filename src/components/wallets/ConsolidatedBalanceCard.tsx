"use client";

import type { LiveWallet } from "@/lib/wallets/types";

type ConsolidatedBalanceCardProps = {
  wallets: LiveWallet[];
};

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ConsolidatedBalanceCard({ wallets }: ConsolidatedBalanceCardProps) {
  const isLoading = wallets.length > 0 && wallets.some((w) => w.balance.isLoading);
  const totalUsd = wallets.reduce((sum, w) => sum + (w.balance.usd || 0), 0);
  const walletCount = wallets.length;

  return (
    <section className="rounded-2xl border border-[#ECEEF5] bg-white px-6 py-5">
      <p className="text-sm font-medium text-[#7B8196]">Total consolidated balance</p>
      <h2 className="mt-2 text-[34px] font-bold leading-none tracking-[-0.03em] text-[#1A2138]">
        {isLoading && totalUsd === 0 ? "—" : usdFormatter.format(totalUsd)}
      </h2>
      <p className="mt-3 text-sm text-[#8E93A7]">
        Across {walletCount} wallet{walletCount === 1 ? "" : "s"} · USDC on Base
      </p>
    </section>
  );
}
