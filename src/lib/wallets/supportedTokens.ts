export type SupportedToken = {
  symbol: string;
  name: string;
  chain: "Base" | "Lisk" | "Scroll" | "Arbitrum" | "Polygon" | "BNB Chain";
  chainId: number;
  chainLogo: string;
  tokenLogo: string;
  tokenAddress: `0x${string}`;
  decimals: number;
  explorerUrl: string;
};

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    chain: "Base",
    chainId: 8453,
    chainLogo: "/Base_Symbol_Blue.svg",
    tokenLogo: "/usd-coin-usdc-logo.png",
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    explorerUrl: "https://basescan.org",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chain: "Polygon",
    chainId: 137,
    chainLogo: "/polygon-matic-logo.svg",
    tokenLogo: "/usd-coin-usdc-logo.png",
    tokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
    explorerUrl: "https://polygonscan.com",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chain: "Lisk",
    chainId: 1135,
    chainLogo: "/lisk-lsk-logo.png",
    tokenLogo: "/tether-usdt-logo.png",
    tokenAddress: "0x05D032ac25d322df992303dCa074EE7392C117b9",
    decimals: 6,
    explorerUrl: "https://blockscout.lisk.com",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chain: "BNB Chain",
    chainId: 56,
    chainLogo: "/bnb-bnb-logo.png",
    tokenLogo: "/usd-coin-usdc-logo.png",
    tokenAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
    explorerUrl: "https://bscscan.com",
  },
];

export const EMBEDDED_WALLET_UNSUPPORTED_CHAINS: SupportedToken["chain"][] = ["Scroll", "Lisk"];

export function tokensForWallet(isEmbedded: boolean): SupportedToken[] {
  if (!isEmbedded) return SUPPORTED_TOKENS;
  return SUPPORTED_TOKENS.filter((t) => !EMBEDDED_WALLET_UNSUPPORTED_CHAINS.includes(t.chain));
}
