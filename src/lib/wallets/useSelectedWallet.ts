"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { useLiveWallets } from "@/lib/wallets/useLiveWallets";
import type { LiveWallet } from "@/lib/wallets/types";

const same = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.toLowerCase() === b.toLowerCase());

/**
 * Single hook every feature should consume to access the active wallet.
 *
 * The dashboard now has exactly one wallet per user (sourced from the login
 * response), so resolution collapses to "the live wallet, if it exists".
 */
export function useSelectedWallet() {
  const liveResult = useLiveWallets();
  const {
    wallets,
    ready,
    authenticated,
    hasEmbedded,
    kybBlocked,
    walletError,
    retryWallet,
    isWalletRetrying,
  } = liveResult;

  const selectedAddress = useWalletStore((s) => s.selectedAddress);
  const setSelectedAddress = useWalletStore((s) => s.setSelectedAddress);

  const selectedWallet: LiveWallet | null = wallets[0] ?? null;

  // Keep the persisted selection in sync with the live wallet so any code
  // still reading `selectedAddress` directly stays consistent.
  useEffect(() => {
    if (!selectedWallet) {
      if (selectedAddress) setSelectedAddress(null);
      return;
    }
    if (!same(selectedAddress, selectedWallet.address)) {
      setSelectedAddress(selectedWallet.address);
    }
  }, [selectedWallet, selectedAddress, setSelectedAddress]);

  function setSelectedWallet(_address: string) {
    void _address;
    // Only one wallet exists today; selection is a no-op but kept so callers
    // don't need to branch.
  }

  function setWalletPreference(_pref: "embedded" | "external") {
    void _pref;
    // Wallet preference is meaningless with a single wallet source.
  }

  return {
    wallets,
    selectedWallet,
    selectedWalletAddress: selectedWallet?.address ?? null,
    walletPreference: "embedded" as const,
    setSelectedWallet,
    setWalletPreference,
    ready,
    authenticated,
    hasEmbedded,
    hasWallets: wallets.length > 0,
    kybBlocked,
    walletError,
    retryWallet,
    isWalletRetrying,
  };
}
