"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Wallet selection state — the live wallet is sourced from AuthContext
 * (login response), this store only remembers the user's explicit choice
 * so it survives reloads. With a single backend-owned wallet per user this
 * is mostly vestigial, kept so existing call-sites keep type-checking.
 */
type WalletStoreState = {
  selectedAddress: string | null;
};

type WalletStoreActions = {
  setSelectedAddress: (address: string | null) => void;
  reset: () => void;
};

export type WalletStore = WalletStoreState & WalletStoreActions;

const STORAGE_KEY = "elementpay-wallets";

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      selectedAddress: null,

      setSelectedAddress: (address) => set({ selectedAddress: address }),

      reset: () => set({ selectedAddress: null }),
    }),
    {
      name: STORAGE_KEY,
    },
  ),
);
