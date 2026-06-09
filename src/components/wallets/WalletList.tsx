"use client";

import { useRouter } from "next/navigation";
import WalletCard from "@/components/wallets/WalletCard";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";

type WalletListProps = {
  onFundWallet: (address: `0x${string}`) => void;
  onSendFromWallet?: (address: `0x${string}`) => void;
  onReceiveToWallet?: (address: `0x${string}`) => void;
};

export default function WalletList({
  onFundWallet,
  onSendFromWallet,
  onReceiveToWallet,
}: WalletListProps) {
  const router = useRouter();
  const { wallets, selectedWalletAddress, setSelectedWallet } = useSelectedWallet();

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#1C2238]">Your wallets</p>

      <div className="space-y-3">
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.address}
            wallet={wallet}
            active={wallet.address === selectedWalletAddress}
            onSelect={() => setSelectedWallet(wallet.address)}
            onFund={() => onFundWallet(wallet.address)}
            onReceive={
              onReceiveToWallet
                ? () => {
                    setSelectedWallet(wallet.address);
                    onReceiveToWallet(wallet.address);
                  }
                : undefined
            }
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
