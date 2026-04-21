"use client";

import { Copy, ExternalLink } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import type { LiveWallet } from "@/lib/wallets/types";
import { shortAddress } from "@/lib/wallets/wallet-selection";

type CopyHandler = (value: string, message?: string) => void;

const CONNECTOR_LABEL: Record<string, string> = {
  privy: "Privy embedded wallet",
  metamask: "MetaMask",
  coinbase_wallet: "Coinbase Wallet",
  wallet_connect: "WalletConnect",
  rainbow: "Rainbow",
  phantom: "Phantom",
};

const EXPLORER_BASE = "https://basescan.org/address/";

function CopyIconButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7EAF3] bg-white text-primary-500 transition hover:border-primary-200 hover:bg-primary-100/40"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

function FieldRow({
  label,
  value,
  onCopy,
  copyLabel,
  trailing,
}: {
  label: string;
  value: ReactNode;
  onCopy?: () => void;
  copyLabel?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-[#FAFBFE] px-4 py-3">
      <span className="text-sm text-[#7E8498]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[#1A2138]">{value}</span>
        {trailing}
        {onCopy ? <CopyIconButton onClick={onCopy} label={copyLabel ?? `Copy ${label}`} /> : null}
      </div>
    </div>
  );
}

export default function AccountRails({
  wallet,
  copy,
}: {
  wallet: LiveWallet;
  copy: CopyHandler;
}) {
  const connectorLabel = CONNECTOR_LABEL[wallet.connectorType] ?? "External wallet";
  const explorerHref = `${EXPLORER_BASE}${wallet.address}`;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1C2238]">On-chain account</h3>
        <div className="space-y-2">
          <FieldRow
            label="Wallet label"
            value={wallet.label}
          />
          <FieldRow
            label="Wallet kind"
            value={
              <span
                className={
                  wallet.kind === "embedded"
                    ? "rounded-full border border-primary-200 bg-primary-100/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary-700"
                    : "rounded-full border border-[#E1E4EE] bg-[#F4F5F9] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5F667D]"
                }
              >
                {wallet.kind === "embedded" ? "Embedded" : "External"}
              </span>
            }
          />
          <FieldRow
            label="Connector"
            value={connectorLabel}
          />
          <FieldRow
            label="Address"
            value={shortAddress(wallet.address)}
            onCopy={() => copy(wallet.address, "Address copied")}
            copyLabel="Copy wallet address"
            trailing={
              <a
                href={explorerHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open address on BaseScan"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7EAF3] bg-white text-primary-500 transition hover:border-primary-200 hover:bg-primary-100/40"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1C2238]">Funding tokens</h3>
        <div className="space-y-2">
          <FieldRow
            label="USDC · Base"
            value={
              <span className="inline-flex items-center gap-2">
                <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={16} height={16} />
                {wallet.balance.formatted} USDC
              </span>
            }
          />
        </div>
        <p className="text-xs text-[#8E93A7]">
          Send USDC on Base to this address to top up your wallet. USDC is a 1:1 USD stablecoin.
        </p>
      </div>
    </div>
  );
}
