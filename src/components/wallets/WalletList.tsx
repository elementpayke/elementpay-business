"use client";

import { Plus, Wallet as WalletIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import WalletCard from "@/components/wallets/WalletCard";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";

type WalletListProps = {
  onConnectWallet: () => void;
  onCreateWallet: () => void;
  onFundWallet: (address: `0x${string}`) => void;
  onSendFromWallet?: (address: `0x${string}`) => void;
};

export default function WalletList({
  onConnectWallet,
  onCreateWallet,
  onFundWallet,
  onSendFromWallet,
}: WalletListProps) {
  const router = useRouter();
  const { wallets, selectedWalletAddress, setSelectedWallet } = useSelectedWallet();

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#1C2238]">Your wallets</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onConnectWallet}
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#D5D9E6] bg-white px-3 py-3 text-sm font-semibold text-[#3F465E] transition hover:border-primary-300 hover:bg-primary-100/30 hover:text-primary-700"
        >
          <WalletIcon className="h-4 w-4" />
          Add wallet
        </button>
        <button
          type="button"
          onClick={onCreateWallet}
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary-200 bg-primary-100/40 px-3 py-3 text-sm font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-100/70"
        >
          <Plus className="h-4 w-4" />
          Create new wallet
        </button>
      </div>

      <div className="space-y-3">
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.address}
            wallet={wallet}
            active={wallet.address === selectedWalletAddress}
            onSelect={() => setSelectedWallet(wallet.address)}
            onFund={() => onFundWallet(wallet.address)}
            onSend={() => {
              setSelectedWallet(wallet.address);
              if (onSendFromWallet) {
                onSendFromWallet(wallet.address);
              } else {
                router.push("/dashboard/send-payment");
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
