"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useDashboardSummary } from "@/lib/dashboard/hooks";
import {
  deriveBusinessWallet,
  KybNotApprovedError,
  type BusinessWallet,
} from "@/lib/wallets/businessWallet";

export type BusinessWalletState = {
  wallet: BusinessWallet | null;
  isLoading: boolean;
  isFetching: boolean;
  isRetrying: boolean;
  kybBlocked: boolean;
  error: Error | null;
  retryWallet: () => Promise<unknown>;
};

export function useBusinessWallet(): BusinessWalletState {
  const { loading: authLoading, walletAddress, kybVerified, kybSummary } = useAuth();
  const summary = useDashboardSummary();

  const kybBlocked = kybVerified === false && !walletAddress;

  const wallet = useMemo<BusinessWallet | null>(() => {
    if (authLoading) return null;
    if (kybBlocked) return null;
    if (!walletAddress && summary.isLoading) return null;
    return deriveBusinessWallet({
      walletAddress,
      userBalance:
        typeof summary.data?.totals.user_balance === "string"
          ? summary.data.totals.user_balance
          : null,
      kybVerified,
      kybStatus:
        typeof kybSummary?.kyb_status === "string" ? kybSummary.kyb_status : null,
    });
  }, [authLoading, kybBlocked, walletAddress, summary.data, summary.isLoading, kybVerified, kybSummary]);

  const error: Error | null = kybBlocked
    ? new KybNotApprovedError()
    : (summary.error as Error | null) ?? null;

  return {
    wallet,
    isLoading: authLoading || (!walletAddress && summary.isLoading && !kybBlocked),
    isFetching: summary.isFetching,
    isRetrying: summary.isRefetching,
    kybBlocked,
    error,
    retryWallet: () => summary.refetch(),
  };
}
