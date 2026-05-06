"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import WalletCard from "@/components/wallets/WalletCard";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";

type WalletListProps = {
  onConnectWallet: () => void;
  onCreateWallet: () => void;
  onFundWallet: (address: `0x${string}`) => void;
  onSendFromWallet?: (address: `0x${string}`) => void;
  onReceiveToWallet?: (address: `0x${string}`) => void;
};

export default function WalletList({
  onConnectWallet,
  onCreateWallet,
  onFundWallet,
  onSendFromWallet,
  onReceiveToWallet,
}: WalletListProps) {
  const router = useRouter();
  const { wallets, selectedWalletAddress, setSelectedWallet } = useSelectedWallet();

  // Guard against undefined entries during loading
  const safeWallets = wallets.filter(Boolean);

  return (
    <div className="space-y-3">
      {/* Section title — matches Figma "Your wallets" */}
      <p className="text-sm font-semibold text-foreground">Your wallets</p>

      {/* Create New Wallet button — Figma style */}
      <button
        type="button"
        onClick={onCreateWallet}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-3 py-3 text-sm font-medium text-foreground-muted transition hover:border-primary-300 hover:bg-surface-muted hover:text-primary-700"
      >
        <Plus className="h-4 w-4" />
        Create New Wallet
      </button>

      {/* Wallet cards */}
      <div className="space-y-3">
        {safeWallets.map((wallet) => (
          <WalletCard
            key={wallet.address}
            wallet={wallet}
            active={wallet.address === selectedWalletAddress}
            onSelect={() => setSelectedWallet(wallet.address)}
            onReceive={() => {
              setSelectedWallet(wallet.address);
              onFundWallet(wallet.address);
              onReceiveToWallet?.(wallet.address);
            }}
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