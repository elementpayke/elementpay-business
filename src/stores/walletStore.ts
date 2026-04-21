"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WalletPreference } from "@/lib/wallets/types";

/**
 * Wallet selection state — the *list* of wallets is derived live from Privy
 * via `useLiveWallets`, this store only owns the user's *choice*.
 */
type WalletStoreState = {
  /** Address of the wallet the user has explicitly chosen as active. */
  selectedAddress: string | null;
  /** User's preferred wallet *kind* for on-chain interactions. */
  walletPreference: WalletPreference;
};

type WalletStoreActions = {
  setSelectedAddress: (address: string | null) => void;
  setWalletPreference: (pref: WalletPreference) => void;
  reset: () => void;
};

export type WalletStore = WalletStoreState & WalletStoreActions;

const STORAGE_KEY = "elementpay-wallets";

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      selectedAddress: null,
      walletPreference: "embedded",

      setSelectedAddress: (address) => set({ selectedAddress: address }),
      setWalletPreference: (pref) => set({ walletPreference: pref }),

      reset: () => set({ selectedAddress: null, walletPreference: "embedded" }),
    }),
    {
      name: STORAGE_KEY,
    },
  ),
);
