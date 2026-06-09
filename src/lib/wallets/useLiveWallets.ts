"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useBusinessWallet } from "@/lib/wallets/useBusinessWallet";
import { SUPPORTED_TOKENS } from "@/lib/wallets/supportedTokens";
import type { LiveWallet } from "@/lib/wallets/types";

const USDC_BASE = SUPPORTED_TOKENS.find((t) => t.symbol === "USDC" && t.chain === "Base")!;

function toHex(address: string): `0x${string}` {
  return address.toLowerCase() as `0x${string}`;
}

export function useLiveWallets(): {
  wallets: LiveWallet[];
  ready: boolean;
  authenticated: boolean;
  hasEmbedded: boolean;
  kybBlocked: boolean;
  walletError: Error | null;
  retryWallet: () => Promise<unknown>;
  isWalletRetrying: boolean;
} {
  const { authenticated, loading } = useAuth();
  const {
    wallet,
    isLoading,
    isFetching,
    isRetrying: isWalletRetrying,
    kybBlocked,
    error: walletError,
    retryWallet,
  } = useBusinessWallet();

  const wallets = useMemo<LiveWallet[]>(() => {
    if (!wallet?.wallet_address || !wallet.is_provisioned) return [];
    const usd = Number(wallet.balance_usd) || 0;
    const live: LiveWallet = {
      address: toHex(wallet.wallet_address),
      label: "ElementPay Wallet",
      kind: "embedded",
      connectorType: "elementpay",
      chainId: USDC_BASE.chainId,
      balance: {
        symbol: USDC_BASE.symbol,
        chain: USDC_BASE.chain,
        formatted: usd.toFixed(2),
        amount: usd,
        usd,
        isLoading: isFetching,
      },
    };
    return [live];
  }, [wallet, isFetching]);

  return {
    wallets,
    ready: !loading && !isLoading,
    authenticated,
    hasEmbedded: wallets.length > 0,
    kybBlocked,
    walletError,
    retryWallet,
    isWalletRetrying,
  };
}
