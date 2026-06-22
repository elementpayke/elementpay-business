"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConsolidatedBalanceCard from "@/components/wallets/ConsolidatedBalanceCard";
import CopyToast from "@/components/wallets/CopyToast";
import IbanAccountsList from "@/components/wallets/IbanAccountsList";
import ReceiveModal from "@/components/wallets/ReceiveModal";
import WalletDetailsPanel from "@/components/wallets/WalletDetailsPanel";
import WalletList from "@/components/wallets/WalletList";
import WalletsFxStrip from "@/components/wallets/WalletsFxStrip";
import WalletTransferModal from "@/components/wallets/WalletTransferModal";
import {
  ConsolidatedBalanceSkeleton,
  WalletDetailsPanelSkeleton,
  WalletListSkeleton,
} from "@/components/wallets/WalletsSkeleton";
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

function RetryWalletButton({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <button
      type="button"
      disabled={isRetrying}
      onClick={onRetry}
      className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
      {isRetrying ? "Retrying" : "Retry"}
    </button>
  );
}

export default function WalletsPage() {
  const router = useRouter();
  const {
    wallets,
    selectedWallet,
    setSelectedWallet,
    ready,
    authenticated,
    kybBlocked,
    walletError,
    retryWallet,
    isWalletRetrying,
  } = useSelectedWallet();
  const { copy, toast } = useCopyToClipboard();
  const [transferOpen, setTransferOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  function handleFundWallet(address: `0x${string}`) {
    setSelectedWallet(address);
    copy(address, "Wallet address copied — send USDC on Base here to fund");
  }

  function handleSendFromWallet(address: `0x${string}`) {
    setSelectedWallet(address);
    setTransferOpen(true);
  }

  const hasWallets = wallets.length > 0;
  const syncing = !ready || !authenticated;
  const showKybGate = ready && authenticated && kybBlocked;
  // The wallet itself comes from the login response; only its balance depends
  // on the dashboard summary. So a summary failure should NOT replace a
  // present wallet with the error panel — show the wallet, surface the error
  // only when there is nothing to display.
  const showWallets = ready && authenticated && !kybBlocked && hasWallets;
  const showWalletError =
    ready && authenticated && !kybBlocked && !hasWallets && Boolean(walletError);
  const showEmpty =
    ready && authenticated && !kybBlocked && !hasWallets && !walletError;

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

      {syncing || showKybGate ? (
        <ConsolidatedBalanceSkeleton />
      ) : (
        <ConsolidatedBalanceCard
          wallets={wallets}
          balanceError={showWallets && Boolean(walletError)}
          onRetryBalance={() => void retryWallet()}
          isRetrying={isWalletRetrying}
        />
      )}

      {syncing ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <WalletListSkeleton />
          <WalletDetailsPanelSkeleton />
        </div>
      ) : null}

      {showKybGate ? (
        <div className="rounded-2xl border border-dashed border-[#D5D9E6] bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100/60 text-primary-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-base font-semibold text-[#1A2138]">
            Complete verification to unlock your wallet
          </p>
          <p className="mt-2 text-sm text-[#7E8498]">
            Your ElementPay wallet activates as soon as your business KYB is approved.
          </p>
          <Link
            href="/dashboard/verification"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Go to verification
          </Link>
        </div>
      ) : null}

      {showWalletError ? (
        <div className="rounded-2xl border border-dashed border-[#D5D9E6] bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100/60 text-primary-600">
            <WalletIcon className="h-5 w-5" />
          </div>
          <p className="mt-4 text-base font-semibold text-[#1A2138]">Wallet temporarily unavailable</p>
          <p className="mt-2 text-sm text-[#7E8498]">
            We could not load your wallet details. Please try again.
          </p>
          <RetryWalletButton
            isRetrying={isWalletRetrying}
            onRetry={() => void retryWallet()}
          />
        </div>
      ) : null}

      {showEmpty ? (
        <div className="rounded-2xl border border-dashed border-[#D5D9E6] bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100/60 text-primary-600">
            <WalletIcon className="h-5 w-5" />
          </div>
          <p className="mt-4 text-base font-semibold text-[#1A2138]">Your wallet isn&apos;t ready yet</p>
          <p className="mt-2 text-sm text-[#7E8498]">
            We&apos;ll provision your ElementPay wallet automatically once your account is set up.
          </p>
          <RetryWalletButton
            isRetrying={isWalletRetrying}
            onRetry={() => void retryWallet()}
          />
        </div>
      ) : null}

      {showWallets ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <WalletList
              onFundWallet={handleFundWallet}
              onSendFromWallet={handleSendFromWallet}
              onReceiveToWallet={(address) => {
                setSelectedWallet(address);
                setReceiveOpen(true);
              }}
            />

            <IbanAccountsList />
          </div>

          <WalletDetailsPanel wallet={selectedWallet} />
        </div>
      ) : null}

      <WalletTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        source={selectedWallet}
        ownedWallets={wallets}
      />

      <ReceiveModal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        wallet={selectedWallet}
      />

      <CopyToast message={toast.message} visible={toast.visible} />
    </section>
  );
}
