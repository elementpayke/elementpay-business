"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import type { LiveWallet } from "@/lib/wallets/types";

type SupportedCurrency = "USD" | "KES";
const AVAILABLE_CURRENCIES: SupportedCurrency[] = ["USD", "KES"];

export default function ConsolidatedBalanceCard({
  wallets,
}: {
  wallets: LiveWallet[];
}) {
  const { formatMoneyFromUsd, selectedCurrency } = useCurrency();

  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>(
    (selectedCurrency as SupportedCurrency) ?? "USD",
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoading =
    wallets.length > 0 && wallets.some((w) => w.balance.isLoading);

  const totalUsd = wallets.reduce((sum, w) => sum + (w.balance.usd || 0), 0);
  const walletCount = wallets.length;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <section
      className="
        rounded-2xl border px-6 py-5 transition-colors
        border-border bg-surface-muted
      "
    >
      <p className="text-sm font-medium text-foreground-muted">
        Total consolidated balance
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
          {isLoading && totalUsd === 0 ? (
            <span className="inline-block h-7 w-40 animate-pulse rounded-lg bg-surface" />
          ) : (
            formatMoneyFromUsd(totalUsd)
          )}
        </h2>

        {/* Currency selector */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="
              flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition
              border-border bg-surface text-foreground
              hover:border-primary-300
            "
          >
            {displayCurrency}
            <ChevronDown
              className={`h-4 w-4 text-foreground-muted transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div
              className="
                absolute right-0 top-full z-20 mt-1.5 w-24 rounded-xl border p-1 shadow-xl
                border-border bg-surface-muted
              "
            >
              {AVAILABLE_CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setDisplayCurrency(c);
                    setDropdownOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    c === displayCurrency
                      ? "bg-primary-100/60 font-semibold text-primary-700"
                      : "text-foreground-muted hover:bg-surface"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-2.5 text-sm text-foreground-muted">
        Across {walletCount} wallet{walletCount === 1 ? "" : "s"} · USDC on Base
        · Displaying in {displayCurrency}
      </p>
    </section>
  );
}