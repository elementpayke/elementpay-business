"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Send } from "lucide-react";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import type { LiveWallet } from "@/lib/wallets/types";

type SupportedCurrency = "USD" | "KES" | "NGN" | "GHS";
const WALLET_CURRENCIES: SupportedCurrency[] = ["USD", "KES", "NGN", "GHS"];

const CURRENCY_FLAG: Record<SupportedCurrency, string> = {
  USD: "🇺🇸",
  KES: "🇰🇪",
  NGN: "🇳🇬",
  GHS: "🇬🇭",
};

function formatBalance(n: number, currency: SupportedCurrency) {
  return `${currency} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatUsd(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function WalletCard({
  wallet,
  active,
  onSelect,
  onSend,
  onReceive,
}: {
  wallet: LiveWallet;
  active: boolean;
  onSelect: () => void;
  onSend?: () => void;
  onReceive?: () => void;
}) {
  const [currency, setCurrency] = useState<SupportedCurrency>("KES");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Guard during loading
  if (!wallet) return null;

  return (
    <div
      onClick={onSelect}
      className={mergeClasses(
        "relative w-full rounded-2xl border bg-surface transition-colors cursor-pointer",
        active
          ? "border-primary-500/40 bg-surface"
          : "border-border hover:bg-surface-muted"
      )}
    >
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-primary-500 rounded-r-full" />
      )}

      <div className="p-4 space-y-3">

        {/* HEADER: wallet name + currency pill */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground truncate">
            {wallet.label}
          </p>

          <div
            ref={ref}
            className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface transition-colors"
            >
              <span>{CURRENCY_FLAG[currency]}</span>
              <span>{currency}</span>
              <ChevronDown className="h-3 w-3 text-foreground-muted" />
            </button>

            {open && (
              <div className="absolute right-0 mt-1 z-10 w-28 rounded-lg border border-border bg-surface shadow-lg p-1">
                {WALLET_CURRENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setCurrency(c); setOpen(false); }}
                    className={mergeClasses(
                      "w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded-md transition-colors",
                      c === currency
                        ? "bg-primary-100 text-primary-600 font-medium"
                        : "text-foreground-muted hover:bg-surface-muted"
                    )}
                  >
                    <span>{CURRENCY_FLAG[c]}</span>
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BALANCE */}
        <div className="space-y-0.5">
          <p className="text-xs text-foreground-muted">Wallet balance:</p>

          <p className="text-lg font-bold text-foreground">
            {wallet.balance.isLoading ? (
              <span className="inline-block h-5 w-36 animate-pulse rounded bg-surface-muted" />
            ) : (
              formatBalance(wallet.balance.amount, currency)
            )}
          </p>

          <p className="text-xs text-foreground-muted">
            ~ USD {formatUsd(wallet.balance.usd)}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-5 border-t border-border pt-3">
          {onReceive && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onReceive(); }}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Fund wallet
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSend?.(); }}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            Send payment
          </button>
        </div>

      </div>
    </div>
  );
}