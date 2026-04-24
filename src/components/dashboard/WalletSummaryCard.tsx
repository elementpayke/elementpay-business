"use client";

import { ArrowRight, ChevronDown, EyeOff, ArrowUpRight, ArrowDownLeft, Hourglass, BadgeCheck } from "lucide-react";
import Flag from "@/components/dashboard/Flag";

const statCards = [
  {
    icon: <ArrowUpRight className="h-5 w-5 text-primary-500" />,
    value: "USD 126,000.89",
    label: "Total amount sent",
    bg: "bg-primary-100",
  },
  {
    icon: <ArrowDownLeft className="h-5 w-5 text-[#1E9F72]" />,
    value: "USD 426,000.89",
    label: "Total amount received",
    bg: "bg-[#E8F8EF] dark:bg-[#0d2b20]",
  },
  {
    icon: <Hourglass className="h-5 w-5 text-[#E0A020]" />,
    value: "USD 25,392.32",
    label: "Total pending amount",
    bg: "bg-[#FEF6E7] dark:bg-[#2e2008]",
  },
  {
    icon: <BadgeCheck className="h-5 w-5 text-primary-500" />,
    value: "283",
    label: "Total transactions completed",
    bg: "bg-primary-100",
  },
];

export default function WalletSummaryCard() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">

      {/* Main wallet card */}
      <div className="relative col-span-1 min-h-[220px] overflow-hidden rounded-[20px] border border-border bg-surface-muted px-6 py-5 sm:col-span-2 xl:col-span-1">
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

      {/* Stat cards */}
      {statCards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col justify-center gap-4 rounded-[20px] border border-border bg-surface p-5"
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.bg}`}>
            {card.icon}
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{card.value}</p>
            <p className="mt-1 text-xs text-foreground-muted">{card.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}