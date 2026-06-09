export type BusinessWallet = {
  wallet_address: string | null;
  privy_wallet_id: string | null;
  balance_usd: string;
  balance_formatted: string;
  currency: string;
  kyb_status: string;
  is_provisioned: boolean;
};

export class KybNotApprovedError extends Error {
  constructor(message = "KYB approval required to access the wallet.") {
    super(message);
    this.name = "KybNotApprovedError";
  }
}

export function deriveBusinessWallet(args: {
  walletAddress: string | null;
  userBalance: string | null | undefined;
  kybVerified: boolean | null;
  kybStatus: string | null;
}): BusinessWallet {
  const { walletAddress, userBalance, kybVerified, kybStatus } = args;
  const numeric = Number(userBalance ?? 0);
  const balance = Number.isFinite(numeric) ? numeric : 0;
  return {
    wallet_address: walletAddress,
    privy_wallet_id: null,
    balance_usd: balance.toFixed(2),
    balance_formatted: `$${balance.toFixed(2)}`,
    currency: "USD",
    kyb_status: kybStatus ?? (kybVerified ? "approved" : "pending"),
    is_provisioned: Boolean(walletAddress),
  };
}
