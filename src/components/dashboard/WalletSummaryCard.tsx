"use client";

import { ArrowRight, ChevronDown, EyeOff } from "lucide-react";
import Flag from "@/components/dashboard/Flag";

export default function WalletSummaryCard() {
  return (
    <section>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-muted px-4 py-3">
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground-muted">Wallet name</p>
            <button className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1 text-xs font-semibold text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              <Flag code="KE" size={14} />
              KES
              <ChevronDown className="h-3 w-3 text-foreground-muted" />
            </button>
          </div>

          <p className="mt-2 text-[11px] text-foreground-muted">Wallet balance:</p>

          <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
            <h2 className="text-[18px] font-bold leading-none tracking-[-0.03em] text-foreground">
              KES 3,354,114.81
            </h2>
            <button className="inline-flex items-center gap-1 text-xs text-primary-600 transition hover:text-primary-700">
              <EyeOff className="h-3.5 w-3.5" />
              Hide balance
            </button>
          </div>

          <p className="mt-1 text-xs text-foreground-muted">~ USD 26,000.89</p>

          <p className="mt-1 text-[11px] font-medium text-tertiary-600">
            @ 1 US Dollar = 129.00 Kenyan Shillings
          </p>

          <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 transition hover:text-primary-700">
            View wallet details
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Coins illustration — smaller on mobile */}
        <div className="pointer-events-none absolute bottom-0 right-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/coin.svg" alt="" width={120} height={90} aria-hidden />
        </div>
      </div>
    </section>
  );
}