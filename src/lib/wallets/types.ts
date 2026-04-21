export type WalletKind = "embedded" | "external";

export type WalletPreference = "embedded" | "external";

export type ExternalConnectorType =
  | "metamask"
  | "coinbase_wallet"
  | "wallet_connect"
  | "rainbow"
  | "phantom"
  | "external";

/** Single source-of-truth wallet object the UI consumes. */
export type LiveWallet = {
  /** EVM address (lowercased canonical form). */
  address: `0x${string}`;
  /** Display label — ENS name, connector label, or short address fallback. */
  label: string;
  kind: WalletKind;
  /** Connector identifier reported by Privy (`walletClientType`). */
  connectorType: string;
  /** Active chain id reported by the wallet (when known). */
  chainId?: number;
  /** USDC balance on Base — primary balance shown in the UI. */
  balance: {
    symbol: string;
    chain: string;
    /** Human-readable formatted amount (e.g. "1234.56"). */
    formatted: string;
    /** Floating-point amount for math/aggregation. */
    amount: number;
    /** USD equivalent — USDC is a stablecoin so this matches `amount`. */
    usd: number;
    isLoading: boolean;
  };
};
