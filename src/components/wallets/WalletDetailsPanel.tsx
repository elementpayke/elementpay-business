"use client";

import { useState } from "react";
import AccountRails from "@/components/wallets/AccountRails";
import BeneficiariesTable from "@/components/wallets/BeneficiariesTable";
import CopyToast from "@/components/wallets/CopyToast";
import WalletTabs, { type WalletTabKey } from "@/components/wallets/WalletTabs";
import WalletTransactionsList from "@/components/wallets/WalletTransactionsList";
import { useCopyToClipboard } from "@/lib/wallets/useCopyToClipboard";
import type { LiveWallet } from "@/lib/wallets/types";

export default function WalletDetailsPanel({ wallet }: { wallet: LiveWallet | null }) {
  const [activeTab, setActiveTab] = useState<WalletTabKey>("account");
  const { copy, toast } = useCopyToClipboard();

  if (!wallet) {
    return (
      <div className="rounded-2xl border border-[#ECEEF5] bg-white p-8 text-center text-sm text-[#7E8498]">
        Select a wallet on the left to see its details.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#ECEEF5] bg-white">
      <div className="border-b border-[#ECEEF5] px-6 pt-5">
        <h2 className="text-base font-semibold text-[#1C2238]">Wallet Details</h2>
        <div className="mt-3">
          <WalletTabs active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <div className="px-6 py-6">
        {activeTab === "account" ? <AccountRails wallet={wallet} copy={copy} /> : null}
        {activeTab === "beneficiaries" ? <BeneficiariesTable beneficiaries={[]} /> : null}
        {activeTab === "transactions" ? <WalletTransactionsList transactions={[]} /> : null}
      </div>

      <CopyToast message={toast.message} visible={toast.visible} />
    </div>
  );
}
