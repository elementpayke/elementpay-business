"use client";

import { ArrowRight, ChevronDown, EyeOff } from "lucide-react";
import Flag from "@/components/dashboard/Flag";

export default function WalletSummaryCard() {
  return (
    <section>
      <div className="relative min-h-[220px] overflow-hidden rounded-[20px] border border-border bg-surface-muted px-6 py-5">
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground-muted">Wallet name</p>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              <Flag code="KE" size={16} />
              KES
              <ChevronDown className="h-3.5 w-3.5 text-foreground-muted" />
            </button>
          </div>

          <p className="mt-3 text-xs text-foreground-muted">Wallet balance:</p>

          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <h2 className="text-[28px] font-bold leading-none tracking-[-0.03em] text-foreground sm:text-[34px]">
              KES 3,354,114.81
            </h2>
            <button className="inline-flex items-center gap-1 text-sm text-primary-600 transition hover:text-primary-700">
              <EyeOff className="h-4 w-4" />
              Hide balance
            </button>
          </div>

          <p className="mt-2 text-sm text-foreground-muted">~ USD 26,000.89</p>

          <p className="mt-2 text-xs font-medium text-tertiary-600">
            @ 1 US Dollar = 129.00 Kenyan Shillings
          </p>

          <button className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition hover:text-primary-700">
            View wallet details
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Coins illustration */}
        <div className="pointer-events-none absolute bottom-0 right-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/coin.svg"
            alt=""
            width={200}
            height={150}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}