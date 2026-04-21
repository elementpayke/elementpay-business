"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Wallet as WalletIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCreateWallet, usePrivy } from "@privy-io/react-auth";
import ConsolidatedBalanceCard from "@/components/wallets/ConsolidatedBalanceCard";
import CopyToast from "@/components/wallets/CopyToast";
import WalletDetailsPanel from "@/components/wallets/WalletDetailsPanel";
import WalletList from "@/components/wallets/WalletList";
import WalletsFxStrip from "@/components/wallets/WalletsFxStrip";
import WalletTransferModal from "@/components/wallets/WalletTransferModal";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { useCopyToClipboard } from "@/lib/wallets/useCopyToClipboard";

function NavButton({
  disabled = false,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7EAF3] bg-white text-[#6B7287] transition hover:-translate-y-0.5 hover:border-[#D9DEEC] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export default function WalletsPage() {
  const router = useRouter();
  const { ready, authenticated, linkWallet } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { wallets, selectedWallet, setSelectedWallet } = useSelectedWallet();
  const { copy, toast } = useCopyToClipboard();
  const [transferOpen, setTransferOpen] = useState(false);

  function handleConnectWallet() {
    linkWallet();
  }

  async function handleCreateWallet() {
    try {
      await createWallet();
    } catch (err) {
      console.error("[wallets] createWallet failed", err);
    }
  }

  function handleFundWallet(address: `0x${string}`) {
    setSelectedWallet(address);
    copy(address, "Wallet address copied — send USDC on Base here to fund");
  }

  function handleSendFromWallet(address: `0x${string}`) {
    setSelectedWallet(address);
    setTransferOpen(true);
  }

  // Privy is bridged to our session via PrivyAuthSync — `authenticated` here
  // becomes true silently once the RS256 JWT exchange completes.
  const privySyncing = !ready || !authenticated;
  const showEmpty = ready && authenticated && wallets.length === 0;

  return (
    <section className="space-y-6">
      <div className="border-b border-[#E8EBF3] pb-5">
        <div className="flex items-center gap-3">
          <NavButton onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </NavButton>
          <NavButton disabled>
            <ChevronRight className="h-4 w-4" />
          </NavButton>
          <h1 className="ml-1 text-[28px] font-semibold tracking-[-0.04em] text-[#171D32]">
            Wallets
          </h1>
        </div>
      </div>

      <WalletsFxStrip />

      <ConsolidatedBalanceCard wallets={wallets} />

      {privySyncing ? (
        <div className="rounded-2xl border border-dashed border-[#D5D9E6] bg-white p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" />
          <p className="mt-4 text-sm text-[#7E8498]">Preparing your wallets…</p>
        </div>
      ) : null}

      {showEmpty ? (
        <div className="rounded-2xl border border-dashed border-[#D5D9E6] bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100/60 text-primary-600">
            <WalletIcon className="h-5 w-5" />
          </div>
          <p className="mt-4 text-base font-semibold text-[#1A2138]">No wallets connected yet</p>
          <p className="mt-2 text-sm text-[#7E8498]">
            Create a Privy embedded wallet or link an external wallet (MetaMask, Coinbase, etc.) to start receiving and sending payments.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleConnectWallet}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#D5D9E6] bg-white px-5 text-sm font-semibold text-[#3F465E] transition hover:border-primary-300 hover:text-primary-700"
            >
              <WalletIcon className="h-4 w-4" />
              Add wallet
            </button>
            <button
              type="button"
              onClick={handleCreateWallet}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Create new wallet
            </button>
          </div>
        </div>
      ) : null}

      {ready && authenticated && wallets.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <WalletList
            onConnectWallet={handleConnectWallet}
            onCreateWallet={handleCreateWallet}
            onFundWallet={handleFundWallet}
            onSendFromWallet={handleSendFromWallet}
          />

          <WalletDetailsPanel wallet={selectedWallet} />
        </div>
      ) : null}

      <WalletTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        source={selectedWallet}
        ownedWallets={wallets}
      />

      <CopyToast message={toast.message} visible={toast.visible} />
    </section>
  );
}
