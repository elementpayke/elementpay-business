"use client";

import { RefreshCw } from "lucide-react";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import type { SupportedCurrency } from "@/lib/currency/config";

function relativeTime(dateString: string | null) {
  if (!dateString) return "Syncing rates";

  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) return "Updated just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Updated ${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `Updated ${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
}

function CurrencyButton({
  currency,
  active,
  onClick,
}: {
  currency: SupportedCurrency;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-white text-[#171D32] shadow-[0_2px_10px_rgba(23,29,50,0.08)]"
          : "text-[#6B7287] hover:text-[#171D32]"
      }`}
    >
      {currency}
    </button>
  );
}

export default function CurrencySwitcher() {
  const { selectedCurrency, setSelectedCurrency, usdKesRate, isRefreshing, lastUpdated } =
    useCurrency();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E7EAF3] bg-[#F8F9FD] px-2 py-1">

      <div className="flex items-center rounded-xl">
        <CurrencyButton
          currency="USD"
          active={selectedCurrency === "USD"}
          onClick={() => setSelectedCurrency("USD")}
        />
        <CurrencyButton
          currency="KES"
          active={selectedCurrency === "KES"}
          onClick={() => setSelectedCurrency("KES")}
        />
      </div>

      <span
        className={`hidden sm:inline-flex ${isRefreshing ? "text-primary-600" : "text-[#8E93A7]"}`}
        aria-hidden
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
      </span>
    </div>
  );
}
