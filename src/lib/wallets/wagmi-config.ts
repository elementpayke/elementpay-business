import { http } from "wagmi";
import { arbitrum, base, bsc, polygon } from "wagmi/chains";
import type { Chain } from "wagmi/chains";
import { createConfig } from "@privy-io/wagmi";

export const lisk = {
  id: 1135,
  name: "Lisk",
  nativeCurrency: { name: "Lisk", symbol: "LSK", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.api.lisk.com"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://blockscout.lisk.com" } },
} as const satisfies Chain;

export const scroll = {
  id: 534352,
  name: "Scroll",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.scroll.io/"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://scrollscan.com" } },
} as const satisfies Chain;

/**
 * Privy owns the connectors — DO NOT register wagmi connectors here, that
 * causes duplicate instances and the Privy modal hangs.
 */
export const wagmiConfig = createConfig({
  chains: [base, lisk, scroll, arbitrum, polygon, bsc],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"),
    [lisk.id]: http("https://rpc.api.lisk.com"),
    [scroll.id]: http("https://rpc.scroll.io/"),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
    [polygon.id]: http("https://polygon-bor-rpc.publicnode.com"),
    [bsc.id]: http("https://bsc-dataseed.binance.org"),
  },
  ssr: true,
});
