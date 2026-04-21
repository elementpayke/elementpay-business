"use client";

import { useMemo } from "react";
import { usePrivy, useWallets, type ConnectedWallet } from "@privy-io/react-auth";
import { useBalance, useEnsName } from "wagmi";
import { base } from "wagmi/chains";
import { SUPPORTED_TOKENS } from "@/lib/wallets/supportedTokens";
import type { LiveWallet, WalletKind } from "@/lib/wallets/types";

const USDC_BASE = SUPPORTED_TOKENS.find((t) => t.symbol === "USDC" && t.chain === "Base")!;

const toLowerAddress = (a: string): `0x${string}` => a.toLowerCase() as `0x${string}`;

const kindOf = (w: ConnectedWallet): WalletKind =>
  w.walletClientType === "privy" ? "embedded" : "external";

const labelFor = (w: ConnectedWallet, ens?: string | null) => {
  if (ens) return ens;
  if (kindOf(w) === "embedded") return "Embedded wallet";
  switch (w.walletClientType) {
    case "metamask":
      return "MetaMask";
    case "coinbase_wallet":
      return "Coinbase Wallet";
    case "wallet_connect":
      return "WalletConnect";
    case "rainbow":
      return "Rainbow";
    case "phantom":
      return "Phantom";
    default:
      return "External wallet";
  }
};

function useWalletBalance(address: `0x${string}` | undefined) {
  const { data, isLoading } = useBalance({
    address,
    token: USDC_BASE.tokenAddress,
    chainId: base.id,
    query: {
      enabled: Boolean(address),
      staleTime: 30_000,
      refetchInterval: 60_000,
      retry: 1,
    },
  });

  const formatted = data?.formatted ?? "0";
  const amount = parseFloat(formatted) || 0;

  return {
    symbol: USDC_BASE.symbol,
    chain: USDC_BASE.chain,
    formatted,
    amount,
    usd: amount, // USDC is a 1:1 USD stablecoin
    isLoading,
  };
}

function useEnsLabel(address: `0x${string}` | undefined) {
  const { data } = useEnsName({
    address,
    query: { enabled: Boolean(address), staleTime: 5 * 60_000, retry: 1 },
  });
  return data ?? null;
}

/**
 * Bridges Privy/wagmi state into a stable list of `LiveWallet` objects.
 * One slot per wallet so React-hooks-rules stays satisfied.
 */
function useLiveWallet(w: ConnectedWallet | undefined): LiveWallet | null {
  const address = w ? toLowerAddress(w.address) : undefined;
  const ens = useEnsLabel(address);
  const balance = useWalletBalance(address);

  if (!w || !address) return null;
  return {
    address,
    label: labelFor(w, ens),
    kind: kindOf(w),
    connectorType: w.walletClientType,
    chainId: w.chainId ? Number(w.chainId.split(":").pop() ?? base.id) : base.id,
    balance,
  };
}

/**
 * Returns the merged set of Privy wallets (embedded + linked external) along
 * with their USDC.Base balances. Hook order is stable by capping at MAX_SLOTS.
 */
const MAX_WALLET_SLOTS = 6;

export function useLiveWallets(): {
  wallets: LiveWallet[];
  ready: boolean;
  authenticated: boolean;
  hasEmbedded: boolean;
} {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  // Stabilize order: embedded first, then linked-external in the order Privy
  // returns them, then pad to fixed slot count to keep hook order constant.
  const ordered = useMemo(() => {
    const embedded = wallets.filter((w) => w.walletClientType === "privy");
    const external = wallets.filter((w) => w.walletClientType !== "privy");
    return [...embedded, ...external].slice(0, MAX_WALLET_SLOTS);
  }, [wallets]);

  const padded = [...ordered, ...Array(MAX_WALLET_SLOTS - ordered.length).fill(undefined)] as Array<
    ConnectedWallet | undefined
  >;

  const slot0 = useLiveWallet(padded[0]);
  const slot1 = useLiveWallet(padded[1]);
  const slot2 = useLiveWallet(padded[2]);
  const slot3 = useLiveWallet(padded[3]);
  const slot4 = useLiveWallet(padded[4]);
  const slot5 = useLiveWallet(padded[5]);

  const live = [slot0, slot1, slot2, slot3, slot4, slot5].filter(
    (w): w is LiveWallet => w !== null,
  );

  return {
    wallets: live,
    ready,
    authenticated,
    hasEmbedded: live.some((w) => w.kind === "embedded"),
  };
}
