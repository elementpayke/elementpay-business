"use client";

import Image from "next/image";
import { ArrowDownToLine, Plus, Send, Wallet as WalletIcon } from "lucide-react";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { shortAddress } from "@/lib/wallets/wallet-selection";
import type { LiveWallet } from "@/lib/wallets/types";

type WalletCardProps = {
  wallet: LiveWallet;
  active: boolean;
  onSelect: () => void;
  onFund?: () => void;
  onSend?: () => void;
  onReceive?: () => void;
};

const CONNECTOR_ICON: Record<string, string> = {
  metamask: "/metamask.svg",
  coinbase_wallet: "/Base_Symbol_Blue.svg",
};

function ElementPayMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-500">
      <span className="block h-2.5 w-2.5 rounded-sm bg-white" />
    </span>
  );
}

export default function WalletCard({
  wallet,
  active,
  onSelect,
  onFund,
  onSend,
  onReceive,
}: WalletCardProps) {
  const { formatMoneyFromUsd, selectedCurrency } = useCurrency();
  const isEmbedded = wallet.kind === "embedded";
  const icon = CONNECTOR_ICON[wallet.connectorType];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={mergeClasses(
        "relative w-full overflow-hidden rounded-xl border bg-white p-4 text-left transition",
        active
          ? "border-primary-500 bg-primary-100/25 ring-2 ring-primary-100 shadow-[0_4px_12px_rgba(65,58,203,0.08)]"
          : "border-[#ECEEF5] hover:border-primary-200",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-primary-500"
        />
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEmbedded ? (
            <ElementPayMark />
          ) : icon ? (
            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#F4F5F9]">
              <Image src={icon} alt={wallet.connectorType} width={20} height={20} />
            </span>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F5F9] text-[#7E8498]">
              <WalletIcon className="h-3.5 w-3.5" />
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-[#1A2138]">{wallet.label}</p>
            <p className="text-[11px] text-[#8E93A7]">{shortAddress(wallet.address)}</p>
          </div>
        </div>
        <span
          className={mergeClasses(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
            active
              ? "border-primary-500 bg-primary-500 text-white"
              : isEmbedded
                ? "border-primary-200 bg-primary-100/60 text-primary-700"
                : "border-[#E1E4EE] bg-[#F4F5F9] text-[#5F667D]",
          )}
        >
          {active ? "Active" : isEmbedded ? "Embedded" : "External"}
        </span>
      </div>

      <p className="mt-4 text-xs text-[#8D92A6]">Wallet balance:</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-[22px] font-bold tracking-[-0.02em] text-[#1A2138]">
          {wallet.balance.isLoading ? "-" : formatAmount(wallet.balance.amount)}
        </p>
        <span className="text-sm font-medium text-[#5F667D]">{wallet.balance.symbol}</span>
      </div>
      <p className="mt-1 text-xs text-[#8E93A7]">
        ≈ {formatMoneyFromUsd(wallet.balance.usd)} · on {wallet.balance.chain} · {selectedCurrency}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#ECEEF5] pt-3 text-xs font-semibold text-primary-600">
        {onReceive ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onReceive();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onReceive();
              }
            }}
            className="inline-flex items-center gap-1.5 transition hover:text-primary-700"
          >
            <Plus className="h-3.5 w-3.5" /> Fund wallet
          </span>
        ) : null}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onSend?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onSend?.();
            }
          }}
          className="inline-flex items-center gap-1.5 transition hover:text-primary-700"
        >
          <Send className="h-3.5 w-3.5" /> Send payment
        </span>
      </div>
    </button>
  );
}

function formatAmount(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}
