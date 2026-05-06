"use client";

import { useState } from "react";
import AccountRails from "@/components/wallets/AccountRails";
import BeneficiariesTable from "@/components/wallets/BeneficiariesTable";
import CopyToast from "@/components/wallets/CopyToast";
import WalletTabs, { type WalletTabKey } from "@/components/wallets/WalletTabs";
import WalletTransactionsList from "@/components/wallets/WalletTransactionsList";
import { useCopyToClipboard } from "@/lib/wallets/useCopyToClipboard";
import type { LiveWallet } from "@/lib/wallets/types";

export default function WalletDetailsPanel({
  wallet,
}: {
  wallet: LiveWallet | null;
}) {
  const [activeTab, setActiveTab] = useState<WalletTabKey>("account");
  const { copy, toast } = useCopyToClipboard();

  if (!wallet) {
    return (
      <div className="rounded-2xl border border-border bg-surface-muted p-8 text-center text-sm text-foreground-muted">
        Select a wallet on the left to see its details.
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface-muted overflow-hidden">

      {/* HEADER */}
      <div className="border-b border-border px-6 pt-5 pb-3 bg-surface-muted">
        <h2 className="text-sm font-semibold text-foreground">
          Wallet Details
        </h2>

        <div className="mt-3">
          <WalletTabs active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === "account" && (
          <AccountRails wallet={wallet} copy={copy} />
        )}

        {activeTab === "beneficiaries" && (
          <BeneficiariesTable beneficiaries={[]} />
        )}

        {activeTab === "transactions" && (
          <WalletTransactionsList transactions={[]} />
        )}
      </div>

      <CopyToast message={toast.message} visible={toast.visible} />
    </div>
  );
}