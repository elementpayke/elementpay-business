"use client";

import { useEffect, useMemo } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { useLiveWallets } from "@/lib/wallets/useLiveWallets";
import type { LiveWallet } from "@/lib/wallets/types";

const same = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.toLowerCase() === b.toLowerCase());

/**
 * Single hook every feature should consume to access the active wallet.
 *
 * Resolution rules (mirrors dapp-staging behavior):
 *   1. If `selectedAddress` matches a live wallet, use it.
 *   2. Else honor `walletPreference`: embedded first, otherwise first external.
 *   3. Else fall back to the first available wallet.
 */
export function useSelectedWallet() {
  const liveResult = useLiveWallets();
  const { wallets, ready, authenticated, hasEmbedded } = liveResult;

  const selectedAddress = useWalletStore((s) => s.selectedAddress);
  const walletPreference = useWalletStore((s) => s.walletPreference);
  const setSelectedAddress = useWalletStore((s) => s.setSelectedAddress);
  const setWalletPreference = useWalletStore((s) => s.setWalletPreference);

  const selectedWallet: LiveWallet | null = useMemo(() => {
    if (wallets.length === 0) return null;

    const explicit = wallets.find((w) => same(w.address, selectedAddress));
    if (explicit) return explicit;

    if (walletPreference === "embedded") {
      const emb = wallets.find((w) => w.kind === "embedded");
      if (emb) return emb;
    }
    if (walletPreference === "external") {
      const ext = wallets.find((w) => w.kind === "external");
      if (ext) return ext;
    }
    return wallets[0];
  }, [wallets, selectedAddress, walletPreference]);

  // Seed selection on first load (default to the embedded ElementPay wallet
  // when present) and repair stale selections when a persisted address is no
  // longer linked.
  useEffect(() => {
    if (wallets.length === 0) return;
    if (!selectedAddress) {
      const emb = wallets.find((w) => w.kind === "embedded");
      const next = emb?.address ?? selectedWallet?.address ?? wallets[0]?.address ?? null;
      if (next) setSelectedAddress(next);
      return;
    }
    if (!wallets.some((w) => same(w.address, selectedAddress))) {
      setSelectedAddress(selectedWallet?.address ?? null);
    }
  }, [wallets, selectedAddress, selectedWallet, setSelectedAddress]);

  function setSelectedWallet(address: string) {
    const wallet = wallets.find((w) => same(w.address, address));
    setSelectedAddress(address);
    if (wallet) setWalletPreference(wallet.kind);
  }

  return {
    wallets,
    selectedWallet,
    selectedWalletAddress: selectedWallet?.address ?? null,
    walletPreference,
    setSelectedWallet,
    setWalletPreference,
    ready,
    authenticated,
    hasEmbedded,
    hasWallets: wallets.length > 0,
  };
}
